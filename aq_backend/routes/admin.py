""" Admin routes: list and delete users (requires X-Admin-Key header) """

from __future__ import annotations

import logging

from fastapi import APIRouter, Depends, Query, Request
from pydantic import BaseModel, Field
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from aq_backend import auth
from aq_backend.database import get_db
from aq_backend.dependencies import require_admin
from aq_backend.http_errors import api_error
from aq_backend.models import User
from aq_backend.ratelimit import ADMIN_LIMIT, limiter
from aq_backend.schemas import OkResponse, UserAdminOut

logger = logging.getLogger("aq_backend.admin")

router = APIRouter(prefix="/admin", tags=["admin"], dependencies=[Depends(require_admin)])


class SetPasswordRequest(BaseModel):
    new_password: str = Field(min_length=8, max_length=128)


@router.get("/users", response_model=list[UserAdminOut])
@limiter.limit(ADMIN_LIMIT)
async def list_users(
    request: Request,
    nickname: str | None = None,
    limit: int = Query(50, ge=1, le=500),
    offset: int = Query(0, ge=0),
    db: AsyncSession = Depends(get_db),
) -> list[UserAdminOut]:
    """ Return registered users with optional nickname filter and pagination """
    query = select(User).order_by(User.created_at).limit(limit).offset(offset)
    if nickname:
        query = query.where(User.nickname.ilike(f"%{nickname}%"))
    users = await db.scalars(query)
    return [
        UserAdminOut(id=u.id, nickname=u.nickname, avatar_id=u.avatar_id, created_at=u.created_at)
        for u in users
    ]


@router.patch("/users/{user_id}/password", response_model=OkResponse)
@limiter.limit(ADMIN_LIMIT)
async def set_user_password(
    request: Request,
    user_id: str,
    body: SetPasswordRequest,
    db: AsyncSession = Depends(get_db),
) -> OkResponse:
    """ Set a new password for a user without requiring the current one """
    user = await db.get(User, user_id)
    if not user:
        raise api_error(404, "NOT_FOUND", "User not found.")
    user.password_hash = auth.hash_password(body.new_password)
    await db.commit()
    logger.warning(
        "Admin password reset",
        extra={"target_user_id": user_id, "request_id": getattr(request.state, "request_id", "-")},
    )
    return OkResponse()


@router.delete("/users/{user_id}", response_model=OkResponse)
@limiter.limit(ADMIN_LIMIT)
async def delete_user(
    request: Request,
    user_id: str,
    db: AsyncSession = Depends(get_db),
) -> OkResponse:
    """ Permanently delete a user account by ID (cascades to all tokens) """
    user = await db.get(User, user_id)
    if not user:
        raise api_error(404, "NOT_FOUND", "User not found.")
    target_nickname = user.nickname
    await db.delete(user)
    await db.commit()
    logger.warning(
        "Admin user deletion",
        extra={"target_user_id": user_id, "target_nickname": target_nickname, "request_id": getattr(request.state, "request_id", "-")},
    )
    return OkResponse()
