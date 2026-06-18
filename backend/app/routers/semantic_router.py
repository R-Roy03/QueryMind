"""
Semantic Router — generate and check status of the semantic layer.
"""
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from app.services.semantic_builder import semantic_builder

router = APIRouter()


class SemanticRequest(BaseModel):
    force: bool = False


@router.post("/generate")
def generate(request: SemanticRequest):
    """Generate semantic layer (business descriptions for all tables/columns)."""
    try:
        return semantic_builder.build(force=request.force)
    except Exception as e:
        raise HTTPException(500, detail=str(e))


@router.get("/status")
def status():
    """Check if semantic layer has been generated."""
    is_ready = "semantic_layer" in semantic_builder._cache
    return {"ready": is_ready}
