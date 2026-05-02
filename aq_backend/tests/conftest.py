import os
from unittest.mock import AsyncMock, MagicMock

import pytest
import pytest_asyncio
from httpx import ASGITransport, AsyncClient
from sqlalchemy.ext.asyncio import async_sessionmaker, create_async_engine
from sqlalchemy.pool import StaticPool

# Set before any aq_backend import so get_settings() picks up test values
os.environ["OPENWEATHER_API_KEY"] = "test-key"
os.environ["DATABASE_URL"] = "sqlite+aiosqlite:///:memory:"
os.environ["ADMIN_KEY"] = "a" * 32
os.environ["JWT_SECRET"] = "s" * 32
os.environ["APP_ENV"] = "development"

from aq_backend.app import create_app
from aq_backend.config import get_settings
from aq_backend.db.database import get_db
from aq_backend.db.models import Base
from aq_backend.dependencies import ow_service
from aq_backend.services.openweather import OpenWeatherService
from aq_backend.services.openweather.errors import UpstreamMeta

get_settings.cache_clear()

ADMIN_KEY = "a" * 32
_DUMMY_META = UpstreamMeta(endpoint="test", attempts=1, total_ms=10, last_status=200)


@pytest_asyncio.fixture
async def db_engine():
    engine = create_async_engine(
        "sqlite+aiosqlite:///:memory:",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    yield engine
    await engine.dispose()


@pytest_asyncio.fixture
async def mock_ow():
    svc = MagicMock(spec=OpenWeatherService)
    svc.geocode = AsyncMock(return_value=([], _DUMMY_META))
    svc.air_current = AsyncMock(return_value=({"list": []}, _DUMMY_META))
    svc.air_history = AsyncMock(return_value=({"list": []}, _DUMMY_META))
    return svc


@pytest_asyncio.fixture
async def app(db_engine, mock_ow):
    _app = create_app()
    _sessions = async_sessionmaker(db_engine, expire_on_commit=False)

    async def _override_get_db():
        async with _sessions() as session:
            yield session

    _app.dependency_overrides[get_db] = _override_get_db
    _app.dependency_overrides[ow_service] = lambda: mock_ow
    _app.state.limiter.enabled = False
    yield _app
    _app.dependency_overrides.clear()


@pytest_asyncio.fixture
async def client(app):
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        yield ac


@pytest_asyncio.fixture
async def registered_user(client):
    resp = await client.post("/auth/register", json={"password": "TestPass1!"})
    assert resp.status_code == 200, resp.text
    body = resp.json()
    return body["user"], "TestPass1!", body["access_token"]


@pytest.fixture
def auth_headers(registered_user):
    _, _, token = registered_user
    return {"Authorization": f"Bearer {token}"}
