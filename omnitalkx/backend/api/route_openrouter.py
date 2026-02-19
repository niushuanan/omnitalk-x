from fastapi import APIRouter, Request
from fastapi.responses import StreamingResponse, JSONResponse

from backend.service.service_openrouter import (
    chat_completion_stream, 
    load_api_key, 
    save_api_key,
    group_chat,
    chat_completion_with_context,
    get_random_providers,
    get_context,
    clear_context,
    PROVIDERS
)

router = APIRouter()


@router.post("/v1/{provider}/chat/completions")
async def openrouter_chat(provider: str, request: Request):
    """
    统一 OpenRouter 聊天接口
    @param provider: 模型提供商 (openai, anthropic, xai, google, zhipu, moonshot, minimax, qwen, deepseek)
    @param request: 请求对象
    @return: 流式响应
    """
    try:
        body = await request.json()
    except Exception:
        return {"success": False, "msg": "请求体必须是 JSON"}

    custom_api_key = request.headers.get("X-Api-Key", "")

    return StreamingResponse(
        chat_completion_stream(provider, body, custom_api_key),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "X-Accel-Buffering": "no",
            "Connection": "keep-alive",
        },
    )


@router.post("/v1/{provider}/chat/completions/non-stream")
async def openrouter_chat_non_stream(provider: str, request: Request):
    """
    统一 OpenRouter 聊天接口（非流式）
    @param provider: 模型提供商
    @param request: 请求对象
    @return: JSON 响应
    """
    try:
        body = await request.json()
    except Exception:
        return {"success": False, "msg": "请求体必须是 JSON"}

    custom_api_key = request.headers.get("X-Api-Key", "")

    from backend.service.service_openrouter import chat_completion
    result = await chat_completion(provider, body, custom_api_key)
    return result


@router.get("/key")
async def get_api_key():
    """获取当前 API Key（脱敏显示）"""
    key = load_api_key()
    if len(key) > 12:
        masked = key[:8] + "****" + key[-4:]
    else:
        masked = "****" if key else ""
    return {"has_key": bool(key), "masked_key": masked}


@router.post("/key")
async def set_api_key(request: Request):
    """保存 API Key"""
    try:
        data = await request.json()
        key = data.get("key", "").strip()
        if not key:
            return {"status": "error", "message": "API Key 不能为空"}
        if not key.startswith("sk-or-v1-") and not key.startswith("sk-"):
            return {"status": "error", "message": "无效的 OpenRouter API Key 格式"}
        if save_api_key(key):
            return {"status": "ok", "message": "API Key 已保存"}
        else:
            return {"status": "error", "message": "保存失败"}
    except Exception as e:
        return {"status": "error", "message": str(e)}


@router.delete("/key")
async def delete_api_key():
    """删除 API Key"""
    try:
        if save_api_key(""):
            return {"status": "ok", "message": "API Key 已删除"}
        else:
            return {"status": "error", "message": "删除失败"}
    except Exception as e:
        return {"status": "error", "message": str(e)}


@router.get("/providers")
async def get_providers():
    """获取所有可用的 AI 提供商列表"""
    return {
        "providers": [
            {"id": k, "name": v["name"]} for k, v in PROVIDERS.items()
        ]
    }


@router.get("/default-prompts")
async def get_default_prompts():
    """获取所有 AI 的默认 System Prompt"""
    # provider 到 model key 的映射
    provider_to_model = {
        "openai": "chatgpt",
        "anthropic": "claude",
        "xai": "grok",
        "google": "gemini",
        "zhipu": "glm",
        "moonshot": "kimi",
        "minimax": "minimax",
        "qwen": "qwen",
        "deepseek": "deepseek",
        "bytedance": "seed",
    }
    prompts = {}
    for provider, model_key in provider_to_model.items():
        if provider in PROVIDERS:
            prompts[model_key] = PROVIDERS[provider].get("default_system", "")
    return {"prompts": prompts}


@router.post("/api/chat/group")
async def chat_group(request: Request):
    """群聊 API：@所有人时全部 AI 回复，否则随机 5 个 AI 回复"""
    try:
        data = await request.json()
    except Exception:
        return {"success": False, "msg": "请求体必须是 JSON"}
    
    custom_api_key = request.headers.get("X-Api-Key", "")
    message = data.get("message", "").strip()
    mention_all = data.get("mention_all", False)
    
    if not message:
        return {"success": False, "msg": "消息不能为空"}
    
    # @所有人时调用全部 AI，否则随机 5 个
    if mention_all:
        providers = list(PROVIDERS.keys())
    else:
        providers = get_random_providers(5)
    
    results = await group_chat(providers, message, custom_api_key)
    
    return {"success": True, "results": results}


@router.post("/api/chat/private")
async def chat_private(request: Request):
    """私聊 API：单个 AI 回复"""
    try:
        data = await request.json()
    except Exception:
        return {"success": False, "msg": "请求体必须是 JSON"}
    
    custom_api_key = request.headers.get("X-Api-Key", "")
    provider = data.get("provider", "").strip()
    message = data.get("message", "").strip()
    
    if not provider:
        return {"success": False, "msg": "provider 不能为空"}
    if not message:
        return {"success": False, "msg": "消息不能为空"}
    
    result = await chat_completion_with_context(provider, message, custom_api_key)
    return result


@router.post("/api/chat/mention")
async def chat_mention(request: Request):
    """@提及 API：指定 AI 或所有人回复"""
    try:
        data = await request.json()
    except Exception:
        return {"success": False, "msg": "请求体必须是 JSON"}
    
    custom_api_key = request.headers.get("X-Api-Key", "")
    message = data.get("message", "").strip()
    mentioned = data.get("mentioned", [])
    
    if not message:
        return {"success": False, "msg": "消息不能为空"}
    
    if not mentioned or "all" in mentioned:
        providers = list(PROVIDERS.keys())
    else:
        providers = mentioned
    
    results = await group_chat(providers, message, custom_api_key)
    
    return {"success": True, "results": results}


@router.get("/api/context/{provider}")
async def get_context_api(provider: str):
    """获取指定 AI 的上下文"""
    context = get_context(provider)
    return {"success": True, "provider": provider, "context": context}


@router.delete("/api/context/{provider}")
async def clear_context_api(provider: str):
    """清除指定 AI 的上下文"""
    clear_context(provider)
    return {"success": True, "provider": provider, "message": "上下文已清除"}
