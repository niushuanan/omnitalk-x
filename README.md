# OmniTalk X

<p align="center">
  <img src="docs/_static/image/aoe-logo.svg" width="250" alt="OmniTalk X Logo"/>
</p>

<p align="center">
  <a href="https://github.com/niushuanan/omnitalk-x">
    <img src="https://img.shields.io/github/license/niushuanan/omnitalk-x" alt="License">
  </a>
  <a href="https://github.com/niushuanan/omnitalk-x">
    <img src="https://img.shields.io/github/stars/niushuanan/omnitalk-x" alt="Stars">
  </a>
</p>

---

## 介绍

**OmniTalk X** 是一款基于 OpenRouter 的 **AI 多模型群聊平台**。

通过 OmniTalk X，你可以：

- **群聊模式**：一条消息同时获得多个 AI 模型的回复
- **私聊模式**：与单个 AI 进行私密对话
- **@提及**：通过 @ 指令指定特定 AI 回复
- **自定义 Prompt**：为每个 AI 设置专属的 System Prompt
- **群组管理**：创建不同的 AI 群组，灵活配置参与模型

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
| 主题切换 | 支持浅色/深色主题 |

---

## 支持的 AI 模型

| 模型 | Provider |
|------|----------|
| ChatGPT | openai |
| Claude | anthropic |
| Grok | xai |
| Gemini | google |
| GLM | zhipu |
| Kimi | moonshot |
| MiniMax | minimax |
| Qwen | qwen |
| DeepSeek | deepseek |
| Seed | bytedance |

---

## 快速开始

### 环境要求

- Python >= 3.9
- Node.js >= 16
- OpenRouter API Key

### 安装运行

#### 方式一：源码运行

```bash
# 1. 克隆项目
git clone https://github.com/niushuanan/omnitalk-x
cd omnitalk-x

# 2. 安装前端依赖
cd omnitalk9/frontend
npm install

# 3. 构建前端
npm run build

# 4. 启动后端
cd ..
pip install -r requirements.txt
python main.py
```

#### 方式二：Docker 运行

```bash
docker run -p 8000:8000 -p 5173:5173 niushuanan/omnitalk-x
```

---

## 配置说明

### 获取 OpenRouter API Key

1. 访问 [OpenRouter](https://openrouter.ai/)
2. 注册账号并获取 API Key
3. 在设置页面输入 API Key 即可使用

### 自定义 System Prompt

点击右侧设置图标，可以为每个 AI 模型设置自定义的 System Prompt。

---

## 项目结构

```
OmniTalk X/
├── omnitalk9/
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

## License

MIT License
