"""
Pydantic models for API request/response shapes.
Keeps router files clean — all request bodies defined here.
"""
from pydantic import BaseModel
from typing import List, Optional


class AskRequest(BaseModel):
    """Request body for the text-to-SQL endpoint."""
    question: str
    max_rows: int = 100


class AgentRequest(BaseModel):
    """Request body for the agent chat endpoint."""
    message: str
    history: List[dict] = []


class PipelineRequest(BaseModel):
    """Request body for the pipeline builder endpoint."""
    description: str


class SemanticRequest(BaseModel):
    """Request body for semantic layer generation."""
    force: bool = False
