"""
Small utility functions used across the app.
Nothing fancy — just common helpers to avoid repeating code.
"""
import json
import logging

logger = logging.getLogger(__name__)


def safe_json_parse(text: str) -> dict | None:
    """Try to parse JSON, return None if it fails instead of crashing."""
    try:
        # Strip markdown code fences if the LLM added them
        cleaned = text.replace("```json", "").replace("```", "").strip()
        return json.loads(cleaned)
    except json.JSONDecodeError:
        logger.warning(f"Failed to parse JSON: {text[:200]}")
        return None


def truncate(text: str, max_len: int = 500) -> str:
    """Truncate text with ellipsis if too long."""
    if len(text) <= max_len:
        return text
    return text[:max_len] + "..."
