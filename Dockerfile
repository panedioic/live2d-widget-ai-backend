# 构建阶段
FROM node:18-alpine AS builder

WORKDIR /app

# 安装构建依赖（包括Python和编译工具）
RUN apk add --no-cache \
    python3 \
    make \
    g++ \
    sqlite

# 复制依赖文件并安装
COPY package*.json ./
RUN NODE_ENV=development npm install

# 复制源码并构建
COPY . .
RUN npm run build

# 清理开发依赖
RUN npm prune --omit=dev

# 运行时阶段
FROM node:18-alpine

WORKDIR /app

# 安装运行时依赖
RUN apk add --no-cache sqlite

# 从构建阶段复制必要文件
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/config.json ./config.json

# 数据持久化配置
VOLUME /app/data
ENV DATABASE_PATH=/app/data/chat.db

# 健康检查
# HEALTHCHECK --interval=30s --timeout=10s --retries=3 \
#     CMD node -e "require('http').get('http://localhost:5000/health', res => process.exit(res.statusCode !== 200))"

# 启动命令（包含数据库初始化）
CMD ["sh", "-c", "node dist/app.js"]

EXPOSE 5000