""" Async database engine and session factory """

from __future__ import annotations

from collections.abc import AsyncIterator

from sqlalchemy.ext.asyncio import (
    AsyncSession,
    async_sessionmaker,
    create_async_engine,
)

from aq_backend.config import get_settings


def _make_engine():
    settings = get_settings()
    return create_async_engine(
        settings.database_url,
        echo=False,
        pool_pre_ping=True,
        pool_size=5,
        max_overflow=10,
    )


_engine = _make_engine()
_session_factory = async_sessionmaker(_engine, expire_on_commit=False)


def get_engine():
    return _engine


async def get_db() -> AsyncIterator[AsyncSession]:
    """ Yield a database session per request """
    async with _session_factory() as session:
        yield session
