# 使用 Puppeteer 官方镜像作为基础（已包含 Chrome 和 Node.js）
FROM ghcr.io/puppeteer/puppeteer:latest

# 切换到 root 用户以便安装依赖
USER root

# 设置工作目录
WORKDIR /app

# 复制 package.json 和 package-lock.json
COPY package*.json ./

# 安装依赖
RUN npm install --omit=dev

# 复制源代码
COPY . .

# 创建数据目录并设置权限
RUN mkdir -p /app/data && \
    chown -R pptruser:pptruser /app

# 切换回 pptruser 用户
USER pptruser

# 暴露端口
EXPOSE 33223

# 启动应用
CMD ["npm", "run", "server"]
