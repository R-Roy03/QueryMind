from fastapi import APIRouter, HTTPException
from app.services.contract_validator import validate_contracts, validate_all_contracts

router = APIRouter()


@router.get("/validate")
def validate_all():
    """Validate data contracts for all tables."""
    try:
        return validate_all_contracts()
    except Exception as e:
        raise HTTPException(500, detail=str(e))


@router.get("/validate/{table_name}")
def validate_table(table_name: str):
    """Validate data contracts for a specific table."""
    try:
        return validate_contracts(table_name)
    except Exception as e:
        raise HTTPException(500, detail=str(e))
