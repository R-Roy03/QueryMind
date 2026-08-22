from fastapi import APIRouter, HTTPException
from app.services.anomaly_detector import run_full_anomaly_scan, detect_numeric_anomalies
from app.services.identifier_guard import InvalidIdentifierError

router = APIRouter()


@router.get("/scan")
def scan_all():
    """Run anomaly detection on all numeric columns."""
    try:
        return run_full_anomaly_scan()
    except Exception as e:
        raise HTTPException(500, detail=str(e))


@router.get("/scan/{table}/{column}")
def scan_column(table: str, column: str):
    """Run anomaly detection on a specific column."""
    try:
        return detect_numeric_anomalies(table, column)
    except InvalidIdentifierError as e:
        raise HTTPException(400, detail=str(e))
    except Exception as e:
        raise HTTPException(500, detail=str(e))
