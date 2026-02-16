import os
import argparse

import uvicorn
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from starlette.responses import HTMLResponse

from backend.api.route_openrouter import router as openrouter
from backend.config.biz_config import img_out_path, load_config, BizConfig
from backend.util.log import log
from backend.util.str_util import safe_join


logger = log(__name__)

API_VER = 'v1'
base_dir = os.path.dirname(os.path.abspath(__file__))
STATIC_RESOURCE_DIR = os.path.join(base_dir, "frontend", "dist")
ASSETS_RESOURCE_DIR = os.path.join(STATIC_RESOURCE_DIR, "assets")

path = img_out_path()

DEFAULT_CONFIG = {
    "models": {
        "chatgpt": {
            "provider": "openai",
            "webui": {
                "avatar": "/avatars/ChatGPT-Logo.png",
                "background": "#ffffff"
            }
        },
        "claude": {
            "provider": "anthropic",
            "webui": {
                "avatar": "/avatars/claude_logo.jpeg",
                "background": "#ffffff"
            }
        },
        "grok": {
            "provider": "xai",
            "webui": {
                "avatar": "/avatars/grok-icon.webp",
                "background": "#ffffff"
            }
        },
        "gemini": {
            "provider": "google",
            "webui": {
                "avatar": "/avatars/gemini_icon-logo_brandlogos.net_aacx5.png",
                "background": "#ffffff"
            }
        },
        "glm": {
            "provider": "zhipu",
            "webui": {
                "avatar": "/avatars/z.webp",
                "background": "#ffffff"
            }
        },
        "kimi": {
            "provider": "moonshot",
            "webui": {
                "avatar": "/avatars/kimi.jpeg",
                "background": "#ffffff"
            }
        },
        "minimax": {
            "provider": "minimax",
            "webui": {
                "avatar": "/avatars/MiniMax.png",
                "background": "#ffffff"
            }
        },
        "qwen": {
            "provider": "qwen",
            "webui": {
                "avatar": "/avatars/Qwen_logo.svg.png",
                "background": "#ffffff"
            }
        },
        "deepseek": {
            "provider": "deepseek",
            "webui": {
                "avatar": "/avatars/DeepSeek.png",
                "background": "#ffffff"
            }
        },
        "seed": {
            "provider": "bytedance",
            "webui": {
                "avatar": "/avatars/seed.png",
                "background": "#ffffff"
            }
        }
    }
}

BIZ_CONFIG = BizConfig(**DEFAULT_CONFIG)

app = FastAPI(title="OmniTalk X - AI Chat Group")


@app.get("/config/json")
async def get_config_json():
    return BIZ_CONFIG.json


# add api routers
app.include_router(openrouter, prefix="/api")


@app.get("/", response_class=HTMLResponse)
@app.get("/home", response_class=HTMLResponse)
async def server():
    return FileResponse(f"{STATIC_RESOURCE_DIR}/index.html")


@app.get("/assets/{path:path}")
async def build_resource(path: str):
    static_file = safe_join(ASSETS_RESOURCE_DIR, path)
    return FileResponse(static_file)


@app.get("/{path:path}")
async def build_resource(path: str):
    static_file = safe_join(STATIC_RESOURCE_DIR, path)
    return FileResponse(static_file)


# add middlewares here if you need
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


def main():
    """
    main function
    start server use uvicorn, default workers: 3
    """
    uvicorn.run(
        "omnitalk9.main:app",
        host='0.0.0.0',
        port=10099,
        timeout_keep_alive=600,
        workers=3
    )


if __name__ == "__main__":
    main()
