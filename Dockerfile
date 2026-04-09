# DeepScientist Docker Image
# Build: docker build -t deepscientist:latest .
# Run:   docker run -d -p 20999:20999 -v deepscientist-data:/home/deepscientist deepscientist:latest

# ============================================
# Stage 1: Build UI and TUI bundles
# ============================================
FROM swr.cn-north-4.myhuaweicloud.com/ddn-k8s/docker.io/node:20-alpine AS builder

WORKDIR /build

# Configure Alpine mirror (China mirror)
RUN sed -i 's/dl-cdn.alpinelinux.org/mirrors.aliyun.com/g' /etc/apk/repositories

# Install build dependencies
RUN apk add --no-cache git python3 py3-pip

# Configure npm mirror (China mirror)
RUN npm config set registry https://registry.npmmirror.com

# Copy package files
COPY package*.json ./
COPY .npmrc ./
COPY src/ui/package*.json ./src/ui/
COPY src/tui/package*.json ./src/tui/

# Install root dependencies
RUN npm ci --omit=dev --no-audit --no-fund

# Build Web UI
COPY src/ui ./src/ui
RUN cd src/ui && npm ci --include=dev && npm run build && npm prune --omit=dev

# Build TUI
COPY src/tui ./src/tui
RUN cd src/tui && npm ci --include=dev && npm run build && npm prune --omit=dev

# ============================================
# Stage 2: Production image
# ============================================
FROM swr.cn-north-4.myhuaweicloud.com/ddn-k8s/docker.io/node:20-alpine

LABEL maintainer="ResearAI"
LABEL description="Unirsearch - Local-first autonomous research studio"
LABEL version="1.5.17"

# Configure Alpine mirror (China mirror)
RUN sed -i 's/dl-cdn.alpinelinux.org/mirrors.aliyun.com/g' /etc/apk/repositories

# Configure pip mirror (China mirror)
RUN mkdir -p ~/.pip && \
    echo '[global]' > ~/.pip/pip.conf && \
    echo 'index-url = https://mirrors.aliyun.com/pypi/simple/' >> ~/.pip/pip.conf && \
    echo 'trusted-host = mirrors.aliyun.com' >> ~/.pip/pip.conf

# Install system dependencies
RUN apk add --no-cache \
    git \
    python3 \
    py3-pip \
    py3-virtualenv \
    curl \
    bash \
    shadow \
    su-exec \
    && rm -rf /var/cache/apk/*

# Configure npm mirror (China mirror)
RUN npm config set registry https://registry.npmmirror.com

# Install Codex CLI (version 0.57.0 for chat-wire provider compatibility)
# This version works with MiniMax, GLM, Volcengine Ark, Alibaba Bailian
RUN npm install -g @openai/codex@0.57.0

# Create non-root user for security
RUN addgroup -S deepscientist && \
    adduser -S -G deepscientist -h /home/deepscientist deepscientist

# Create DeepScientist home directories
RUN mkdir -p /home/deepscientist/DeepScientist/{runtime,config,memory,quests,logs,cache,plugins} && \
    mkdir -p /home/deepscientist/DeepScientist/runtime/tools/uv/bin && \
    mkdir -p /home/deepscientist/.codex && \
    mkdir -p /home/deepscientist/.local/bin

# Install uv to DeepScientist's expected location
# DeepScientist expects uv at: /home/deepscientist/DeepScientist/runtime/tools/uv/bin/uv
# Use pip to install uv (most reliable method)
RUN pip3 install --no-cache-dir --break-system-packages uv && \
    UV_BIN=$(which uv) && \
    cp "$UV_BIN" /home/deepscientist/DeepScientist/runtime/tools/uv/bin/uv && \
    chmod +x /home/deepscientist/DeepScientist/runtime/tools/uv/bin/uv

# Also install uv to system path as backup
RUN ln -sf /home/deepscientist/DeepScientist/runtime/tools/uv/bin/uv /usr/local/bin/uv

WORKDIR /app

# Copy package files and install dependencies
COPY package*.json ./
COPY .npmrc ./
RUN npm ci --omit=dev --no-audit --no-fund

# Copy built UI and TUI bundles from builder stage
COPY --from=builder /build/src/ui/dist ./src/ui/dist
COPY --from=builder /build/src/tui/dist ./src/tui/dist

# Copy source code
COPY bin ./bin
COPY src/deepscientist ./src/deepscientist
COPY src/prompts ./src/prompts
COPY src/skills ./src/skills
COPY pyproject.toml uv.lock uv.toml ./
COPY AGENTS.md README.md LICENSE ./

# Copy docs (optional but recommended)
COPY docs ./docs
COPY assets ./assets

# Copy Codex config example
COPY assets/connectors/codex-config.example.toml ./codex-config.example.toml

# Set permissions for all files
RUN chown -R deepscientist:deepscientist /home/deepscientist && \
    chown -R deepscientist:deepscientist /app

# Configure npm for non-root user
RUN mkdir -p /home/deepscientist/.npm && \
    chown -R deepscientist:deepscientist /home/deepscientist/.npm

# Set environment variables
ENV NODE_ENV=production \
    DEEPSCIENTIST_HOME=/home/deepscientist/DeepScientist \
    DEEPSCIENTIST_DOCKER=1 \
    PATH="/home/deepscientist/DeepScientist/runtime/tools/uv/bin:/home/deepscientist/.local/bin:/usr/local/bin:${PATH}" \
    NPM_CONFIG_REGISTRY=https://registry.npmmirror.com \
    UV_INDEX_URL=https://mirrors.aliyun.com/pypi/simple/

# Verify uv is accessible
RUN uv --version

# Expose the default port
EXPOSE 20999

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
    CMD curl -f http://127.0.0.1:20999/api/health || exit 1

# Create entrypoint script
RUN printf '#!/bin/sh\n\
set -e\n\
\n\
echo "[Entrypoint] Starting DeepScientist initialization..."\n\
\n\
# Create runtime directories if not exist\n\
mkdir -p "${DEEPSCIENTIST_HOME}/"{runtime,config,memory,quests,logs,cache,plugins}\n\
\n\
# Initialize Codex config\n\
mkdir -p /home/deepscientist/.codex\n\
if [ -f /app/codex-config.example.toml ]; then\n\
    # Always copy config template to ensure correct configuration\n\
    cp /app/codex-config.example.toml /home/deepscientist/.codex/config.toml\n\
    echo "[Entrypoint] Codex config initialized from template"\n\
fi\n\
\n\
# Log environment check for debugging\n\
echo "[Entrypoint] Checking API Key configuration..."\n\
if [ -n "$VOLCENGINE_ARK_API_KEY" ]; then\n\
    echo "[Entrypoint] VOLCENGINE_ARK_API_KEY is set (length: ${#VOLCENGINE_ARK_API_KEY})"\n\
fi\n\
if [ -n "$BAILIAN_API_KEY" ]; then\n\
    echo "[Entrypoint] BAILIAN_API_KEY is set (length: ${#BAILIAN_API_KEY})"\n\
fi\n\
if [ -n "$MINIMAX_API_KEY" ]; then\n\
    echo "[Entrypoint] MINIMAX_API_KEY is set (length: ${#MINIMAX_API_KEY})"\n\
fi\n\
if [ -n "$GLM_API_KEY" ]; then\n\
    echo "[Entrypoint] GLM_API_KEY is set (length: ${#GLM_API_KEY})"\n\
fi\n\
if [ -n "$OPENAI_API_KEY" ]; then\n\
    echo "[Entrypoint] OPENAI_API_KEY is set (length: ${#OPENAI_API_KEY})"\n\
fi\n\
\n\
# Fix permissions\n\
if [ "$(id -u)" = "0" ]; then\n\
    chown -R deepscientist:deepscientist "${DEEPSCIENTIST_HOME}"\n\
    chown -R deepscientist:deepscientist /home/deepscientist/.codex\n\
fi\n\
\n\
echo "[Entrypoint] Starting application..."\n\
exec "$@"\n' > /entrypoint.sh && chmod +x /entrypoint.sh

# Switch to non-root user
USER deepscientist

# Entry point
ENTRYPOINT ["/entrypoint.sh"]

# Default command - run daemon in foreground mode
# Using 'daemon' subcommand to keep the process in foreground
CMD ["node", "bin/ds.js", "daemon", "--host", "0.0.0.0", "--port", "20999"]
