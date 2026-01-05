#!/bin/bash
# VPS 部署脚本 - 自动检测并设置权限

set -e

echo "=== 白屏检测项目部署 ==="

# 1. 拉取代码
echo "1. 拉取代码..."
git pull

# 2. 创建 data 目录
echo "2. 创建 data 目录..."
mkdir -p ./data
echo '[]' > ./data/results.json 2>/dev/null || true

# 3. 启动容器（临时）获取 UID
echo "3. 检测容器用户 UID..."
docker-compose up -d --build
sleep 3

# 获取 pptruser 的 UID 和 GID
CONTAINER_UID=$(docker exec check-white-screen id -u)
CONTAINER_GID=$(docker exec check-white-screen id -g)

echo "   检测到容器 UID: $CONTAINER_UID, GID: $CONTAINER_GID"

# 4. 停止容器，设置权限
echo "4. 设置 data 目录权限..."
docker-compose down
sudo chown -R $CONTAINER_UID:$CONTAINER_GID ./data
sudo chmod 664 ./data/results.json

# 5. 重新启动
echo "5. 启动容器..."
docker-compose up -d

echo ""
echo "✅ 部署完成！"
echo "   访问: http://$(hostname -I | awk '{print $1}'):33223"
echo ""
echo "查看日志: docker-compose logs -f"
