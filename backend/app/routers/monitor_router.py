from fastapi import APIRouter, HTTPException
from app.services.pipeline_monitor import get_run_history, get_failure_diagnosis, log_pipeline_run

router = APIRouter()


@router.get("/history")
def history(limit: int = 20):
    """Get pipeline run history with stats."""
    try:
        return get_run_history(limit)
    except Exception as e:
        raise HTTPException(500, detail=str(e))


@router.get("/diagnose/{run_id}")
def diagnose(run_id: int):
    """Get AI diagnosis for a failed pipeline run."""
    try:
        return get_failure_diagnosis(run_id)
    except Exception as e:
        raise HTTPException(500, detail=str(e))


@router.post("/log")
def log_run(body: dict):
    """Log a new pipeline run."""
    try:
        run_id = log_pipeline_run(
            body.get("pipeline_name", "unnamed"),
            body.get("description", ""),
            body.get("dag_code", ""),
            body.get("source_tables", []),
            body.get("sink_table", "")
        )
        return {"run_id": run_id, "status": "logged"}
    except Exception as e:
        raise HTTPException(500, detail=str(e))
