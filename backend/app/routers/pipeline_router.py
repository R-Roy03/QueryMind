"""
Pipeline Router — convert English descriptions to pipeline DAGs.
"""
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from app.services.pipeline_builder import build_pipeline
import logging

router = APIRouter()
logger = logging.getLogger(__name__)


class PipelineRequest(BaseModel):
    description: str


@router.post("/build")
def build(request: PipelineRequest):
    """
    Convert English description → pipeline DAG + Airflow code.
    """
    try:
        result = build_pipeline(request.description)
        return result
    except Exception as e:
        logger.error(f"Pipeline build error: {e}", exc_info=True)
        raise HTTPException(500, detail=str(e))
