from fastapi import APIRouter, HTTPException
from app.services.cost_estimator import estimate_query_cost
from app.services.schema_extractor import schema_extractor

router = APIRouter()


@router.post("/estimate")
def estimate(body: dict):
    """Estimate query cost and complexity."""
    sql = body.get("sql", "")
    schema = schema_extractor.get_schema()
    schema_str = schema_extractor.to_prompt_string(schema)
    try:
        return estimate_query_cost(sql, schema_str)
    except Exception as e:
        raise HTTPException(500, detail=str(e))
