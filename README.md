# OmniTalk X

**English** | [简体中文](./docs/README_zh-CN.md)

OmniTalk X is a local-first, multi-model AI group chat product. It emphasizes lively companionship while letting users create focused groups for specific contexts.

## Product Concept
- Companion-style group chat with multiple AI personas responding in parallel.
- Users can create focused groups for work, study, entertainment, and more.
- The product feels like a real group, not a single assistant.

## Core Features
- Multi-model group chat with parallel replies.
- Private chat with a single model.
- `@` mention targeting: `@all` or specific model.
- Per-model System Prompt control.
- Group creation, editing, and announcements.
- Chat style is stored per group and only affects the current group.
- Conversation memory with local persistence.
- Real-time streaming UI.

## How It Works (Technical Overview)
- Frontend: React + TypeScript + Vite with Zustand state management.
- Backend: FastAPI routes that normalize requests to OpenRouter.
- Model routing: provider-level dispatch (`/api/v1/{provider}/chat/completions`).
- Group logic: the UI decides which models are called based on group membership and mentions.
- Storage:
  - Chat history and prompts are stored in browser `localStorage`.
  - API key is stored on the backend in `api_key.txt` (ignored by git) and also in browser storage for client requests.
  - Group announcements only affect their own group context.

## Supported Models (Default)
These are the default OpenRouter model IDs. Users can override in `omnitalkx/backend/config/models_override.json`.

| Model | Provider | Model ID |
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

## Quick Start (Local)

### Requirements
- Python 3.10 or 3.11
- Node.js 16+
- OpenRouter API Key

### Run (Dev)
```bash
# Backend
cd omnitalkx
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
python main.py
```

```bash
# Frontend
cd omnitalkx/frontend
npm install
npm run dev
```

- Frontend: http://localhost:5173/
- Backend: http://localhost:8000/

## Production Deployment
- Build frontend and serve `frontend/dist` from backend or any static host.
- Reverse proxy `/api` to the backend.

See `DEPLOY.md` for full Nginx configuration and steps.

## Data & Privacy
- Chat history, prompts, and chat style config are saved in browser `localStorage`.
- API key is saved to `omnitalkx/api_key.txt` (or `~/.omnitalkx/api_key.txt` if the project directory is not writable) and masked in UI.
- No user data is committed to this repo. Files like `groups.json`, `contexts/`, and `api_key.txt` are git-ignored.

## Project Structure
```
OmniTalk X/
├── omnitalkx/
│   ├── frontend/          # React UI
│   ├── backend/           # FastAPI service
│   ├── main.py            # App entry
│   └── groups.json        # Local group data (ignored)
└── DEPLOY.md              # Deployment guide
```

## License
MIT
