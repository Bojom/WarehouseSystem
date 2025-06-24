# backend/Dockerfile

# --- Stage 1: 安装依赖 ---
# 使用一个官方的、特定版本的Node.js镜像作为基础
FROM node:18-alpine AS dependencies
# Alpine镜像是轻量级的

# 设置工作目录
WORKDIR /app

# 只拷贝package.json和package-lock.json，这样可以利用Docker的层缓存
# 只有当这两个文件变化时，才会重新运行npm install
COPY package*.json ./
RUN npm install --production

# --- Stage 2: 运行应用 ---
FROM node:18-alpine AS runner

WORKDIR /app

# 创建一个非 root 用户来运行应用，增强安全性
RUN addgroup -S appgroup && adduser -S appuser -G appgroup
USER appuser

# 从上一个阶段拷贝安装好的node_modules
COPY --from=dependencies /app/node_modules ./node_modules

# 拷贝所有源代码
COPY . .

# 暴露我们在.env中为后端服务设置的端口
EXPOSE 3001

# 定义容器启动时要执行的命令
CMD ["node", "src/app.js"]