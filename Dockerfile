# 使用多架构 Node.js 基础镜像，兼容 amd64 / arm64
FROM node:20-bookworm-slim

# Puppeteer 在容器中使用系统 Chromium，避免下载不匹配架构的浏览器
ENV PUPPETEER_SKIP_DOWNLOAD=true \
    PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium

# 切换到 root 用户以安装系统依赖
USER root

# 设置工作目录
WORKDIR /app

# 安装 Chromium 及常用字体
RUN apt-get update && \
    apt-get install -y --no-install-recommends \
    chromium \
    fonts-noto-cjk \
    fonts-freefont-ttf \
    ca-certificates && \
    rm -rf /var/lib/apt/lists/*

# 复制 package.json 和 package-lock.json
COPY package*.json ./

# 安装生产依赖
RUN npm install --omit=dev

# 复制源代码
COPY . .

# 复制启动脚本并设置权限
COPY docker-entrypoint.sh /usr/local/bin/
RUN chmod +x /usr/local/bin/docker-entrypoint.sh

# 创建数据目录并让 node 用户拥有应用目录
RUN mkdir -p /app/data && \
    chown -R node:node /app

# 切换到非 root 用户运行
USER node

# 暴露端口
EXPOSE 33223

# 使用启动脚本
ENTRYPOINT ["docker-entrypoint.sh"]
