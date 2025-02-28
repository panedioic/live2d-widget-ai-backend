# Live2D Widget AI Backend 🚀

[![Docker Build Status](https://img.shields.io/docker/cloud/build/yourname/live2d-ai-backend)](https://hub.docker.com/r/yourname/live2d-ai-backend)
[![TypeScript Version](https://img.shields.io/badge/TypeScript-4.9%2B-blue)](https://www.typescriptlang.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

专为 Web 端 Live2D 智能助手小部件设计的后端服务，提供自然语言交互能力。（ README 由 DeepSeek 生成）

**配套前端项目**： [live2d-widget-ai](https://github.com/panedioic/live2d-widget-ai)

## ✨ 功能特性

### 已实现功能
- 💬 基于阿里云百炼的对话交互 API
- 🔑 会话管理（Session）与 IP 冷却机制
- 🐳 Docker 容器化部署支持
- 📊 对话历史记录存储（SQLite）
- 🛡️ 基础请求频率限制

### TODO：
- 🔒 JWT 身份验证系统
- 📝 指令解析与动作响应框架
- 📈 用户行为分析模块
- 🔍 上下文感知优化
- 🌐 WebSocket 实时通信支持

## 🚀 快速部署

### Docker 部署（推荐）
```bash
# 创建数据持久化目录
mkdir -p ./data

# 运行容器（替换 YOUR_OPENAI_KEY）
docker run -d \
  -p 5000:5000 \
  -v $(pwd)/data:/app/data \
  -e OPENAI_API_KEY="YOUR_OPENAI_KEY" \
  --name live2d-widget-ai-backend \
  panedioic/live2d-widget-ai-backend:latest
```

### 本地开发
```bash
# 1. 克隆仓库
git clone https://github.com/panedioic/live2d-widget-ai-backend.git
cd live2d-widget-ai-backend

# 2. 安装依赖
npm install

# 3. 配置环境变量（创建 .env 文件）
cp .env.example .env
# 编辑 .env 文件填入 OpenAI API Key

# 4. 启动开发服务器
npm run dev
```

## ⚙️ 配置项

通过 `.env` 文件或环境变量配置：

```ini
# 必填配置
OPENAI_API_KEY=your-api-key-here

# 可选配置
PORT=5000
SESSION_TIMEOUT=1800  # 会话超时时间（秒）
MAX_MESSAGES=20       # 每个会话最大消息数
```

## 🤝 参与贡献

欢迎通过 Issues 和 Pull Requests 参与项目开发：

1. Fork 本仓库
2. 创建特性分支 (`git checkout -b feature/your-feature`)
3. 提交更改 (`git commit -am 'Add some feature'`)
4. 推送到分支 (`git push origin feature/your-feature`)
5. 创建 Pull Request

## 📜 开源协议

本项目采用 [MIT License](LICENSE) 授权。

---

**温馨提示**：本项目处于快速迭代阶段，建议定期拉取最新版本以获取功能更新和安全修复。