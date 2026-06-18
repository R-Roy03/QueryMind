"""
Agent Router — conversational AI agent endpoint.
The agent reasons step by step, uses tools, and returns an answer + thinking steps.
"""
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List
from app.services.data_agent import run_agent
import logging

router = APIRouter()
logger = logging.getLogger(__name__)


class AgentRequest(BaseModel):
    message: str
    history: List[dict] = []


@router.post("/chat")
def agent_chat(request: AgentRequest):
    """
    Agentic chat endpoint. Agent reasons, uses tools, returns answer + steps.
    """
    try:
        result = run_agent(request.message, request.history)
        return result
    except Exception as e:
        logger.error(f"Agent error: {e}", exc_info=True)
        error_msg = str(e)
        if "429" in error_msg or "rate_limit" in error_msg.lower():
            raise HTTPException(429, detail="API rate limit reached. Please wait a moment and try again.")
        raise HTTPException(500, detail=error_msg)
