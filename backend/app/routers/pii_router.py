from fastapi import APIRouter, HTTPException
from app.services.pii_scanner import scan_full_schema_for_pii, scan_column_for_pii

router = APIRouter()


@router.get("/scan")
def scan_all():
    """Full PII scan across all tables and columns."""
    try:
        return scan_full_schema_for_pii()
    except Exception as e:
        raise HTTPException(500, detail=str(e))


@router.get("/scan/{table}/{column}")
def scan_column(table: str, column: str):
    """PII scan for a specific column."""
    try:
        return scan_column_for_pii(table, column)
    except Exception as e:
        raise HTTPException(500, detail=str(e))
