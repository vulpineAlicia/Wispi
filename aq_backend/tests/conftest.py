import pytest


# Async tests use asyncio by default.
# When you add DB tests, add a fixture here that provides
# an async test client and a rolled-back database session, e.g.:
#
# @pytest.fixture
# async def client(db_session):
#     from httpx import AsyncClient
#     from aq_backend.main import app
#     async with AsyncClient(app=app, base_url="http://test") as ac:
#         yield ac
