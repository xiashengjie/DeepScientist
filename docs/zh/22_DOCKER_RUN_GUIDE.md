# DeepScientist Docker 启动指南

本文档详细说明如何使用 `docker run` 命令直接启动 DeepScientist 容器。

## 目录

- [快速启动](#快速启动)
- [完整参数说明](#完整参数说明)
- [环境变量配置](#环境变量配置)
- [卷挂载配置](#卷挂载配置)
- [网络配置](#网络配置)
- [多种启动场景](#多种启动场景)
- [常用管理命令](#常用管理命令)
- [故障排查](#故障排查)

---

## 快速启动

### 最简启动

```bash
docker run -d \
  --name deepscientist \
  -p 20999:20999 \
  -e VOLCENGINE_ARK_API_KEY=your_api_key_here \
  deepscientist:latest
```

### 带持久化存储

```bash
docker run -d \
  --name deepscientist \
  -p 20999:20999 \
  -v deepscientist-home:/home/deepscientist/DeepScientist \
  -v deepscientist-codex:/home/deepscientist/.codex \
  -e VOLCENGINE_ARK_API_KEY=your_api_key_here \
  --restart unless-stopped \
  deepscientist:latest
```

---

## 完整参数说明

### 基础参数

| 参数 | 说明 | 示例 |
|------|------|------|
| `-d` | 后台运行（守护进程模式） | `-d` |
| `--name` | 容器名称 | `--name deepscientist` |
| `--restart` | 重启策略 | `--restart unless-stopped` |

### 端口映射

| 参数 | 说明 | 示例 |
|------|------|------|
| `-p` | 端口映射（宿主机:容器） | `-p 20999:20999` |
| `-p 0.0.0.0:20999:20999` | 指定绑定地址 | 绑定所有接口 |
| `-p 127.0.0.1:20999:20999` | 仅本地访问 | 仅本地可访问 |

### 环境变量

| 参数 | 说明 | 示例 |
|------|------|------|
| `-e` | 设置单个环境变量 | `-e KEY=value` |
| `--env-file` | 从文件加载环境变量 | `--env-file .env` |

### 卷挂载

| 参数 | 说明 | 示例 |
|------|------|------|
| `-v` | 挂载卷或目录 | `-v data:/path` |
| `--mount` | 更详细的挂载配置 | 见下方示例 |

### 资源限制

| 参数 | 说明 | 示例 |
|------|------|------|
| `--memory` | 内存限制 | `--memory 8g` |
| `--cpus` | CPU 限制 | `--cpus 4` |
| `--memory-swap` | 内存+交换空间限制 | `--memory-swap 10g` |

---

## 环境变量配置

### 必需环境变量

DeepScientist 需要配置大模型提供商的 API Key：

```bash
# 火山引擎 Ark（推荐国内用户）
-e VOLCENGINE_ARK_API_KEY=your_volcengine_api_key

# 或 阿里云百炼
-e BAILIAN_API_KEY=your_bailian_api_key

# 或 OpenAI
-e OPENAI_API_KEY=your_openai_api_key
```

### 可选环境变量

```bash
# DeepScientist 主目录
-e DEEPSCIENTIST_HOME=/home/deepscientist/DeepScientist

# 指定 Codex 配置文件中的 profile 名称
-e DEEPSCIENTIST_CODEX_PROFILE=ark

# Python pip 镜像（国内推荐）
-e UV_INDEX_URL=https://mirrors.aliyun.com/pypi/simple/
```

### 使用环境变量文件

创建 `.env` 文件：

```bash
# .env 文件内容
VOLCENGINE_ARK_API_KEY=your_api_key_here
DEEPSCIENTIST_CODEX_PROFILE=ark
```

启动时引用：

```bash
docker run -d \
  --name deepscientist \
  -p 20999:20999 \
  --env-file .env \
  deepscientist:latest
```

---

## 卷挂载配置

### 推荐挂载目录

| 容器路径 | 说明 | 挂载建议 |
|----------|------|----------|
| `/home/deepscientist/DeepScientist` | 主数据目录（quests、memory、config） | 必须持久化 |
| `/home/deepscientist/.codex` | Codex 配置目录 | 建议持久化 |

### 使用命名卷（推荐）

```bash
docker run -d \
  --name deepscientist \
  -p 20999:20999 \
  -v deepscientist-data:/home/deepscientist/DeepScientist \
  -v deepscientist-codex:/home/deepscientist/.codex \
  deepscientist:latest
```

### 使用主机目录

```bash
docker run -d \
  --name deepscientist \
  -p 20999:20999 \
  -v /path/to/data:/home/deepscientist/DeepScientist \
  -v /path/to/codex:/home/deepscientist/.codex \
  deepscientist:latest
```

### 使用 --mount 语法

```bash
docker run -d \
  --name deepscientist \
  -p 20999:20999 \
  --mount type=volume,src=deepscientist-data,dst=/home/deepscientist/DeepScientist \
  --mount type=volume,src=deepscientist-codex,dst=/home/deepscientist/.codex \
  deepscientist:latest
```

---

## 网络配置

### 基础网络

```bash
# 绑定所有接口（允许外部访问）
-p 0.0.0.0:20999:20999

# 仅本地访问（安全）
-p 127.0.0.1:20999:20999

# 使用不同端口
-p 30000:20999
```

### 使用自定义网络

```bash
# 创建网络
docker network create deepscientist-net

# 启动容器连接到网络
docker run -d \
  --name deepscientist \
  --network deepscientist-net \
  -p 20999:20999 \
  deepscientist:latest
```

### 使用主机网络模式

```bash
# 直接使用主机网络（不需要端口映射）
docker run -d \
  --name deepscientist \
  --network host \
  deepscientist:latest
```

> 注意：主机网络模式下，容器将直接使用宿主机的网络栈，无需端口映射，但可能有安全风险。

---

## 多种启动场景

### 场景一：开发测试（简单模式）

```bash
docker run -d \
  --name deepscientist \
  -p 20999:20999 \
  -e VOLCENGINE_ARK_API_KEY=your_api_key \
  deepscientist:latest
```

### 场景二：生产部署（完整配置）

```bash
docker run -d \
  --name deepscientist \
  -p 20999:20999 \
  -v deepscientist-data:/home/deepscientist/DeepScientist \
  -v deepscientist-codex:/home/deepscientist/.codex \
  -e VOLCENGINE_ARK_API_KEY=your_api_key \
  -e DEEPSCIENTIST_CODEX_PROFILE=ark \
  --restart unless-stopped \
  --memory 8g \
  --cpus 4 \
  --health-cmd "curl -f http://127.0.0.1:20999/api/health || exit 1" \
  --health-interval 30s \
  --health-timeout 10s \
  --health-retries 3 \
  --log-driver json-file \
  --log-opt max-size=10m \
  --log-opt max-file=3 \
  deepscientist:latest
```

### 场景三：仅本地访问（安全模式）

```bash
docker run -d \
  --name deepscientist \
  -p 127.0.0.1:20999:20999 \
  -v deepscientist-data:/home/deepscientist/DeepScientist \
  -e VOLCENGINE_ARK_API_KEY=your_api_key \
  --restart unless-stopped \
  deepscientist:latest
```

### 场景四：使用反向代理

```bash
# 启动 DeepScientist（仅本地访问）
docker run -d \
  --name deepscientist \
  -p 127.0.0.1:20999:20999 \
  -v deepscientist-data:/home/deepscientist/DeepScientist \
  --restart unless-stopped \
  --network web-proxy \
  -e VOLCENGINE_ARK_API_KEY=your_api_key \
  deepscientist:latest

# 然后配置 Nginx/Traefik/Caddy 反向代理
```

### 场景五：多实例部署

```bash
# 实例 1
docker run -d \
  --name deepscientist-1 \
  -p 20999:20999 \
  -v deepscientist-data-1:/home/deepscientist/DeepScientist \
  -e VOLCENGINE_ARK_API_KEY=your_api_key \
  deepscientist:latest

# 实例 2
docker run -d \
  --name deepscientist-2 \
  -p 21000:20999 \
  -v deepscientist-data-2:/home/deepscientist/DeepScientist \
  -e VOLCENGINE_ARK_API_KEY=your_api_key \
  deepscientist:latest
```

### 场景六：挂载自定义 Codex 配置

```bash
docker run -d \
  --name deepscientist \
  -p 20999:20999 \
  -v deepscientist-data:/home/deepscientist/DeepScientist \
  -v /path/to/your/codex-config.toml:/home/deepscientist/.codex/config.toml:ro \
  -e VOLCENGINE_ARK_API_KEY=your_api_key \
  deepscientist:latest
```

---

## 常用管理命令

### 容器管理

```bash
# 查看容器状态
docker ps -a --filter name=deepscientist

# 查看容器详情
docker inspect deepscientist

# 查看日志
docker logs deepscientist
docker logs deepscientist -f  # 实时查看
docker logs deepscientist --tail 100  # 最后 100 行

# 进入容器
docker exec -it deepscientist /bin/bash

# 重启容器
docker restart deepscientist

# 停止容器
docker stop deepscientist

# 删除容器
docker rm deepscientist
docker rm -f deepscientist  # 强制删除（运行中也可删除）
```

### 卷管理

```bash
# 列出所有卷
docker volume ls

# 查看卷详情
docker volume inspect deepscientist-data

# 删除卷（注意：会删除数据）
docker volume rm deepscientist-data

# 删除未使用的卷
docker volume prune
```

### 镜像管理

```bash
# 查看镜像
docker images deepscientist

# 删除镜像
docker rmi deepscientist:latest

# 构建镜像
docker build -t deepscientist:latest .

# 导出镜像
docker save deepscientist:latest | gzip > deepscientist.tar.gz

# 导入镜像
docker load < deepscientist.tar.gz
```

### 健康检查

```bash
# 查看健康状态
docker inspect --format='{{.State.Health.Status}}' deepscientist

# 查看健康检查日志
docker inspect --format='{{json .State.Health}}' deepscientist | jq

# 手动健康检查
curl http://127.0.0.1:20999/api/health
```

---

## 故障排查

### 容器无法启动

```bash
# 查看详细错误
docker logs deepscientist

# 查看容器退出原因
docker inspect --format='{{.State.ExitCode}}' deepscientist
docker inspect --format='{{.State.Error}}' deepscientist
```

### 端口被占用

```bash
# 查看端口占用
netstat -tlnp | grep 20999

# 使用其他端口
docker run -d --name deepscientist -p 21000:20999 deepscientist:latest
```

### API Key 未生效

```bash
# 检查环境变量
docker exec deepscientist env | grep API_KEY

# 重新设置环境变量后重启
docker rm -f deepscientist
docker run -d --name deepscientist -p 20999:20999 -e VOLCENGINE_ARK_API_KEY=correct_key deepscientist:latest
```

### 数据丢失

```bash
# 检查卷是否存在
docker volume ls | grep deepscientist

# 如果使用了匿名卷，数据可能在以下位置
docker inspect deepscientist --format='{{range .Mounts}}{{.Type}}: {{.Source}} -> {{.Destination}}{{"\n"}}{{end}}'
```

### Codex 配置问题

```bash
# 进入容器检查配置
docker exec -it deepscientist /bin/bash
cat ~/.codex/config.toml

# 测试 Codex 连接
docker exec -it deepscientist codex exec --profile ark --json --cd /tmp --skip-git-repo-check -
```

### 内存不足

```bash
# 查看容器资源使用
docker stats deepscientist

# 增加内存限制
docker rm -f deepscientist
docker run -d --name deepscientist --memory 16g -p 20999:20999 deepscientist:latest
```

---

## Docker Compose 与 Docker Run 对比

| 功能 | Docker Compose | Docker Run |
|------|---------------|------------|
| 配置方式 | YAML 文件 | 命令行参数 |
| 启动命令 | `docker-compose up -d` | `docker run -d ...` |
| 停止命令 | `docker-compose down` | `docker stop && docker rm` |
| 日志查看 | `docker-compose logs -f` | `docker logs -f` |
| 重启 | `docker-compose restart` | `docker restart` |
| 多容器编排 | 支持 | 需要手动管理 |
| 环境变量 | `.env` 文件自动加载 | 需要 `-e` 或 `--env-file` |
| 配置可读性 | 高（YAML 格式） | 低（命令行参数） |

---

## 最佳实践

1. **始终使用命名卷**：确保数据持久化
2. **使用 --restart**：确保容器自动重启
3. **设置资源限制**：避免容器占用过多资源
4. **使用环境变量文件**：便于管理和安全
5. **配置健康检查**：及时发现服务异常
6. **限制日志大小**：避免日志文件过大
7. **仅本地访问 + 反向代理**：更安全的生产部署方式

---

## 完整示例脚本

### 启动脚本 (start.sh)

```bash
#!/bin/bash

# 配置变量
IMAGE_NAME="deepscientist:latest"
CONTAINER_NAME="deepscientist"
HOST_PORT=20999
API_KEY="your_api_key_here"  # 或从环境变量读取

# 停止并删除旧容器
docker rm -f $CONTAINER_NAME 2>/dev/null

# 启动新容器
docker run -d \
  --name $CONTAINER_NAME \
  -p $HOST_PORT:20999 \
  -v deepscientist-data:/home/deepscientist/DeepScientist \
  -v deepscientist-codex:/home/deepscientist/.codex \
  -e VOLCENGINE_ARK_API_KEY=$API_KEY \
  -e DEEPSCIENTIST_CODEX_PROFILE=ark \
  --restart unless-stopped \
  --memory 8g \
  --cpus 4 \
  --log-driver json-file \
  --log-opt max-size=10m \
  --log-opt max-file=3 \
  $IMAGE_NAME

# 检查启动状态
echo "Waiting for service to start..."
sleep 5

# 健康检查
if curl -s http://127.0.0.1:$HOST_PORT/api/health | grep -q '"status":"ok"'; then
  echo "DeepScientist started successfully!"
  echo "Web UI: http://127.0.0.1:$HOST_PORT"
else
  echo "Failed to start DeepScientist. Check logs:"
  docker logs $CONTAINER_NAME
fi
```

### 停止脚本 (stop.sh)

```bash
#!/bin/bash

CONTAINER_NAME="deepscientist"

echo "Stopping $CONTAINER_NAME..."
docker stop $CONTAINER_NAME
docker rm $CONTAINER_NAME
echo "Container stopped and removed."
```

### 备份脚本 (backup.sh)

```bash
#!/bin/bash

BACKUP_DIR="/backup/deepscientist"
DATE=$(date +%Y%m%d_%H%M%S)

# 创建备份目录
mkdir -p $BACKUP_DIR

# 备份数据卷
docker run --rm \
  -v deepscientist-data:/data \
  -v $BACKUP_DIR:/backup \
  alpine tar czf /backup/deepscientist-data-$DATE.tar.gz -C /data .

docker run --rm \
  -v deepscientist-codex:/data \
  -v $BACKUP_DIR:/backup \
  alpine tar czf /backup/deepscientist-codex-$DATE.tar.gz -C /data .

echo "Backup completed: $BACKUP_DIR"
```

---

## 相关文档

- [00_QUICK_START.md](./00_QUICK_START.md) - 快速开始指南
- [01_SETTINGS_REFERENCE.md](./01_SETTINGS_REFERENCE.md) - 配置参考
- [15_CODEX_PROVIDER_SETUP.md](./15_CODEX_PROVIDER_SETUP.md) - Codex 提供商配置
