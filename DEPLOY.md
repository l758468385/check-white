# Docker 部署指南

## 快速开始

### 1. 配置环境变量

```bash
# 复制环境变量模板
cp .env.example .env

# 编辑 .env 文件，配置必要参数
# 最少只需要配置 PORT（默认 33223）
```

### 2. 构建并启动

```bash
# 构建并启动容器
docker-compose up -d

# 查看容器状态
docker-compose ps

# 查看日志
docker-compose logs -f
```

### 3. 访问面板

打开浏览器访问：`http://localhost:33223`

---
# 白屏检测项目部署指南

本指南介绍如何在 VPS 上使用 Docker 部署白屏检测项目。

## 快速部署（推荐）⚡

**一键自动部署脚本**（自动检测并设置正确权限）：

```bash
cd ~/check-white
chmod +x deploy.sh
./deploy.sh
```

脚本会自动：
1. 拉取最新代码
2. 构建并启动容器
3. 检测容器内 pptruser 的 UID
4. 自动设置宿主机权限
5. 重启服务

---

## 手动部署步骤

### 前置要求

- 已安装 Docker 和 Docker Compose
- 服务器防火墙已开放 33223 端口

### 部署步骤

```bash
# 1. 上传代码到服务器
# 可以使用 git clone 或 scp 上传

# 2. 进入项目目录
cd check-white

# 3. 配置环境变量
cp .env.example .env
nano .env  # 或使用 vi/vim 编辑

# 4. 设置数据目录权限（重要！）
# pptruser 的 UID/GID 通常是 1000
mkdir -p data
sudo chown -R 1000:1000 data

# 5. 启动服务
docker-compose up -d

# 6. 检查服务状态
docker-compose ps
```

### 访问面板

打开浏览器访问：`http://你的服务器IP:33223`

### 并发数建议

根据 VPS 配置选择合适的并发数：

- **1核2G**: 建议并发数 5-10
- **2核4G**: 建议并发数 15-20
- **4核8G**: 建议并发数 30-40
- **8核16G**: 建议并发数 40-50

---

## 常用命令

### 查看日志

```bash
# 实时查看日志
docker-compose logs -f

# 查看最近100行日志
docker-compose logs --tail=100
```

### 重启服务

```bash
docker-compose restart
```

### 停止服务

```bash
docker-compose down
```

### 更新代码后重新部署

```bash
# 停止并删除容器
docker-compose down

# 重新构建镜像
docker-compose build

# 启动服务
docker-compose up -d
```

### 清理 Docker 资源

```bash
# 删除未使用的镜像
docker image prune -a

# 删除未使用的容器
docker container prune
```

---

## 数据持久化

检测结果保存在 `./data/results.json` 文件中，通过 Docker 卷挂载实现持久化。即使容器重启或删除，数据也不会丢失。

## 环境变量说明

| 变量名 | 说明 | 默认值 | 必填 |
|--------|------|--------|------|
| `PORT` | 服务端口 | 33223 | 是 |
| `SENTRY_AUTH_TOKEN` | Sentry 认证令牌 | - | 否 |
| `SENTRY_ORG` | Sentry 组织名称 | - | 否 |
| `SENTRY_PROJECT` | Sentry 项目名称 | - | 否 |

---

## 故障排查

### 容器启动失败

```bash
# 查看详细日志
docker-compose logs

# 检查端口是否被占用
netstat -tlnp | grep 33223
# 或
lsof -i :33223
```

### 无法访问面板

1. 检查容器是否正常运行：`docker-compose ps`
2. 检查防火墙是否开放端口
3. 检查 `.env` 文件配置是否正确

### 检测功能异常

1. 查看容器日志：`docker-compose logs -f`
2. 确认网络连接正常
3. 确认目标 URL 可访问
