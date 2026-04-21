""" Health endpoint; probes the DB so orchestrators get an accurate signal """

from fastapi import APIRouter, Depends, Response
from pydantic import BaseModel
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

from aq_backend.database import get_db

router = APIRouter(tags=["system"])


class HealthResponse(BaseModel):
    status: str


@router.get("/health", response_model=HealthResponse)
async def health(response: Response, db: AsyncSession = Depends(get_db)) -> HealthResponse:
    try:
        await db.execute(text("SELECT 1"))
    except Exception:
        response.status_code = 503
        return HealthResponse(status="db_unavailable")
    return HealthResponse(status="ok")
