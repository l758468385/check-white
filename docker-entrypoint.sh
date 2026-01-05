#!/bin/sh
# Docker 容器启动脚本

# 输出当前用户信息
echo "当前用户: $(whoami)"
echo "UID: $(id -u), GID: $(id -g)"

# 检查 data 目录权限
ls -la /app/data/ || echo "data 目录不存在或无法访问"

# 检查是否能写入
if [ -w /app/data ]; then
  echo "✓ data 目录可写"
else
  echo "✗ data 目录不可写 - 请在宿主机执行: sudo chown -R $(id -u):$(id -g) ./data"
fi

# 启动应用
exec npm run server
