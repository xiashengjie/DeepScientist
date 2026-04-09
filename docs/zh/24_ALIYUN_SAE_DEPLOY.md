# DeepScientist 阿里云 SAE 部署指南

本文档详细说明如何在阿里云 SAE（Serverless 应用引擎）上部署 DeepScientist。

## 目录

- [SAE 环境特点](#sae-环境特点)
- [部署前准备](#部署前准备)
- [部署步骤](#部署步骤)
- [环境变量配置](#环境变量配置)
- [常见问题排查](#常见问题排查)

---

## SAE 环境特点

SAE 是 Serverless 环境，有以下特点需要注意：

| 特点 | 影响 |
|------|------|
| 无交互式终端 | 无法运行 `codex login` |
| 容器临时性 | 需要持久化存储或配置预置 |
| 环境变量注入 | 必须通过环境变量传递 API Key |
| 启动超时 | 默认 90 秒，需要优化启动速度 |

---

## 部署前准备

### 1. 准备镜像

将镜像推送到阿里云 ACR：

```bash
# 登录 ACR
docker login --username=your_account registry.cn-shanghai.aliyuncs.com

# 构建镜像
docker build -t registry.cn-shanghai.aliyuncs.com/deepscientist/deepscientist:latest .

# 推送镜像
docker push registry.cn-shanghai.aliyuncs.com/deepscientist/deepscientist:latest
```

### 2. 准备持久化存储（可选但推荐）

创建 NAS 文件系统用于数据持久化：

```bash
# 创建 NAS 文件系统
aliyun nas CreateFileSystem \
  --FileSystemType standard \
  --StorageType Performance \
  --RegionId cn-shanghai \
  --ZoneId cn-shanghai-a
```

---

## 部署步骤

### 方式一：控制台部署

#### Step 1: 创建应用

1. 登录 [SAE 控制台](https://sae.console.aliyun.com/)
2. 点击 **创建应用**
3. 填写基本信息：
   - 应用名称：`deepscientist`
   - 命名空间：选择或创建

#### Step 2: 配置应用

1. **镜像配置**：
   - 选择 **镜像仓库**
   - 选择已推送的镜像

2. **规格配置**：
   - vCPU：**2 核**（推荐）
   - 内存：**4 GB**（推荐）
   - 最小实例数：**1**
   - 最大实例数：**3**

3. **启动命令**：
   ```bash
   node bin/ds.js daemon --host 0.0.0.0 --port 20999
   ```

4. **端口配置**：
   - 端口：`20999`
   - 协议：`TCP`

#### Step 3: 配置环境变量（关键！）

点击 **环境变量** → **添加环境变量**：

| 变量名 | 变量值 | 说明 |
|--------|--------|------|
| `VOLCENGINE_ARK_API_KEY` | `your_api_key` | 火山引擎 API Key |
| `DEEPSCIENTIST_CODEX_PROFILE` | `ark` | 使用的 Codex profile |
| `DEEPSCIENTIST_HOME` | `/home/deepscientist/DeepScientist` | 数据目录（可选） |

> ⚠️ **重要**：必须配置正确的 API Key 和 PROFILE，否则启动会失败！

#### Step 4: 配置网络

1. **公网访问**：
   - 开启 **公网访问**
   - 或配置 SLB

2. **安全组**：
   - 确保安全组入方向允许 20999 端口

#### Step 5: 高级配置（可选）

1. **健康检查**：
   - 类型：HTTP
   - 路径：`/api/health`
   - 端口：`20999`
   - 初始延迟：`60` 秒

2. **日志采集**：
   - 开启日志服务

#### Step 6: 确认创建

点击 **确认创建**，等待部署完成。

---

### 方式二：Terraform 部署

创建 `main.tf`：

```hcl
provider "alicloud" {
  region = "cn-shanghai"
}

# 创建 SAE 应用
resource "alicloud_sae_application" "deepscientist" {
  app_name          = "deepscientist"
  app_description   = "DeepScientist autonomous research studio"
  namespace_id      = alicloud_sae_namespace.main.id
  deploy_type       = "Image"
  image_url         = "registry.cn-shanghai.aliyuncs.com/deepscientist/deepscientist:latest"
  package_type      = "Image"
  package_version   = "latest"
  
  # 资源规格
  cpu               = 2000
  memory            = 4096
  replicas          = 1
  min_ready_instance_ratio = 0
  
  # 端口配置
  web_container_port = 20999
  
  # 启动命令
  command           = "node bin/ds.js daemon --host 0.0.0.0 --port 20999"
  command_args      = ""
  
  # 环境变量（关键！）
  environment_variables = {
    VOLCENGINE_ARK_API_KEY    = var.volcengine_api_key
    DEEPSCIENTIST_CODEX_PROFILE = "ark"
    DEEPSCIENTIST_HOME        = "/home/deepscientist/DeepScientist"
  }
  
  # 健康检查
  liveness_probe {
    type          = "HTTP"
    port          = 20999
    path          = "/api/health"
    initial_delay = 60
    period        = 30
    timeout       = 10
    threshold     = 3
  }
  
  readiness_probe {
    type          = "HTTP"
    port          = 20999
    path          = "/api/health"
    initial_delay = 30
    period        = 10
    timeout       = 5
    threshold     = 3
  }
  
  tags = {
    Environment = "production"
    Application = "deepscientist"
  }
}

# 创建命名空间
resource "alicloud_sae_namespace" "main" {
  namespace_id   = "deepscientist-ns"
  namespace_name = "deepscientist-namespace"
}

# 创建公网 SLB
resource "alicloud_sae_load_balancer_internet" "main" {
  app_id     = alicloud_sae_application.deepscientist.id
  port       = 80
  target_port = 20999
  protocol   = "TCP"
}

# 变量定义
variable "volcengine_api_key" {
  type        = string
  description = "Volcengine Ark API Key"
  sensitive   = true
}

output "access_url" {
  value = alicloud_sae_load_balancer_internet.main.ip
  description = "DeepScientist access URL"
}
```

创建 `terraform.tfvars`：

```hcl
volcengine_api_key = "your_api_key_here"
```

部署：

```bash
# 初始化
terraform init

# 预览
terraform plan

# 部署
terraform apply
```

---

### 方式三：CLI 部署

```bash
# 创建应用
aliyun sae CreateApplication \
  --AppName deepscientist \
  --NamespaceId cn-shanghai \
  --DeployType Image \
  --ImageUrl registry.cn-shanghai.aliyuncs.com/deepscientist/deepscientist:latest \
  --Cpu 2000 \
  --Memory 4096 \
  --Replicas 1 \
  --WebContainerPort 20999 \
  --Command "node bin/ds.js daemon --host 0.0.0.0 --port 20999" \
  --EnvironmentVariables '{"VOLCENGINE_ARK_API_KEY":"your_api_key","DEEPSCIENTIST_CODEX_PROFILE":"ark"}'
```

---

## 环境变量配置

### 必需环境变量

DeepScientist 需要至少配置一个模型提供商的 API Key：

```bash
# 方式1：火山引擎（推荐国内用户）
VOLCENGINE_ARK_API_KEY=your_key_here
DEEPSCIENTIST_CODEX_PROFILE=ark

# 方式2：阿里云百炼
BAILIAN_API_KEY=your_key_here
DEEPSCIENTIST_CODEX_PROFILE=bailian

# 方式3：MiniMax
MINIMAX_API_KEY=your_key_here
DEEPSCIENTIST_CODEX_PROFILE=m27

# 方式4：OpenAI
OPENAI_API_KEY=your_key_here
```

### 可选环境变量

```bash
# 数据目录
DEEPSCIENTIST_HOME=/home/deepscientist/DeepScientist

# Python 镜像（国内加速）
UV_INDEX_URL=https://mirrors.aliyun.com/pypi/simple/

# HTTP 代理（如需要）
HTTP_PROXY=http://proxy-server:port
HTTPS_PROXY=http://proxy-server:port
```

### SAE 控制台配置示例

在 SAE 控制台的 **环境变量** 页面配置：

```
VOLCENGINE_ARK_API_KEY=3bb2f4ea-xxxx-xxxx-xxxx-xxxxxxxxxxxx
DEEPSCIENTIST_CODEX_PROFILE=ark
DEEPSCIENTIST_HOME=/home/deepscientist/DeepScientist
```

> ⚠️ **注意**：API Key 不要包含多余空格或引号！

---

## 常见问题排查

### 问题1：Codex is not ready

**错误信息**：
```
ERROR DeepScientist could not start because Codex is not ready yet.
ERROR Codex did not answer the startup hello probe within 90 seconds.
```

**原因分析**：
1. API Key 未配置或配置错误
2. 环境变量名称错误
3. Profile 配置不匹配

**解决方案**：

```bash
# 检查环境变量配置
# 在 SAE 控制台 → 应用详情 → 环境变量
# 确认以下配置：
# 1. VOLCENGINE_ARK_API_KEY = 正确的 API Key（不是 "your_key" 占位符）
# 2. DEEPSCIENTIST_CODEX_PROFILE = ark

# 查看启动日志
# SAE 控制台 → 应用详情 → 实例详情 → 日志
# 查找 "[Entrypoint] Checking API Key configuration..."
# 确认 API Key 长度正确
```

### 问题2：API Key 长度为 0

**错误日志**：
```
[Entrypoint] VOLCENGINE_ARK_API_KEY is set (length: 0)
```

**原因**：环境变量值为空

**解决方案**：
- 检查 SAE 环境变量配置
- 确保 API Key 值正确填写
- 不要使用引号包裹值

### 问题3：Profile 不存在

**错误信息**：
```
ERROR Codex profile `xxx` did not complete the startup hello probe
```

**原因**：指定的 profile 在配置文件中不存在

**解决方案**：
- 确认 `DEEPSCIENTIST_CODEX_PROFILE` 的值与 Codex 配置中的 profile 名称匹配
- 可选值：`ark`、`bailian`、`m27`、`m25`、`glm`

### 问题4：启动超时

**错误信息**：
```
ERROR Codex did not answer the startup hello probe within 90 seconds.
```

**原因**：
1. 资源不足（CPU/内存）
2. 网络不通
3. API Key 无效

**解决方案**：

```bash
# 1. 增加资源配置
# SAE 控制台 → 应用详情 → 基本信息 → 修改规格
# 建议：2核 4GB 起步

# 2. 检查网络
# 确保 SAE 应用可以访问外网
# 检查 VPC、安全组配置

# 3. 验证 API Key
# 手动测试 API 是否可用
curl -H "Authorization: Bearer your_api_key" \
  https://ark.cn-beijing.volces.com/api/coding/v3/models
```

### 问题5：镜像拉取失败

**错误信息**：
```
ImagePullBackOff
```

**解决方案**：
1. 确认镜像已推送到 ACR
2. 如使用私有仓库，配置镜像拉取密钥
3. 检查镜像地址是否正确

### 问题6：健康检查失败

**错误信息**：
```
Liveness probe failed
```

**解决方案**：
- 增加初始延迟时间（建议 60 秒以上）
- 检查端口是否正确（20999）
- 查看应用日志排查具体错误

---

## 快速诊断清单

部署前请确认以下配置：

- [ ] 镜像已推送到 ACR
- [ ] API Key 环境变量已配置（值正确，无多余空格/引号）
- [ ] DEEPSCIENTIST_CODEX_PROFILE 与使用的 API Key 匹配
- [ ] 资源规格：CPU >= 1核，内存 >= 2GB
- [ ] 端口配置：20999
- [ ] 健康检查：初始延迟 >= 60 秒
- [ ] 网络配置：允许外网访问

---

## 配置示例截图说明

### SAE 环境变量配置

在 **应用详情** → **环境变量** 页面：

```
键                          值
-------------------------------------------
VOLCENGINE_ARK_API_KEY     3bb2f4ea-e1a1-xxxx-xxxx-xxxxxxxxxxxx
DEEPSCIENTIST_CODEX_PROFILE    ark
DEEPSCIENTIST_HOME         /home/deepscientist/DeepScientist
```

### SAE 端口配置

在 **应用详情** → **基本信息** → **端口配置**：

```
端口: 20999
协议: TCP
```

### SAE 健康检查配置

在 **应用详情** → **高级配置** → **健康检查**：

```
类型: HTTP
端口: 20999
路径: /api/health
初始延迟: 60 秒
检查间隔: 30 秒
超时时间: 10 秒
```

---

## 相关文档

- [22_DOCKER_RUN_GUIDE.md](./22_DOCKER_RUN_GUIDE.md) - Docker 启动指南
- [23_ALIYUN_SERVERLESS_DEPLOY.md](./23_ALIYUN_SERVERLESS_DEPLOY.md) - 阿里云 Serverless 部署
- [15_CODEX_PROVIDER_SETUP.md](./15_CODEX_PROVIDER_SETUP.md) - Codex 提供商配置
