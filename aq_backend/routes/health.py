"""" Simple health endpoint; returns 200 if the FastAPI app is running """

from fastapi import APIRouter
from pydantic import BaseModel


router = APIRouter(tags=["system"])


class HealthResponse(BaseModel):
    """ Model for health point response """
    status: str


@router.get("/health", response_model=HealthResponse)
def health() -> HealthResponse:
    """ Health endpoint """
    return HealthResponse(status="ok")
