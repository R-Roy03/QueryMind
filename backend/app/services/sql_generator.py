"""
SQL Generator — takes a natural language question and produces SQL.
Uses schema + semantic context to generate accurate queries.
"""
from app.llm.mistral_client import llm
from app.llm.prompts import TEXT_TO_SQL_PROMPT
from app.services.schema_extractor import schema_extractor
from app.services.semantic_builder import semantic_builder
from app.config import settings
import logging

logger = logging.getLogger(__name__)


def generate_sql(question: str, max_rows: int = None) -> dict:
    """
    Convert natural language question to SQL.
    Returns: {"sql": str, "tables_used": list, "explanation": str, "confidence": float}
    """
    if max_rows is None:
        max_rows = settings.max_rows

    # Get schema and semantic context
    schema = schema_extractor.get_schema()
    schema_str = schema_extractor.to_prompt_string(schema)

    # Try to get semantic layer (might not be generated yet)
    try:
        semantic = semantic_builder.build()
        semantic_str = semantic_builder.to_prompt_string(semantic["data"])
    except Exception:
        semantic_str = "Semantic layer not available yet."

    prompt = TEXT_TO_SQL_PROMPT.format(
        schema_str=schema_str,
        semantic_str=semantic_str,
        question=question,
        max_rows=max_rows,
    )

    logger.info(f"Generating SQL for: {question}")
    result = llm.chat_json(prompt)
    return result
