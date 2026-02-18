""" Internal metadata describing a call to an upstream service """
from dataclasses import dataclass


@dataclass(slots=True)
class UpstreamMeta:
    """ Diagnostic info produced by the service layer and used for logging """
    attempts: int
    total_ms: int
    last_status: int | None
    error: str | None = None
