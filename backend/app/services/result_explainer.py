"""
Result Explainer — takes query results and explains them in plain English.
Aimed at business executives who don't know SQL.
"""
from app.llm.mistral_client import llm
from app.llm.prompts import RESULT_EXPLAINER_PROMPT
import logging

logger = logging.getLogger(__name__)


def explain_results(question: str, columns: list, rows: list, row_count: int) -> str:
    """
    Generate a plain English explanation of query results.
    Returns a 2-3 sentence summary.
    """
    prompt = RESULT_EXPLAINER_PROMPT.format(
        question=question,
        row_count=row_count,
        columns=columns,
        sample_rows=rows[:5],
    )

    logger.info("Generating result explanation...")
    explanation = llm.chat(prompt)
    return explanation
