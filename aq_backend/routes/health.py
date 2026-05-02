""" Health endpoint; probes the DB so orchestrators get an accurate signal """

import asyncio
import logging

from fastapi import APIRouter, Depends, Response
from pydantic import BaseModel
from sqlalchemy import text
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.ext.asyncio import AsyncSession

from aq_backend.db.database import get_db

router = APIRouter(tags=["system"])
logger = logging.getLogger("aq_backend.health")

_DB_PROBE_TIMEOUT = 3.0


class HealthResponse(BaseModel):
    status: str


@router.get("/health", response_model=HealthResponse)
async def health(response: Response, db: AsyncSession = Depends(get_db)) -> HealthResponse:
    try:
        await asyncio.wait_for(db.execute(text("SELECT 1")), timeout=_DB_PROBE_TIMEOUT)
    except (asyncio.TimeoutError, OSError, SQLAlchemyError):
        logger.exception("Health check: DB probe failed")
        response.status_code = 503
        return HealthResponse(status="db_unavailable")
    return HealthResponse(status="ok")
