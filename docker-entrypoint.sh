#!/bin/sh
# Docker 容器启动脚本

# 修复 data 目录权限（如果需要）
if [ -w /app/data ]; then
  echo "data 目录权限正常"
else
  echo "警告: 无法写入 data 目录，请检查宿主机权限 (chown 1000:1000 ./data)"
fi

# 启动应用
exec npm run server
