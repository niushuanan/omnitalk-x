from fastapi import APIRouter, Request
from pydantic import BaseModel
from typing import List, Optional
from backend.service.group_service import (
    load_groups,
    get_group,
    create_group,
    update_group,
    delete_group,
    get_group_context,
    clear_group_context,
    get_group_announcement,
    update_group_announcement,
    generate_default_announcement,
    is_default_group,
    BOT_NAMES
)

router = APIRouter()


class CreateGroupRequest(BaseModel):
    name: str
    bots: List[str]


class UpdateGroupRequest(BaseModel):
    name: str
    bots: List[str]


class UpdateAnnouncementRequest(BaseModel):
    announcement: str


@router.get("/groups")
async def get_groups():
    """获取群组列表"""
    groups = load_groups()
    result = []
    for g in groups:
        bot_names = [BOT_NAMES.get(b, b) for b in g.get("bots", [])]
        announcement = g.get("announcement", "")
        result.append({
            "id": g["id"],
            "name": g["name"],
            "bots": g.get("bots", []),
            "bot_names": bot_names,
            "bot_count": len(g.get("bots", [])),
            "is_default": g.get("is_default", False),
            "created_at": g.get("created_at", ""),
            "announcement": announcement
        })
    return {"success": True, "groups": result}


@router.post("/groups")
async def create_group_api(request: CreateGroupRequest):
    """创建群组"""
    if len(request.bots) < 2:
        return {"success": False, "message": "至少需要选择 2 个 AI"}
    
    group = create_group(request.name, request.bots)
    if group is None:
        groups = load_groups()
        group_count = len([g for g in groups if not g.get("is_default", False)])
        if group_count >= 5:
            return {"success": False, "message": "已达到最大群组数量限制（5个）"}
        return {"success": False, "message": "群组名称已存在"}
    
    return {"success": True, "group": group}


@router.put("/groups/{group_id}")
async def update_group_api(group_id: str, request: UpdateGroupRequest):
    """更新群组"""
    if len(request.bots) < 2:
        return {"success": False, "message": "至少需要选择 2 个 AI"}
    
    group = update_group(group_id, request.name, request.bots)
    if group is None:
        return {"success": False, "message": "更新失败，全员群不可编辑"}
    
    return {"success": True, "group": group}


@router.delete("/groups/{group_id}")
async def delete_group_api(group_id: str):
    """删除群组"""
    success = delete_group(group_id)
    if not success:
        return {"success": False, "message": "删除失败，全员群不可删除"}
    return {"success": True, "message": "群组已删除"}


@router.get("/groups/{group_id}/context")
async def get_group_context_api(group_id: str):
    """获取群组上下文"""
    group = get_group(group_id)
    if not group:
        return {"success": False, "message": "群组不存在"}
    
    context = get_group_context(group_id)
    return {"success": True, "group_id": group_id, "context": context}


@router.delete("/groups/{group_id}/context")
async def clear_group_context_api(group_id: str):
    """清除群组上下文"""
    group = get_group(group_id)
    if not group:
        return {"success": False, "message": "群组不存在"}
    
    clear_group_context(group_id)
    return {"success": True, "message": "上下文已清除"}


@router.get("/groups/{group_id}/announcement")
async def get_group_announcement_api(group_id: str):
    """获取群公告"""
    group = get_group(group_id)
    if not group:
        return {"success": False, "message": "群组不存在"}
    
    announcement = group.get("announcement", "")
    is_default = is_default_group(group)
    
    if is_default:
        announcement = generate_default_announcement(group)
    
    return {"success": True, "announcement": announcement, "is_default": is_default}


@router.put("/groups/{group_id}/announcement")
async def update_group_announcement_api(group_id: str, request: UpdateAnnouncementRequest):
    """更新群公告"""
    group = get_group(group_id)
    if not group:
        return {"success": False, "message": "群组不存在"}
    
    if is_default_group(group):
        return {"success": False, "message": "全员群不支持自定义公告"}
    
    updated_group = update_group_announcement(group_id, request.announcement)
    if not updated_group:
        return {"success": False, "message": "更新失败"}
    
    return {"success": True, "group": updated_group}
