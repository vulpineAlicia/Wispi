""" SQLAlchemy ORM models """

from __future__ import annotations

import uuid
from datetime import datetime

import sqlalchemy as sa
from sqlalchemy import DateTime, Float, ForeignKey, Integer, func
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column, relationship


class Base(DeclarativeBase):
    pass


# UUIDs are stored as native uuid in PostgreSQL but surfaced as plain strings in
# Python (as_uuid=False). This alias makes that intent visible at the call site.
type UUIDStr = str


def _uuid_pk():
    return mapped_column(sa.Uuid(as_uuid=False), primary_key=True, default=lambda: str(uuid.uuid4()))


class User(Base):
    __tablename__ = "users"

    id: Mapped[UUIDStr] = _uuid_pk()
    nickname: Mapped[str] = mapped_column(sa.String(64), unique=True)
    avatar_id: Mapped[int] = mapped_column(Integer)
    password_hash: Mapped[str] = mapped_column(sa.String(128))
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )

    refresh_tokens: Mapped[list[RefreshToken]] = relationship(
        "RefreshToken", back_populates="user", cascade="all, delete-orphan"
    )
    favorite_cities: Mapped[list[FavoriteCity]] = relationship(
        "FavoriteCity", back_populates="user", cascade="all, delete-orphan"
    )


class RefreshToken(Base):
    __tablename__ = "refresh_tokens"

    id: Mapped[UUIDStr] = _uuid_pk()
    user_id: Mapped[UUIDStr] = mapped_column(
        sa.Uuid(as_uuid=False), ForeignKey("users.id", ondelete="CASCADE")
    )
    token_hash: Mapped[str] = mapped_column(sa.String(64), unique=True)
    expires_at: Mapped[datetime] = mapped_column(DateTime(timezone=True))
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )

    user: Mapped[User] = relationship("User", back_populates="refresh_tokens")


class FavoriteCity(Base):
    __tablename__ = "favorite_cities"

    id: Mapped[UUIDStr] = _uuid_pk()
    user_id: Mapped[UUIDStr] = mapped_column(
        sa.Uuid(as_uuid=False), ForeignKey("users.id", ondelete="CASCADE")
    )
    name: Mapped[str] = mapped_column(sa.String(128))
    country: Mapped[str | None] = mapped_column(sa.String(64))
    lat: Mapped[float] = mapped_column(Float)
    lon: Mapped[float] = mapped_column(Float)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )

    user: Mapped[User] = relationship("User", back_populates="favorite_cities")
