from fastapi import APIRouter, HTTPException
from app.services.metrics_engine import get_live_metrics

router = APIRouter()


@router.get("/live")
def live_metrics():
    """Get live business + pipeline metrics."""
    try:
        return get_live_metrics()
    except Exception as e:
        raise HTTPException(500, detail=str(e))
