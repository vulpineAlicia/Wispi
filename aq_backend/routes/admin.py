""" Admin routes: list and delete users (requires X-Admin-Key header) """

from __future__ import annotations

from datetime import datetime

from fastapi import APIRouter, Depends
from pydantic import BaseModel, Field
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from aq_backend import auth
from aq_backend.database import get_db
from aq_backend.dependencies import require_admin
from aq_backend.http_errors import api_error
from aq_backend.models import User

router = APIRouter(prefix="/admin", tags=["admin"], dependencies=[Depends(require_admin)])


class SetPasswordRequest(BaseModel):
    new_password: str = Field(min_length=8, max_length=128)


class UserAdminOut(BaseModel):
    id: str
    nickname: str
    avatar_id: int
    created_at: datetime


@router.get("/users", response_model=list[UserAdminOut])
async def list_users(
    nickname: str | None = None,
    db: AsyncSession = Depends(get_db),
) -> list[UserAdminOut]:
    """ Return all registered users, optionally filtered by nickname (case-insensitive substring) """
    query = select(User).order_by(User.created_at)
    if nickname:
        query = query.where(User.nickname.ilike(f"%{nickname}%"))
    users = await db.scalars(query)
    return [
        UserAdminOut(id=u.id, nickname=u.nickname, avatar_id=u.avatar_id, created_at=u.created_at)
        for u in users
    ]


@router.patch("/users/{user_id}/password")
async def set_user_password(
    user_id: str,
    body: SetPasswordRequest,
    db: AsyncSession = Depends(get_db),
) -> dict:
    """ Set a new password for a user without requiring the current one """
    user = await db.get(User, user_id)
    if not user:
        raise api_error(404, "NOT_FOUND", "User not found.")
    user.password_hash = auth.hash_password(body.new_password)
    await db.commit()
    return {"ok": True}


@router.delete("/users/{user_id}")
async def delete_user(user_id: str, db: AsyncSession = Depends(get_db)) -> dict:
    """ Permanently delete a user account by ID (cascades to all tokens) """
    user = await db.get(User, user_id)
    if not user:
        raise api_error(404, "NOT_FOUND", "User not found.")
    await db.delete(user)
    await db.commit()
    return {"ok": True, "deleted": user_id}
