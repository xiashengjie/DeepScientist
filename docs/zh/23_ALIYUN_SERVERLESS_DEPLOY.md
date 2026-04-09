# Uniresearch 阿里云 Serverless 部署指南

本文档详细说明如何在阿里云 Serverless 平台上部署 Uniresearch。

## 目录

- [部署方案选择](#部署方案选择)
- [方案一：ACK Serverless 部署](#方案一ack-serverless-部署)
- [方案二：弹性容器实例 ECI 部署](#方案二弹性容器实例-eci-部署)
- [方案三：函数计算 FC 部署（受限）](#方案三函数计算-fc 部署受限)
- [成本优化建议](#成本优化建议)
- [常见问题](#常见问题)

---

## 部署方案选择

阿里云 Serverless 提供多种部署方式，针对 Uniresearch 的特点：

| 方案 | 适用场景 | 优点 | 缺点 |
|------|----------|------|------|
| **ACK Serverless** | 长期运行、需要 K8s 生态 | 自动扩缩容、服务发现、配置管理 | 需要了解 K8s |
| **ECI 弹性容器实例** | 简单部署、灵活配置 | 开箱即用、按量付费 | 缺少编排能力 |
| **函数计算 FC** | 事件驱动、短时任务 | 极低成本 | 有运行时间限制，不适合长期服务 |

**推荐方案**：ACK Serverless 或 ECI（Uniresearch 是长期运行的服务）

---

## 方案一：ACK Serverless 部署

### 1.1 前置条件

- 阿里云账号（已实名认证）
- 开通以下服务：
  - 容器服务 Kubernetes 版（ACK）
  - 容器镜像服务 ACR
  - NAS 文件存储（用于持久化数据）

### 1.2 创建 ACK Serverless 集群

#### 通过控制台创建

1. 登录 [阿里云容器服务控制台](https://cs.console.aliyun.com/)
2. 点击 **集群** → **创建集群**
3. 选择 **ACK Serverless** 类型
4. 配置集群：
   - 集群名称：`Uniresearch-cluster`
   - 地域：选择离您最近的地域（如华东2上海）
   - 专有网络：新建或选择已有 VPC
   - 交换机：选择或创建交换机
5. 点击 **确认订单** 完成创建

#### 通过 CLI 创建

```bash
# 安装阿里云 CLI
# https://help.aliyun.com/document_detail/139508.html

# 配置凭证
aliyun configure

# 创建 ACK Serverless 集群
aliyun cs CreateManagedKubernetesCluster \
  --Name Uniresearch-cluster \
  --RegionId cn-shanghai \
  --VpcId vpc-xxxxxx \
  --VSwitchIds '["vsw-xxxxxx"]' \
  --ClusterType Ask
```

### 1.3 推送镜像到 ACR

#### 创建容器镜像仓库

```bash
# 创建命名空间
aliyun cr CreateNamespace \
  --NamespaceName Uniresearch \
  --NamespacePublic false

# 创建镜像仓库
aliyun cr CreateRepository \
  --RepoNamespace Uniresearch \
  --RepoName Uniresearch \
  --RepoType PRIVATE \
  --Summary "Uniresearch autonomous research studio"
```

#### 推送镜像

```bash
# 登录 ACR
docker login --username=your_username registry.cn-shanghai.aliyuncs.com

# 标记镜像
docker tag Uniresearch:latest registry.cn-shanghai.aliyuncs.com/Uniresearch/Uniresearch:latest

# 推送镜像
docker push registry.cn-shanghai.aliyuncs.com/Uniresearch/Uniresearch:latest
```

### 1.4 创建 NAS 存储卷

#### 创建 NAS 文件系统

```bash
# 创建 NAS 文件系统
aliyun nas CreateFileSystem \
  --FileSystemType standard \
  --StorageType Performance \
  --RegionId cn-shanghai \
  --ZoneId cn-shanghai-a \
  --Description "Uniresearch data storage"

# 记录返回的 FileSystemId
```

#### 创建存储卷和 PV

创建文件 `nas-pv.yaml`：

```yaml
apiVersion: v1
kind: PersistentVolume
metadata:
  name: Uniresearch-nas-pv
spec:
  capacity:
    storage: 100Gi
  accessModes:
    - ReadWriteMany
  storageClassName: nas
  flexVolume:
    driver: alicloud/nas
    options:
      server: "your-nas-server.cn-shanghai.nas.aliyuncs.com:/Uniresearch"
      path: "/"
      vers: "4.0"
---
apiVersion: v1
kind: PersistentVolumeClaim
metadata:
  name: Uniresearch-nas-pvc
spec:
  accessModes:
    - ReadWriteMany
  storageClassName: nas
  resources:
    requests:
      storage: 100Gi
```

### 1.5 创建 Secret 存储敏感信息

```bash
# 创建 Secret 存储 API Key
kubectl create secret generic Uniresearch-secrets \
  --from-literal=VOLCENGINE_ARK_API_KEY=your_api_key_here \
  --from-literal=Uniresearch_CODEX_PROFILE=ark
```

### 1.6 创建部署配置

创建文件 `deployment.yaml`：

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: Uniresearch
  labels:
    app: Uniresearch
spec:
  replicas: 1
  selector:
    matchLabels:
      app: Uniresearch
  template:
    metadata:
      labels:
        app: Uniresearch
    spec:
      containers:
      - name: Uniresearch
        image: registry.cn-shanghai.aliyuncs.com/Uniresearch/Uniresearch:latest
        ports:
        - containerPort: 20999
          protocol: TCP
        env:
        - name: Uniresearch_HOME
          value: /home/Uniresearch/Uniresearch
        - name: VOLCENGINE_ARK_API_KEY
          valueFrom:
            secretKeyRef:
              name: Uniresearch-secrets
              key: VOLCENGINE_ARK_API_KEY
        - name: Uniresearch_CODEX_PROFILE
          valueFrom:
            secretKeyRef:
              name: Uniresearch-secrets
              key: Uniresearch_CODEX_PROFILE
        resources:
          requests:
            cpu: "1"
            memory: "2Gi"
          limits:
            cpu: "4"
            memory: "8Gi"
        volumeMounts:
        - name: data-volume
          mountPath: /home/Uniresearch/Uniresearch
        - name: codex-config
          mountPath: /home/Uniresearch/.codex
        livenessProbe:
          httpGet:
            path: /api/health
            port: 20999
          initialDelaySeconds: 60
          periodSeconds: 30
          timeoutSeconds: 10
          failureThreshold: 3
        readinessProbe:
          httpGet:
            path: /api/health
            port: 20999
          initialDelaySeconds: 30
          periodSeconds: 10
      volumes:
      - name: data-volume
        persistentVolumeClaim:
          claimName: Uniresearch-nas-pvc
      - name: codex-config
        emptyDir: {}
---
apiVersion: v1
kind: Service
metadata:
  name: Uniresearch-service
  annotations:
    service.beta.kubernetes.io/alibaba-cloud-loadbalancer-spec: "slb.s1.small"
spec:
  type: LoadBalancer
  externalTrafficPolicy: Local
  ports:
  - port: 80
    targetPort: 20999
    protocol: TCP
  selector:
    app: Uniresearch
---
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: Uniresearch-hpa
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: Uniresearch
  minReplicas: 1
  maxReplicas: 3
  metrics:
  - type: Resource
    resource:
      name: cpu
      target:
        type: Utilization
        averageUtilization: 70
  - type: Resource
    resource:
      name: memory
      target:
        type: Utilization
        averageUtilization: 80
```

### 1.7 部署应用

```bash
# 配置 kubectl 连接集群
aliyun cs GET /k8s/$cluster_id/user_config | kubeconfig

# 部署应用
kubectl apply -f deployment.yaml

# 查看部署状态
kubectl get pods -l app=Uniresearch
kubectl get svc Uniresearch-service

# 查看日志
kubectl logs -l app=Uniresearch -f
```

### 1.8 配置域名和 HTTPS

创建 Ingress 配置（使用阿里云 SLB）：

```yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: Uniresearch-ingress
  annotations:
    cert-manager.io/cluster-issuer: letsencrypt-prod
    nginx.ingress.kubernetes.io/ssl-redirect: "true"
spec:
  ingressClassName: nginx
  tls:
  - hosts:
    - Uniresearch.yourdomain.com
    secretName: Uniresearch-tls
  rules:
  - host: Uniresearch.yourdomain.com
    http:
      paths:
      - path: /
        pathType: Prefix
        backend:
          service:
            name: Uniresearch-service
            port:
              number: 80
```

---

## 方案二：弹性容器实例 ECI 部署

### 2.1 前置条件

- 阿里云账号
- 开通 ECI 服务
- 创建 VPC 和交换机

### 2.2 创建 ECI 实例

#### 通过控制台创建

1. 登录 [ECI 控制台](https://eci.console.aliyun.com/)
2. 点击 **创建容器组**
3. 配置容器组：
   - 名称：`Uniresearch`
   - 地域：华东2（上海）
   - 交换机：选择已创建的交换机
   - 安全组：选择或创建安全组（开放 20999 端口）

#### 通过 CLI 创建

创建配置文件 `eci-config.json`：

```json
{
  "ContainerGroupName": "Uniresearch",
  "RegionId": "cn-shanghai",
  "SecurityGroupId": "sg-xxxxxx",
  "VSwitchId": "vsw-xxxxxx",
  "Container": [
    {
      "Name": "Uniresearch",
      "Image": "registry.cn-shanghai.aliyuncs.com/Uniresearch/Uniresearch:latest",
      "Cpu": 4,
      "Memory": 8,
      "Port": [
        {
          "Port": 20999,
          "Protocol": "TCP"
        }
      ],
      "EnvironmentVar": [
        {
          "Key": "VOLCENGINE_ARK_API_KEY",
          "Value": "your_api_key_here"
        },
        {
          "Key": "Uniresearch_CODEX_PROFILE",
          "Value": "ark"
        },
        {
          "Key": "Uniresearch_HOME",
          "Value": "/home/Uniresearch/Uniresearch"
        }
      ],
      "VolumeMount": [
        {
          "Name": "nas-volume",
          "MountPath": "/home/Uniresearch/Uniresearch"
        }
      ],
      "ReadinessProbe": {
        "HttpGet": {
          "Path": "/api/health",
          "Port": 20999,
          "Scheme": "HTTP"
        },
        "InitialDelaySeconds": 60,
        "PeriodSeconds": 10
      },
      "LivenessProbe": {
        "HttpGet": {
          "Path": "/api/health",
          "Port": 20999,
          "Scheme": "HTTP"
        },
        "InitialDelaySeconds": 120,
        "PeriodSeconds": 30
      }
    }
  ],
  "Volume": [
    {
      "Name": "nas-volume",
      "NFSVolume": {
        "Server": "your-nas-server.cn-shanghai.nas.aliyuncs.com",
        "Path": "/Uniresearch",
        "ReadOnly": false
      }
    }
  ],
  "DnsPolicy": "Default",
  "RestartPolicy": "Always"
}
```

创建 ECI 实例：

```bash
aliyun eci CreateContainerGroup --cli-input-json file://eci-config.json
```

### 2.3 配置公网访问

#### 方式一：弹性公网 IP

```bash
# 申请 EIP
aliyun vpc AllocateEipAddress \
  --RegionId cn-shanghai \
  --Bandwidth 10 \
  --InternetChargeType PayByBandwidth

# 绑定 EIP 到 ECI 实例
aliyun eci UpdateContainerGroup \
  --RegionId cn-shanghai \
  --ContainerGroupId eci-xxxxxx \
  --EipInstanceId eip-xxxxxx
```

#### 方式二：SLB 负载均衡

```bash
# 创建 SLB 实例
aliyun slb CreateLoadBalancer \
  --RegionId cn-shanghai \
  --LoadBalancerName Uniresearch-slb \
  --AddressType internet

# 创建 TCP 监听
aliyun slb CreateLoadBalancerTcpListener \
  --LoadBalancerId lb-xxxxxx \
  --ListenerPort 80 \
  --BackendServerPort 20999 \
  --Bandwidth 10

# 添加后端服务器
aliyun slb AddBackendServers \
  --LoadBalancerId lb-xxxxxx \
  --BackendServers '[{"ServerId":"eci-xxxxxx","Weight":"100"}]'
```

### 2.4 管理 ECI 实例

```bash
# 查看实例状态
aliyun eci DescribeContainerGroups --RegionId cn-shanghai

# 查看实例日志
aliyun eci DescribeContainerLog --RegionId cn-shanghai --ContainerGroupId eci-xxxxxx

# 重启实例
aliyun eci RestartContainerGroup --RegionId cn-shanghai --ContainerGroupId eci-xxxxxx

# 删除实例
aliyun eci DeleteContainerGroup --RegionId cn-shanghai --ContainerGroupId eci-xxxxxx
```

---

## 方案三：函数计算 FC 部署（受限）

> ⚠️ **注意**：Uniresearch 是长期运行的服务，FC 有执行时间限制（最长 600 秒），不适合直接部署完整服务。仅适合部署特定的 API 端点或任务处理函数。

### 3.1 适用的场景

- Webhook 接收处理
- 定时任务触发
- 短时计算任务
- API 网关后端

### 3.2 创建函数

创建 `s.yaml` 配置文件：

```yaml
edition: 1.0.0
name: Uniresearch-fc
access: default

vars:
  region: cn-shanghai

services:
  Uniresearch-api:
    component: fc
    props:
      region: ${vars.region}
      serviceName: Uniresearch-service
      description: Uniresearch API Functions
      role: acs:ram::your-account-id:role/AliyunFcDefaultRole
      internetAccess: true
      vpcConfig:
        vpcId: vpc-xxxxxx
        vswitchIds:
          - vsw-xxxxxx
        securityGroupId: sg-xxxxxx
      nasConfig:
        groupId: 1000
        userId: 1000
        mountPoints:
          - serverAddr: your-nas-server.cn-shanghai.nas.aliyuncs.com
            nasDir: /Uniresearch
            fcDir: /mnt/Uniresearch
      functions:
        - name: webhook-handler
          description: Handle webhook requests
          handler: index.handler
          runtime: python3.9
          codeUri: ./fc-code
          memorySize: 512
          timeout: 60
          environmentVariables:
            VOLCENGINE_ARK_API_KEY: your_api_key
            Uniresearch_HOME: /mnt/Uniresearch
      triggers:
        - name: http-trigger
          type: http
          config:
            authType: anonymous
            methods:
              - GET
              - POST
```

### 3.3 部署函数

```bash
# 安装 Serverless Devs 工具
npm install -g @serverless-devs/s

# 配置密钥
s config add

# 部署函数
s deploy
```

---

## 成本优化建议

### 按量付费 vs 包年包月

| 场景 | 推荐方案 | 说明 |
|------|----------|------|
| 临时测试 | 按量付费 | 用完即停，成本最低 |
| 长期运行（<8小时/天） | ACK Serverless + HPA | 自动缩容到 0 |
| 长期运行（>8小时/天） | ECI + 预留实例券 | 购买预留券更划算 |

### 资源规格建议

| 使用规模 | CPU | 内存 | 预估月费用 |
|----------|-----|------|------------|
| 个人/轻量 | 1核 | 2GB | ¥50-100 |
| 小团队 | 2核 | 4GB | ¥150-300 |
| 中等负载 | 4核 | 8GB | ¥300-500 |

### 成本控制技巧

1. **使用 HPA 自动扩缩容**：闲时减少实例数
2. **设置资源请求和限制**：避免资源浪费
3. **使用 NAS 而非云盘**：按量付费更灵活
4. **开启日志压缩**：减少日志存储费用
5. **配置日志保留策略**：自动清理旧日志

---

## 完整部署脚本

### 一键部署脚本 (deploy-aliyun.sh)

```bash
#!/bin/bash

set -e

# ============== 配置区域 ==============
REGION="cn-shanghai"
NAMESPACE="Uniresearch"
IMAGE_NAME="Uniresearch"
CLUSTER_NAME="Uniresearch-cluster"
VPC_ID="vpc-xxxxxx"           # 替换为您的 VPC ID
VSWITCH_ID="vsw-xxxxxx"       # 替换为您的交换机 ID
SECURITY_GROUP_ID="sg-xxxxxx" # 替换为您的安全组 ID
API_KEY="your_api_key_here"   # 替换为您的 API Key
# ====================================

echo "=== Uniresearch 阿里云 Serverless 部署脚本 ==="

# 1. 检查必要工具
echo "[1/7] 检查必要工具..."
command -v docker >/dev/null 2>&1 || { echo "需要安装 Docker"; exit 1; }
command -v kubectl >/dev/null 2>&1 || { echo "需要安装 kubectl"; exit 1; }
command -v aliyun >/dev/null 2>&1 || { echo "需要安装阿里云 CLI"; exit 1; }

# 2. 创建 ACR 命名空间和仓库
echo "[2/7] 配置容器镜像服务..."
aliyun cr CreateNamespace --NamespaceName $NAMESPACE --NamespacePublic false 2>/dev/null || true
aliyun cr CreateRepository --RepoNamespace $NAMESPACE --RepoName $IMAGE_NAME --RepoType PRIVATE 2>/dev/null || true

# 3. 构建并推送镜像
echo "[3/7] 构建并推送镜像..."
docker build -t registry.${REGION}.aliyuncs.com/${NAMESPACE}/${IMAGE_NAME}:latest .
docker login --username=$(aliyun sts GetCallerIdentity | jq -r '.AccountId') registry.${REGION}.aliyuncs.com
docker push registry.${REGION}.aliyuncs.com/${NAMESPACE}/${IMAGE_NAME}:latest

# 4. 获取集群凭证
echo "[4/7] 获取集群凭证..."
CLUSTER_ID=$(aliyun cs DescribeClusters --RegionId $REGION | jq -r '.clusters[] | select(.name=="'$CLUSTER_NAME'") | .cluster_id')
if [ -z "$CLUSTER_ID" ]; then
    echo "未找到集群 $CLUSTER_NAME，请先创建 ACK Serverless 集群"
    exit 1
fi
aliyun cs GET /k8s/$CLUSTER_ID/user_config > ~/.kube/config

# 5. 创建命名空间和 Secret
echo "[5/7] 创建 Kubernetes 资源..."
kubectl create namespace Uniresearch 2>/dev/null || true
kubectl create secret generic Uniresearch-secrets \
    --from-literal=VOLCENGINE_ARK_API_KEY=$API_KEY \
    --from-literal=Uniresearch_CODEX_PROFILE=ark \
    -n Uniresearch 2>/dev/null || true

# 6. 部署应用
echo "[6/7] 部署应用..."
cat <<EOF | kubectl apply -n Uniresearch -f -
apiVersion: apps/v1
kind: Deployment
metadata:
  name: Uniresearch
spec:
  replicas: 1
  selector:
    matchLabels:
      app: Uniresearch
  template:
    metadata:
      labels:
        app: Uniresearch
    spec:
      containers:
      - name: Uniresearch
        image: registry.${REGION}.aliyuncs.com/${NAMESPACE}/${IMAGE_NAME}:latest
        ports:
        - containerPort: 20999
        env:
        - name: VOLCENGINE_ARK_API_KEY
          valueFrom:
            secretKeyRef:
              name: Uniresearch-secrets
              key: VOLCENGINE_ARK_API_KEY
        - name: Uniresearch_CODEX_PROFILE
          valueFrom:
            secretKeyRef:
              name: Uniresearch-secrets
              key: Uniresearch_CODEX_PROFILE
        resources:
          requests:
            cpu: "1"
            memory: "2Gi"
          limits:
            cpu: "4"
            memory: "8Gi"
        livenessProbe:
          httpGet:
            path: /api/health
            port: 20999
          initialDelaySeconds: 60
          periodSeconds: 30
---
apiVersion: v1
kind: Service
metadata:
  name: Uniresearch-service
  annotations:
    service.beta.kubernetes.io/alibaba-cloud-loadbalancer-spec: "slb.s1.small"
spec:
  type: LoadBalancer
  ports:
  - port: 80
    targetPort: 20999
  selector:
    app: Uniresearch
EOF

# 7. 等待服务就绪
echo "[7/7] 等待服务就绪..."
kubectl rollout status deployment/Uniresearch -n Uniresearch --timeout=300s

# 获取访问地址
EXTERNAL_IP=$(kubectl get svc Uniresearch-service -n Uniresearch -o jsonpath='{.status.loadBalancer.ingress[0].ip}')
echo ""
echo "=== 部署成功 ==="
echo "访问地址: http://$EXTERNAL_IP"
echo "查看日志: kubectl logs -n Uniresearch -l app=Uniresearch -f"
```

---

## 常见问题

### Q1: 容器启动失败，显示 OOMKilled

**原因**：内存不足

**解决方案**：
```bash
# 增加内存限制
kubectl set resources deployment/Uniresearch \
  --limits=memory=16Gi \
  -n Uniresearch
```

### Q2: NAS 挂载失败

**原因**：NAS 与集群不在同一 VPC

**解决方案**：
- 确保 NAS 文件系统与 ACK 集群在同一 VPC
- 检查安全组是否允许 NFS 端口（2049）

### Q3: 镜像拉取失败

**原因**：未配置镜像拉取密钥

**解决方案**：
```bash
# 创建镜像拉取密钥
kubectl create secret docker-registry acr-secret \
  --docker-server=registry.cn-shanghai.aliyuncs.com \
  --docker-username=your_username \
  --docker-password=your_password \
  -n Uniresearch

# 更新 Deployment 使用密钥
kubectl patch serviceaccount default -n Uniresearch \
  -p '{"imagePullSecrets":[{"name":"acr-secret"}]}'
```

### Q4: 服务无法从公网访问

**原因**：SLB 未配置或安全组未开放端口

**解决方案**：
- 检查 Service 类型是否为 LoadBalancer
- 确认安全组入方向规则允许 80/443 端口

### Q5: Codex 连接失败

**原因**：API Key 未正确配置

**解决方案**：
```bash
# 检查 Secret
kubectl get secret Uniresearch-secrets -n Uniresearch -o yaml

# 更新 Secret
kubectl create secret generic Uniresearch-secrets \
  --from-literal=VOLCENGINE_ARK_API_KEY=new_key \
  --dry-run=client -o yaml | kubectl apply -f - -n Uniresearch

# 重启 Pod
kubectl rollout restart deployment/Uniresearch -n Uniresearch
```

---

## 相关文档

- [22_DOCKER_RUN_GUIDE.md](./22_DOCKER_RUN_GUIDE.md) - Docker 启动指南
- [15_CODEX_PROVIDER_SETUP.md](./15_CODEX_PROVIDER_SETUP.md) - Codex 提供商配置
- [阿里云 ACK Serverless 文档](https://help.aliyun.com/product/867503.html)
- [阿里云 ECI 文档](https://help.aliyun.com/product/90246.html)
