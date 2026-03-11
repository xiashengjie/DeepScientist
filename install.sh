#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SOURCE_ROOT="$SCRIPT_DIR"
DEFAULT_BASE_DIR="${DEEPSCIENTIST_BASE_DIR:-${DEEPSCIENTIST_HOME:-$HOME/DeepScientist}}"
ENV_INSTALL_DIR="${DEEPSCIENTIST_INSTALL_DIR:-}"
ENV_BIN_DIR="${DEEPSCIENTIST_BIN_DIR:-}"
BASE_DIR="$DEFAULT_BASE_DIR"
INSTALL_DIR=""
BIN_DIR="${ENV_BIN_DIR:-$HOME/.local/bin}"
DIR_SET=0
INSTALL_DIR_SET=0
BIN_DIR_SET=0

usage() {
  cat <<'EOF'
DeepScientist installer

Usage:
  bash install.sh [--dir BASE_DIR] [--install-dir INSTALL_DIR] [--bin-dir BIN_DIR]

Options:
  --dir PATH          Base install directory. Code is installed into PATH/cli.
  --install-dir PATH  Exact install directory for the bundled CLI tree.
  --bin-dir PATH      Directory for launcher wrappers.
  -h, --help          Show this help message.

Defaults:
  Base install dir: ~/DeepScientist
  Install dir:      ~/DeepScientist/cli
  Bin dir:          ~/.local/bin

Notes:
  - This installer deploys the current working tree into a separate install directory.
  - Runtime data lives under ~/DeepScientist by default.
  - `DEEPSCIENTIST_BASE_DIR`, `DEEPSCIENTIST_INSTALL_DIR`, and `DEEPSCIENTIST_BIN_DIR`
    can be used from `npm run install:local` as well.
EOF
}

while [ $# -gt 0 ]; do
  case "$1" in
    --dir)
      if [ -z "${2:-}" ]; then
        echo "--dir requires a path" >&2
        exit 1
      fi
      BASE_DIR="$2"
      DIR_SET=1
      shift 2
      ;;
    --install-dir)
      if [ -z "${2:-}" ]; then
        echo "--install-dir requires a path" >&2
        exit 1
      fi
      INSTALL_DIR="$2"
      INSTALL_DIR_SET=1
      shift 2
      ;;
    --bin-dir)
      if [ -z "${2:-}" ]; then
        echo "--bin-dir requires a path" >&2
        exit 1
      fi
      BIN_DIR="$2"
      BIN_DIR_SET=1
      shift 2
      ;;
    -h|--help)
      usage
      exit 0
      ;;
    *)
      echo "Unknown argument: $1" >&2
      usage >&2
      exit 1
      ;;
  esac
done

if [ "$DIR_SET" -eq 1 ] && [ "$INSTALL_DIR_SET" -eq 1 ]; then
  echo "--dir and --install-dir cannot be used together" >&2
  exit 1
fi

if [ "$INSTALL_DIR_SET" -eq 1 ]; then
  BASE_DIR="$(dirname "$INSTALL_DIR")"
elif [ "$DIR_SET" -eq 1 ]; then
  INSTALL_DIR="$BASE_DIR/cli"
elif [ -n "$ENV_INSTALL_DIR" ]; then
  INSTALL_DIR="$ENV_INSTALL_DIR"
  BASE_DIR="$(dirname "$INSTALL_DIR")"
else
  INSTALL_DIR="$BASE_DIR/cli"
fi

if [ "$DIR_SET" -eq 1 ] && [ "$BIN_DIR_SET" -eq 0 ] && [ -z "$ENV_BIN_DIR" ]; then
  BIN_DIR="$BASE_DIR/bin"
fi

print_step() {
  printf '[install] %s\n' "$1"
}

resolve_path() {
  if command -v python3 >/dev/null 2>&1; then
    python3 - "$1" <<'PY'
import os
import sys
print(os.path.realpath(sys.argv[1]))
PY
    return
  fi
  if command -v python >/dev/null 2>&1; then
    python - "$1" <<'PY'
import os
import sys
print(os.path.realpath(sys.argv[1]))
PY
    return
  fi
  if command -v realpath >/dev/null 2>&1; then
    realpath "$1" 2>/dev/null || echo "$1"
    return
  fi
  echo "$1"
}

require_command() {
  if ! command -v "$1" >/dev/null 2>&1; then
    echo "Missing required command: $1" >&2
    exit 1
  fi
}

safe_remove_dir() {
  local target="$1"
  if [ -z "$target" ] || [ "$target" = "/" ] || [ "$target" = "$HOME" ]; then
    echo "Refusing to remove directory: $target" >&2
    exit 1
  fi
  rm -rf "$target"
}

stop_existing_install() {
  if [ -x "$INSTALL_DIR/bin/ds" ]; then
    "$INSTALL_DIR/bin/ds" --stop >/dev/null 2>&1 || true
    return
  fi
  if [ -f "$INSTALL_DIR/bin/ds.js" ]; then
    node "$INSTALL_DIR/bin/ds.js" --stop >/dev/null 2>&1 || true
  fi
}

copy_source_tree() {
  local target="$1"
  mkdir -p "$target"
  if command -v tar >/dev/null 2>&1; then
    tar -C "$SOURCE_ROOT" -cf - \
      --exclude='./.git' \
      --exclude='./.pytest_cache' \
      --exclude='./ui' \
      --exclude='./src/ui/node_modules' \
      --exclude='./src/ui/dist' \
      --exclude='./src/ui/lib/node_modules' \
      --exclude='./src/tui/node_modules' \
      --exclude='./src/tui/dist' \
      --exclude='./src/deepscientist.egg-info' \
      . | tar -C "$target" -xf -
  else
    cp -R "$SOURCE_ROOT"/. "$target"/
  fi
}

prune_tree() {
  local target="$1"
  rm -rf \
    "$target/.git" \
    "$target/.pytest_cache" \
    "$target/ui" \
    "$target/src/ui/node_modules" \
    "$target/src/ui/dist" \
    "$target/src/ui/lib/node_modules" \
    "$target/src/tui/node_modules" \
    "$target/src/tui/dist" \
    "$target/src/deepscientist.egg-info"
  find "$target" -type d -name '__pycache__' -prune -exec rm -rf {} +
  find "$target" -type f \( -name '*.pyc' -o -name '*.pyo' \) -delete
}

build_ui() {
  print_step "Building web UI in install tree"
  npm --prefix "$1/src/ui" install --include=dev --no-audit --no-fund
  npm --prefix "$1/src/ui" run build
  rm -rf "$1/src/ui/node_modules" "$1/src/ui/lib/node_modules"
}

build_tui() {
  print_step "Building TUI in install tree"
  npm --prefix "$1/src/tui" install --include=dev --no-audit --no-fund
  npm --prefix "$1/src/tui" run build
  npm --prefix "$1/src/tui" prune --omit=dev --no-audit --no-fund
}

write_install_wrappers() {
  local target="$1"
  mkdir -p "$target/bin"
  for command_name in ds ds-cli research resear; do
    cat >"$target/bin/$command_name" <<EOF
#!/usr/bin/env bash
set -euo pipefail
SCRIPT_DIR="\$(cd "\$(dirname "\${BASH_SOURCE[0]}")" && pwd)"
NODE_BIN="\${DEEPSCIENTIST_NODE:-node}"
exec "\$NODE_BIN" "\$SCRIPT_DIR/ds.js" "\$@"
EOF
    chmod +x "$target/bin/$command_name"
  done
}

write_global_wrapper() {
  local target_path="$1"
  local command_name="$2"
  if [ -L "$target_path" ] || [ -f "$target_path" ]; then
    rm -f "$target_path"
  fi
  cat >"$target_path" <<EOF
#!/usr/bin/env bash
set -euo pipefail
exec "$INSTALL_DIR/bin/$command_name" "\$@"
EOF
  chmod +x "$target_path"
}

require_command node
require_command npm
if ! command -v python3 >/dev/null 2>&1 && ! command -v python >/dev/null 2>&1; then
  echo "Python 3 is required to run DeepScientist." >&2
  exit 1
fi

SOURCE_ROOT_RESOLVED="$(resolve_path "$SOURCE_ROOT")"
INSTALL_DIR_RESOLVED="$(resolve_path "$INSTALL_DIR")"
if [ "$SOURCE_ROOT_RESOLVED" = "$INSTALL_DIR_RESOLVED" ]; then
  echo "Install dir must be different from the development checkout: $INSTALL_DIR" >&2
  exit 1
fi

STAGING_DIR="${INSTALL_DIR}.staging.$$"
safe_remove_dir "$STAGING_DIR"
trap 'rm -rf "$STAGING_DIR"' EXIT

print_step "Preparing staging directory"
mkdir -p "$BASE_DIR"
copy_source_tree "$STAGING_DIR"
prune_tree "$STAGING_DIR"
build_ui "$STAGING_DIR"
build_tui "$STAGING_DIR"
write_install_wrappers "$STAGING_DIR"

print_step "Replacing previous install"
stop_existing_install
safe_remove_dir "$INSTALL_DIR"
mv "$STAGING_DIR" "$INSTALL_DIR"
trap - EXIT

print_step "Writing launcher wrappers"
mkdir -p "$BIN_DIR"
write_global_wrapper "$BIN_DIR/ds" "ds"
write_global_wrapper "$BIN_DIR/ds-cli" "ds-cli"
write_global_wrapper "$BIN_DIR/research" "research"
write_global_wrapper "$BIN_DIR/resear" "resear"

print_step "Install complete"
printf 'Install dir: %s\n' "$INSTALL_DIR"
printf 'Bin dir: %s\n' "$BIN_DIR"
printf 'Run: %s\n' "$BIN_DIR/ds"
if [[ ":$PATH:" != *":$BIN_DIR:"* ]]; then
  printf 'Add to PATH if needed: export PATH="%s:$PATH"\n' "$BIN_DIR"
fi
