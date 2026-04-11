""" Auth routes: register, login, refresh, logout, me, change-password, delete """

from __future__ import annotations

from datetime import UTC, datetime

from fastapi import APIRouter, Cookie, Depends, Request, Response
from pydantic import BaseModel, Field
from sqlalchemy import delete, select
from sqlalchemy.ext.asyncio import AsyncSession

from aq_backend import auth
from aq_backend.config import get_settings
from aq_backend.database import get_db
from aq_backend.dependencies import get_current_user
from aq_backend.http_errors import api_error
from aq_backend.models import RefreshToken, User
from aq_backend.ratelimit import AUTH_LIMIT, limiter
from aq_backend.schemas import OkResponse, UserOut

router = APIRouter(prefix="/auth", tags=["auth"])

_COOKIE_NAME = "wispi_refresh"
_COOKIE_MAX_AGE = 30 * 24 * 3600  # 30 days
_SECURE_COOKIE = get_settings().app_env == "production"


def _set_refresh_cookie(response: Response, token: str) -> None:
    response.set_cookie(
        key=_COOKIE_NAME,
        value=token,
        max_age=_COOKIE_MAX_AGE,
        httponly=True,
        secure=_SECURE_COOKIE,
        samesite="lax",
        path="/",
    )


def _clear_refresh_cookie(response: Response) -> None:
    response.delete_cookie(
        key=_COOKIE_NAME,
        httponly=True,
        secure=_SECURE_COOKIE,
        samesite="lax",
        path="/",
    )


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserOut


class RegisterRequest(BaseModel):
    password: str = Field(min_length=8, max_length=128)


class LoginRequest(BaseModel):
    nickname: str
    password: str = Field(min_length=1, max_length=128)


class ChangePasswordRequest(BaseModel):
    old_password: str
    new_password: str = Field(min_length=8, max_length=128)


@router.post("/register", response_model=TokenResponse)
@limiter.limit(AUTH_LIMIT)
async def register(
    request: Request,
    body: RegisterRequest,
    response: Response,
    db: AsyncSession = Depends(get_db),
) -> TokenResponse:
    """ Create a new account with a server-generated nickname """
    for _ in range(10):
        nickname = auth.generate_nickname()
        taken = await db.scalar(select(User).where(User.nickname == nickname))
        if not taken:
            break
    else:
        raise api_error(500, "SERVER_ERROR", "Could not generate a unique nickname. Try again.")

    user = User(
        nickname=nickname,
        avatar_id=auth.random_avatar_id(),
        password_hash=auth.hash_password(body.password),
    )
    db.add(user)
    await db.flush()

    raw_token, expires_at = auth.create_refresh_token()
    db.add(RefreshToken(
        user_id=user.id,
        token_hash=auth.hash_token(raw_token),
        expires_at=expires_at,
    ))
    await db.commit()

    _set_refresh_cookie(response, raw_token)
    return TokenResponse(
        access_token=auth.create_access_token(user.id, user.nickname, user.avatar_id),
        user=UserOut(id=user.id, nickname=user.nickname, avatar_id=user.avatar_id),
    )


@router.post("/login", response_model=TokenResponse)
@limiter.limit(AUTH_LIMIT)
async def login(
    request: Request,
    body: LoginRequest,
    response: Response,
    db: AsyncSession = Depends(get_db),
) -> TokenResponse:
    """ Sign in with nickname + password """
    user = await db.scalar(select(User).where(User.nickname == body.nickname))

    if not user or not auth.verify_password(body.password, user.password_hash):
        raise api_error(401, "INVALID_CREDENTIALS", "Invalid nickname or password.")

    # Prune expired tokens for this user so sessions don't accumulate indefinitely.
    await db.execute(
        delete(RefreshToken).where(
            RefreshToken.user_id == user.id,
            RefreshToken.expires_at <= datetime.now(UTC),
        )
    )

    raw_token, expires_at = auth.create_refresh_token()
    db.add(RefreshToken(
        user_id=user.id,
        token_hash=auth.hash_token(raw_token),
        expires_at=expires_at,
    ))
    await db.commit()

    _set_refresh_cookie(response, raw_token)
    return TokenResponse(
        access_token=auth.create_access_token(user.id, user.nickname, user.avatar_id),
        user=UserOut(id=user.id, nickname=user.nickname, avatar_id=user.avatar_id),
    )


@router.post("/refresh", response_model=TokenResponse)
async def refresh_token(
    response: Response,
    db: AsyncSession = Depends(get_db),
    wispi_refresh: str | None = Cookie(default=None),
) -> TokenResponse:
    """ Exchange a valid refresh cookie for a new access token (rotates the refresh token) """
    if not wispi_refresh:
        raise api_error(401, "MISSING_TOKEN", "No refresh token provided.")

    token_hash = auth.hash_token(wispi_refresh)
    now = datetime.now(UTC)

    rt = await db.scalar(
        select(RefreshToken).where(
            RefreshToken.token_hash == token_hash,
            RefreshToken.expires_at > now,
        )
    )
    if not rt:
        raise api_error(401, "INVALID_TOKEN", "Refresh token is invalid or expired.")

    user = await db.get(User, rt.user_id)
    if not user:
        raise api_error(401, "INVALID_TOKEN", "User not found.")

    # Rotate: delete old token, issue new one
    await db.delete(rt)
    raw_token, expires_at = auth.create_refresh_token()
    db.add(RefreshToken(
        user_id=user.id,
        token_hash=auth.hash_token(raw_token),
        expires_at=expires_at,
    ))
    await db.commit()

    _set_refresh_cookie(response, raw_token)
    return TokenResponse(
        access_token=auth.create_access_token(user.id, user.nickname, user.avatar_id),
        user=UserOut(id=user.id, nickname=user.nickname, avatar_id=user.avatar_id),
    )


@router.post("/logout", response_model=OkResponse)
@limiter.limit(AUTH_LIMIT)
async def logout(
    request: Request,
    response: Response,
    db: AsyncSession = Depends(get_db),
    wispi_refresh: str | None = Cookie(default=None),
) -> OkResponse:
    """ Invalidate the refresh token and clear the cookie """
    try:
        if wispi_refresh:
            token_hash = auth.hash_token(wispi_refresh)
            rt = await db.scalar(select(RefreshToken).where(RefreshToken.token_hash == token_hash))
            if rt:
                await db.delete(rt)
                await db.commit()
    finally:
        _clear_refresh_cookie(response)
    return OkResponse()


@router.get("/me", response_model=UserOut)
async def me(current_user: User = Depends(get_current_user)) -> UserOut:
    """ Return the current authenticated user's info """
    return UserOut(id=current_user.id, nickname=current_user.nickname, avatar_id=current_user.avatar_id)


@router.post("/change-password", response_model=OkResponse)
@limiter.limit(AUTH_LIMIT)
async def change_password(
    request: Request,
    body: ChangePasswordRequest,
    response: Response,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> OkResponse:
    """ Change password (requires current password); invalidates all sessions """
    if not auth.verify_password(body.old_password, current_user.password_hash):
        raise api_error(401, "INVALID_CREDENTIALS", "Current password is incorrect.")

    current_user.password_hash = auth.hash_password(body.new_password)

    # Revoke all refresh tokens so every other session is forced to re-login.
    tokens = await db.scalars(select(RefreshToken).where(RefreshToken.user_id == current_user.id))
    for rt in tokens:
        await db.delete(rt)

    await db.commit()
    _clear_refresh_cookie(response)
    return OkResponse()


@router.delete("/me", response_model=OkResponse)
@limiter.limit(AUTH_LIMIT)
async def delete_account(
    request: Request,
    response: Response,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
    wispi_refresh: str | None = Cookie(default=None),
) -> OkResponse:
    """ Permanently delete the account (cascades to all tokens) """
    await db.delete(current_user)
    await db.commit()
    _clear_refresh_cookie(response)
    return OkResponse()
