# OmniTalk X

**简体中文** | [English](../README.md)

OmniTalk X 是一款本地优先的多模型 AI 群聊产品，强调热闹的陪伴体验，同时允许用户创建小群来满足特定场景需求。

## 产品概念
- 群聊式陪伴，多 AI 角色并行回复。
- 可创建小群，满足工作、学习、娱乐等不同场景。
- 让用户感受到像真实群聊一样的互动。

## 核心功能
- 多模型群聊并行回复。
- 单模型私聊。
- `@` 提及：支持 `@所有人` 或点名模型。
- 每个模型可配置独立 System Prompt。
- 群组创建、编辑与群公告。
- 话痨程度按群保存，仅影响当前群。
- 对话记忆与本地持久化。
- 流式输出体验。

## 技术原理（简述）
- 前端：React + TypeScript + Vite，Zustand 管理状态。
- 后端：FastAPI 统一 OpenRouter 调用接口。
- 路由：按 provider 调用（`/api/v1/{provider}/chat/completions`）。
- 群聊逻辑：由前端决定调用哪些模型（群成员与 @ 逻辑）。
- 数据存储：
  - 聊天记录与 Prompt 使用浏览器 `localStorage` 存储。
  - API Key 存储在后端 `api_key.txt`，前端也会缓存用于请求。
  - 群公告只影响所属群的上下文。

## 默认支持模型
支持的 OpenRouter 模型 ID 可在 `omnitalkx/backend/config/models_override.json` 中覆盖。

| 模型 | Provider | 模型 ID |
|---|---|---|
| ChatGPT | openai | openai/gpt-oss-120b |
| Claude | anthropic | anthropic/claude-3-haiku |
| Grok | xai | x-ai/grok-4.1-fast |
| Gemini | google | google/gemini-2.5-flash-lite |
| GLM | zhipu | z-ai/glm-4.7-flash |
| Kimi | moonshot | moonshotai/kimi-k2.5 |
| MiniMax | minimax | minimax/minimax-m2.5 |
| Qwen | qwen | qwen/qwen3-235b-a22b-2507 |
| DeepSeek | deepseek | deepseek/deepseek-chat-v3.1 |
| Seed | bytedance | bytedance-seed/seed-1.6-flash |

## 快速开始（本地）

### 环境要求
- Python 3.10 或 3.11
- Node.js 16+
- OpenRouter API Key

### 本地运行
```bash
# 后端
cd omnitalkx
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
python main.py
```

```bash
# 前端
cd omnitalkx/frontend
npm install
npm run dev
```

- 前端：http://localhost:5173/
- 后端：http://localhost:8000/

## 生产部署
- 构建前端并部署 `frontend/dist`。
- 反向代理 `/api` 到后端服务。

详见 `DEPLOY.md`。

## 数据与隐私
- 聊天记录、Prompt、话痨程度保存在浏览器 `localStorage`。
- API Key 存储在服务端 `omnitalkx/api_key.txt`，界面只展示脱敏信息。
- 用户数据不会提交到仓库，`groups.json`、`contexts/`、`api_key.txt` 均已忽略。

## 项目结构
```
OmniTalk X/
├── omnitalkx/
│   ├── frontend/          # 前端
│   ├── backend/           # 后端
│   ├── main.py            # 入口
│   └── groups.json        # 本地群组数据（忽略）
└── DEPLOY.md              # 部署指南
```

## License
MIT
