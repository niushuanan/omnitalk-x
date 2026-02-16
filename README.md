# OmniTalk X

## 介绍

> OmniTalk X 是基于 [OpenAOE](https://github.com/InternLM/OpenAOE) 项目的二次开发，主要借鉴了其前端设计，并进行了功能扩展和优化。

**OmniTalk X** 是一款基于 OpenRouter 的 **AI 多模型群聊平台**。

通过 OmniTalk X，你可以：

- **群聊模式**：一条消息同时获得多个 AI 模型的回复
- **私聊模式**：与单个 AI 进行私密对话
- **@提及**：通过 @ 指令指定特定 AI 回复
- **自定义 Prompt**：为每个 AI 设置专属的 System Prompt
- **群组管理**：创建不同的 AI 群组，灵活配置参与模型
- **上下文记忆**：智能记住对话历史
- **流式输出**：实时显示 AI 回复

---

## 功能特性

| 功能 | 说明 |
|------|------|
| 多模型并行响应 | 10 个主流 AI 同时回复 |
| 私聊模式 | 与单个 AI 私密对话 |
| @提及 | 指定特定 AI 回复 |
| System Prompt | 为每个 AI 自定义提示词 |
| 群组功能 | 创建和管理 AI 群组 |
| 上下文记忆 | 智能记住对话历史 |
| 流式输出 | 实时显示 AI 回复 |

---

## 支持的 AI 模型

| 模型 | Provider | 模型 ID |
|------|----------|---------|
| ChatGPT | openai | openai/gpt-5.2 |
| Claude | anthropic | anthropic/claude-opus-4.5 |
| Grok | xai | x-ai/grok-4 |
| Gemini | google | google/gemini-3-pro-preview |
| GLM | zhipu | z-ai/glm-5 |
| Kimi | moonshot | moonshotai/kimi-k2.5 |
| MiniMax | minimax | minimax/minimax-m2.5 |
| Qwen | qwen | qwen/qwen3-max-thinking |
| DeepSeek | deepseek | deepseek/deepseek-v3.2 |
| Seed | bytedance | bytedance/seed-1.6-flash |

---

## 快速开始

### 环境要求

- Python >= 3.9
- Node.js >= 16
- OpenRouter API Key

### 安装运行

```bash
# 1. 克隆项目
git clone https://github.com/niushuanan/omnitalk-x
cd omnitalk-x

# 2. 安装前端依赖
cd omnitalkx/frontend
npm install

# 3. 构建前端
npm run build

# 4. 启动后端
cd ../..
pip install -r requirements.txt
python main.py
```

服务启动后，访问：
- 前端：http://localhost:5173
- 后端：http://localhost:8000

---

## 配置说明

### 获取 OpenRouter API Key

1. 访问 [OpenRouter](https://openrouter.ai/) 注册账号
2. 获取 API Key
3. 在页面右侧点击设置图标，输入 API Key 即可使用

### 自定义 System Prompt

点击右侧设置图标，可以为每个 AI 模型设置自定义的 System Prompt。

---

## 项目结构

```
OmniTalk X/
├── omnitalkx/
│   ├── frontend/          # 前端项目
│   │   ├── src/
│   │   │   ├── pages/    # 页面组件
│   │   │   ├── components/# 公共组件
│   │   │   ├── store/    # 状态管理
│   │   │   └── config/   # 配置文件
│   │   └── public/       # 静态资源
│   ├── backend/          # 后端项目
│   │   ├── api/          # API 路由
│   │   ├── service/      # 业务服务
│   │   └── config/       # 配置文件
│   └── main.py           # 项目入口
└── docs/                 # 文档
```

---

## 技术栈

| 层级 | 技术 |
|------|------|
| 前端 | React 18 + TypeScript + Vite |
| 状态管理 | Zustand |
| UI 组件 | sea-lion-ui |
| 后端 | FastAPI + Python |
| API 聚合 | OpenRouter |

---

## 代码架构原则

### 前端架构

- **组件化开发**：采用 React 函数组件 + Hooks 模式
- **状态管理**：使用 Zustand 进行全局状态管理，按功能模块划分 store
- **类型安全**：TypeScript 严格模式，接口定义清晰
- **样式管理**：Less 预处理器，变量统一管理主题色

### 后端架构

- **RESTful API**：清晰的路由设计
- **服务分层**：API → Service → Model 分层解耦
- **配置管理**：YAML 配置文件，支持多环境切换
- **日志系统**：统一的日志记录规范

### 核心设计模式

1. **前端**
   - 自定义 Hooks：复用业务逻辑
   - Context：全局配置管理
   - Interceptors：请求/响应统一处理

2. **后端**
   - 依赖注入：服务层解耦
   - 流式响应：Server-Sent Events (SSE)
   - CORS：跨域资源共享配置

---

## 常见问题

### 1. 如何获取 OpenRouter API Key？

访问 [OpenRouter](https://openrouter.ai/) 注册账号，在个人中心获取 API Key。

### 2. 为什么消息发送失败？

- 检查 API Key 是否有效
- 检查网络连接是否正常
- 确认选择的 AI 模型是否可用

### 3. 如何查看消耗的积分？

在 OpenRouter 账户页面查看使用统计。

### 4. 支持自定义模型吗？

当前支持 OpenRouter 提供的所有模型，可通过配置文件添加新模型。

---

## License

MIT License
