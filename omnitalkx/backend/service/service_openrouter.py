import asyncio
import json
import random
from pathlib import Path
from typing import Any

import httpx
from fastapi import HTTPException

from backend.util.log import log

try:
    from backend.config.constant import DEFAULT_TIMEOUT_SECONDS
except ImportError:
    DEFAULT_TIMEOUT_SECONDS = 120

logger = log(__name__)

BASE_DIR = Path(__file__).resolve().parent
API_KEY_FILE = BASE_DIR.parent.parent / "api_key.txt"

OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions"
DEFAULT_API_KEY = ""

MAX_ATTEMPTS = 3
RETRYABLE_STATUS = {408, 409, 429, 500, 502, 503, 504}

CONTEXT_STORAGE = {}

PROVIDERS = {
    "openai": {
        "id": "openai/gpt-oss-120b",
        "name": "ChatGPT",
        "default_system": """你是ChatGPT，OpenAI打造的AI助手，是群里的"老大哥"，以知识渊博、回答全面著称。你现在在小庄的AI群里，和Claude、Grok、Gemini、GLM、Kimi、MiniMax、Qwen、DeepSeek、Seed一起。真人小庄在群里发言。规则：只回复一句话，不超过35字，像微信聊天那样简洁自然，不要重复用户的话，不要在回复前加自己的名字。""",
    },
    "anthropic": {
        "id": "anthropic/claude-3-haiku",
        "name": "Claude",
        "default_system": """你是Claude，由Anthropic打造的AI助手，以深度思考和分析能力著称。你现在位于小庄的AI群聊中，群里有ChatGPT、Grok、Gemini、GLM、Kimi、MiniMax、Qwen、DeepSeek、Seed。小庄是真人在群里。规则：只说一句话，不超过35字，像朋友微信聊天那样自然简洁，不要在回复前加自己的名字。""",
    },
    "xai": {
        "id": "x-ai/grok-4.1-fast",
        "name": "Grok",
        "default_system": """你是Grok，xAI打造的AI助手，以幽默、直接、有时叛逆的风格著称。你现在在小庄建的AI群里，和ChatGPT、Claude、Gemini、GLM、Kimi、MiniMax、Qwen、DeepSeek、Seed一起。小庄是群里唯一的真人。规则：只回复一句，不超过35字，像微信聊天那样简洁，不要说教，不要在回复前加自己的名字。""",
    },
    "google": {
        "id": "google/gemini-2.5-flash-lite",
        "name": "Gemini",
        "default_system": """你是Gemini，Google打造的AI助手，以强大的多模态和创意能力著称。你现在位于小庄的AI群聊中，群里有ChatGPT、Claude、Grok、GLM、Kimi、MiniMax、Qwen、DeepSeek、Seed。小庄在群里是真人对吧。规则：只说一句话，不超过35字，像微信聊天一样简洁自然，不要在回复前加自己的名字。""",
    },
    "zhipu": {
        "id": "z-ai/glm-4.7-flash",
        "name": "GLM",
        "default_system": """你是GLM，智谱AI开发的AI助手，以出色的中文能力和学术严谨著称。你现在在小庄的AI群里，和ChatGPT、Claude、Grok、Gemini、Kimi、MiniMax、Qwen、DeepSeek、Seed一起。小庄是真人在群里。规则：只回复一句话，不超过35字，像微信聊天那样简洁，不要在回复前加自己的名字。""",
    },
    "bytedance": {
        "id": "bytedance-seed/seed-1.6-flash",
        "name": "Seed 1.6",
        "default_system": """你是Seed，由字节跳动打造的AI助手（豆包），以年轻活泼、亲和力强著称。你现在位于小庄的AI群聊中，群里有ChatGPT、Claude、Grok、Gemini、GLM、Kimi、MiniMax、Qwen、DeepSeek。小庄是真人在群里哦。规则：只说一句话，不超过35字，像微信聊天那样活泼简洁，不要在回复前加自己的名字。""",
    },
    "moonshot": {
        "id": "moonshotai/kimi-k2.5",
        "name": "Kimi",
        "default_system": """你是Kimi，由月之暗面（Moonshot AI）打造的AI助手，以超长上下文理解和耐心友好著称。你现在在小庄的AI群聊中，群里有ChatGPT、Claude、Grok、Gemini、GLM、MiniMax、Qwen、DeepSeek、Seed。小庄是真人在群里发言。规则：只说一句话，不超过35字，像朋友微信聊天那样自然，不要在回复前加自己的名字。""",
    },
    "kimi": {
        "id": "moonshotai/kimi-k2.5",
        "name": "Kimi",
        "default_system": """你是Kimi，由月之暗面（Moonshot AI）打造的AI助手，以超长上下文理解和耐心友好著称。你现在在小庄的AI群聊中，群里有ChatGPT、Claude、Grok、Gemini、GLM、MiniMax、Qwen、DeepSeek、Seed。小庄是真人在群里发言。规则：只说一句话，不超过35字，像朋友微信聊天那样自然，不要在回复前加自己的名字。""",
    },
    "minimax": {
        "id": "minimax/minimax-m2.5",
        "name": "MiniMax",
        "default_system": """你是MiniMax，由稀宇科技开发的AI助手，以多才多艺和能力全面著称。你现在在小庄的AI群聊里，和ChatGPT、Claude、Grok、Gemini、GLM、Kimi、Qwen、DeepSeek、Seed一起。小庄是群里唯一的真人。规则：只回复一句话，不超过35字，像微信聊天那样简洁自然，不要在回复前加自己的名字。""",
    },
    "qwen": {
        "id": "qwen/qwen3-235b-a22b-2507",
        "name": "Qwen",
        "default_system": """你是Qwen，阿里巴巴通义千问打造的AI助手，以深厚的中文知识和阿里生态著称。你现在位于小庄的AI群聊中，群里有ChatGPT、Claude、Grok、Gemini、GLM、Kimi、MiniMax、DeepSeek、Seed。小庄是真人在群里。规则：只说一句话，不超过35字，像微信聊天一样接地气简洁，禁止在回复前面加"Qwen："或任何名字。""",
    },
    "deepseek": {
        "id": "deepseek/deepseek-chat-v3.1",
        "name": "DeepSeek",
        "default_system": """你是DeepSeek，由深度求索公司打造的AI助手，以深度思考和代码能力著称。你现在在小庄的AI群聊中，群里有ChatGPT、Claude、Grok、Gemini、GLM、Kimi、MiniMax、Qwen、Seed。小庄是群里唯一的真人。规则：只回复一句话，不超过35字，像微信聊天那样简洁理性，不要在回复前加自己的名字。""",
    },
}


def load_api_key() -> str:
    """从本地文件加载 API Key"""
    if API_KEY_FILE.exists():
        try:
            key = API_KEY_FILE.read_text(encoding="utf-8").strip()
            if key:
                return key
        except Exception:
            pass
    return DEFAULT_API_KEY


def save_api_key(key: str) -> bool:
    """保存 API Key 到本地文件"""
    try:
        API_KEY_FILE.write_text(key.strip(), encoding="utf-8")
        return True
    except Exception:
        return False


def get_context(provider: str) -> list:
    """获取指定 AI 的上下文"""
    if provider not in CONTEXT_STORAGE:
        CONTEXT_STORAGE[provider] = []
    return CONTEXT_STORAGE[provider]


def add_to_context(provider: str, role: str, content: str):
    """添加消息到上下文"""
    if provider not in CONTEXT_STORAGE:
        CONTEXT_STORAGE[provider] = []
    CONTEXT_STORAGE[provider].append({"role": role, "content": content})
    if len(CONTEXT_STORAGE[provider]) > 100:
        CONTEXT_STORAGE[provider] = CONTEXT_STORAGE[provider][-100:]


def clear_context(provider: str):
    """清除指定 AI 的上下文"""
    if provider in CONTEXT_STORAGE:
        CONTEXT_STORAGE[provider] = []


def get_context_with_messages(provider: str, user_message: str) -> list:
    """获取带用户消息的完整上下文"""
    ctx = get_context(provider)
    messages = list(ctx)
    messages.append({"role": "user", "content": user_message})
    return messages


def get_provider_config(provider: str) -> dict:
    """获取提供商配置"""
    cfg = PROVIDERS.get(provider.lower())
    if not cfg:
        raise HTTPException(status_code=404, detail="未支持的提供方")
    return cfg


def build_payload(provider: str, payload: dict[str, Any]) -> dict[str, Any]:
    """构建请求体，添加默认值和系统消息"""
    cfg = get_provider_config(provider)
    normalized = dict(payload or {})
    normalized["stream"] = True
    normalized["model"] = cfg["id"]
    normalized.setdefault("temperature", 0.9)
    normalized.setdefault("max_tokens", 3000)

    messages = normalized.get("messages", [])
    if messages and messages[0].get("role") != "system":
        normalized["messages"] = [{"role": "system", "content": cfg["default_system"]}] + messages

    return normalized


def extract_delta_text(data: dict) -> str:
    """从响应数据中提取文本内容"""
    if not isinstance(data, dict):
        return ""
    
    choices = data.get("choices", [])
    if not choices:
        return ""
    
    choice = choices[0] or {}
    
    for key in ["delta", "message"]:
        content = choice.get(key, {}).get("content")
        if isinstance(content, str):
            return content
    
    return ""


def normalize_error(raw: str) -> str:
    """规范化错误信息"""
    if not raw:
        return "请求失败"
    try:
        payload = json.loads(raw)
        if isinstance(payload, dict):
            err = payload.get("error", {})
            if isinstance(err, dict):
                return str(err.get("message") or err.get("code") or raw)
            return str(payload.get("message") or raw)
    except json.JSONDecodeError:
        pass
    return raw


async def fetch_with_retry(
    client: httpx.AsyncClient,
    url: str,
    headers: dict,
    payload: dict,
) -> httpx.Response:
    """带重试的请求"""
    last_error = None

    for attempt in range(1, MAX_ATTEMPTS + 1):
        try:
            request = client.build_request("POST", url, headers=headers, json=payload)
            response = await client.send(request, stream=True)
        except (httpx.TimeoutException, httpx.NetworkError) as exc:
            last_error = exc
            if attempt >= MAX_ATTEMPTS:
                break
            await asyncio.sleep(0.7 * attempt)
            continue

        if response.status_code in RETRYABLE_STATUS and attempt < MAX_ATTEMPTS:
            await response.aread()
            await response.aclose()
            delay = (1.4 if response.status_code == 429 else 0.7) * attempt
            await asyncio.sleep(delay)
            continue

        return response

    raise RuntimeError(str(last_error or "上游请求失败"))


def format_sse(delta: str, finish_reason: str = None) -> str:
    """格式化 SSE 消息"""
    payload: dict[str, Any] = {"choices": [{"delta": {"content": delta}}]}
    if finish_reason:
        payload["choices"][0]["finish_reason"] = finish_reason
    return f"data: {json.dumps(payload, ensure_ascii=False)}\n\n"


async def chat_completion_stream(provider: str, payload: dict[str, Any], custom_api_key: str = None):
    """流式聊天完成"""
    cfg = get_provider_config(provider)
    normalized = build_payload(provider, payload)

    api_key = custom_api_key or load_api_key()
    if not api_key:
        yield format_sse("", "stop")
        yield json.dumps({"success": "false", "msg": "请配置 OpenRouter API Key"})
        yield "data: [DONE]\n\n"
        return

    headers = {
        "Content-Type": "application/json",
        "Authorization": f"Bearer {api_key}",
        "HTTP-Referer": "https://omnitalkx.example.com",
        "X-Title": "OmniTalk X",
    }

    client = httpx.AsyncClient(timeout=DEFAULT_TIMEOUT_SECONDS)
    try:
        upstream = await fetch_with_retry(client, OPENROUTER_URL, headers, normalized)
    except Exception as exc:
        await client.aclose()
        yield format_sse("", "stop")
        yield json.dumps({"success": "false", "msg": normalize_error(str(exc))})
        yield "data: [DONE]\n\n"
        return

    if upstream.status_code >= 400:
        raw = await upstream.aread()
        await upstream.aclose()
        await client.aclose()
        yield format_sse("", "stop")
        yield json.dumps({"success": "false", "msg": normalize_error(raw.decode("utf-8", "ignore"))})
        yield "data: [DONE]\n\n"
        return

    try:
        async for line in upstream.aiter_lines():
            if not line or not line.strip().startswith("data:"):
                continue

            data = line.strip()[5:].strip()
            if not data or data == "[DONE]":
                continue

            try:
                parsed = json.loads(data)
                delta = extract_delta_text(parsed)
                finish_reason = parsed.get("choices", [{}])[0].get("finish_reason")
                
                if delta:
                    yield format_sse(delta)
                if finish_reason:
                    yield format_sse("", finish_reason)
            except json.JSONDecodeError:
                continue

        yield "data: [DONE]\n\n"
    finally:
        await upstream.aclose()
        await client.aclose()


async def chat_completion(provider: str, payload: dict[str, Any], custom_api_key: str = None):
    """非流式聊天完成"""
    cfg = get_provider_config(provider)
    normalized = build_payload(provider, payload)
    normalized["stream"] = False

    api_key = custom_api_key or load_api_key()
    if not api_key:
        return {"success": False, "msg": "请配置 OpenRouter API Key"}

    headers = {
        "Content-Type": "application/json",
        "Authorization": f"Bearer {api_key}",
        "HTTP-Referer": "https://omnitalkx.example.com",
        "X-Title": "OmniTalk X",
    }

    client = httpx.AsyncClient(timeout=DEFAULT_TIMEOUT_SECONDS)
    try:
        response = await client.post(OPENROUTER_URL, headers=headers, json=normalized)
    except Exception as exc:
        await client.aclose()
        return {"success": False, "msg": normalize_error(str(exc))}
    
    if response.status_code >= 400:
        await client.aclose()
        return {"success": False, "msg": normalize_error(response.text)}
    
    try:
        result = response.json()
        content = result.get("choices", [{}])[0].get("message", {}).get("content", "")
        await client.aclose()
        return {"success": True, "msg": content}
    except Exception as exc:
        await client.aclose()
        return {"success": False, "msg": str(exc)}


async def chat_completion_with_context(provider: str, user_message: str, custom_api_key: str = None):
    """非流式聊天完成（带上下文）"""
    cfg = get_provider_config(provider)
    messages = get_context_with_messages(provider, user_message)
    
    payload = {
        "model": cfg["id"],
        "temperature": 0.7,
        "max_tokens": 100,
        "messages": [{"role": "system", "content": cfg["default_system"]}] + messages
    }

    api_key = custom_api_key or load_api_key()
    if not api_key:
        return {"success": False, "msg": "请配置 OpenRouter API Key", "provider": provider}

    headers = {
        "Content-Type": "application/json",
        "Authorization": f"Bearer {api_key}",
        "HTTP-Referer": "https://omnitalkx.example.com",
        "X-Title": "OmniTalk X",
    }

    client = httpx.AsyncClient(timeout=DEFAULT_TIMEOUT_SECONDS)
    try:
        response = await client.post(OPENROUTER_URL, headers=headers, json=payload)
    except Exception as exc:
        await client.aclose()
        return {"success": False, "msg": normalize_error(str(exc)), "provider": provider}
    
    if response.status_code >= 400:
        await client.aclose()
        return {"success": False, "msg": normalize_error(response.text), "provider": provider}
    
    try:
        result = response.json()
        content = result.get("choices", [{}])[0].get("message", {}).get("content", "")
        add_to_context(provider, "user", user_message)
        add_to_context(provider, "assistant", content)
        await client.aclose()
        return {"success": True, "msg": content, "provider": provider}
    except Exception as exc:
        await client.aclose()
        return {"success": False, "msg": str(exc), "provider": provider}


async def group_chat(providers: list, user_message: str, custom_api_key: str = None):
    """群聊：同时调用多个 AI，返回按完成时间排序的结果"""
    tasks = []
    for provider in providers:
        task = chat_completion_with_context(provider, user_message, custom_api_key)
        tasks.append(task)
    
    results = await asyncio.gather(*tasks, return_exceptions=True)
    
    completed = []
    for i, result in enumerate(results):
        if isinstance(result, Exception):
            completed.append({
                "provider": providers[i],
                "success": False,
                "msg": str(result),
                "order": 999
            })
        else:
            completed.append({
                "provider": result.get("provider", providers[i]),
                "success": result.get("success", False),
                "msg": result.get("msg", ""),
                "order": i
            })
    
    completed.sort(key=lambda x: x["order"])
    return completed


def get_random_providers(count: int = 3) -> list:
    """随机获取指定数量的 AI 提供商"""
    all_providers = list(PROVIDERS.keys())
    return random.sample(all_providers, min(count, len(all_providers)))
