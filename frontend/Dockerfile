# frontend/Dockerfile

# --- Stage 1: 构建阶段 (Build Stage) ---
# 使用Node.js镜像来构建我们的Vue应用
FROM node:18-alpine AS build-stage

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .
# 运行打包命令
RUN npm run build

# --- Stage 2: 生产阶段 (Production Stage) ---
# 使用一个非常轻量级的Nginx服务器镜像来托管我们的静态文件
FROM nginx:stable-alpine

# 将上一个阶段打包好的 dist 文件夹下的所有内容，
# 拷贝到Nginx默认的网站根目录 /usr/share/nginx/html
COPY --from=build-stage /app/dist /usr/share/nginx/html

# （可选）如果你使用了Vue Router的history模式，需要配置Nginx
# 将自定义的nginx配置文件拷贝到容器中
COPY nginx.conf /etc/nginx/conf.d/default.conf

# 赋予 nginx 用户对 web 根目录的读取权限
RUN chown -R nginx:nginx /usr/share/nginx/html && chmod -R 755 /usr/share/nginx/html

# 赋予 nginx 用户对 nginx 缓存和临时目录的写入权限
RUN chown -R nginx:nginx /var/cache/nginx && \
    chown -R nginx:nginx /var/log/nginx && \
    chown -R nginx:nginx /etc/nginx/conf.d
RUN touch /var/run/nginx.pid && \
    chown -R nginx:nginx /var/run/nginx.pid

# 切换到非 root 用户
USER nginx

# 暴露Nginx的默认端口
EXPOSE 80

# Nginx镜像会自动启动Nginx服务，我们不需要CMD