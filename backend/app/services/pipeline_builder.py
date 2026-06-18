"""
Pipeline Builder — converts English description to a pipeline DAG definition.
Generates nodes, edges, and Airflow DAG code via Mistral.
"""
from app.llm.mistral_client import llm
from app.llm.prompts import PIPELINE_BUILDER_PROMPT
from app.services.schema_extractor import schema_extractor
import logging

logger = logging.getLogger(__name__)


def build_pipeline(description: str) -> dict:
    """
    Convert English description to pipeline DAG definition.
    Returns nodes + edges + airflow code.
    """
    schema = schema_extractor.get_schema()
    schema_str = schema_extractor.to_prompt_string(schema)

    prompt = PIPELINE_BUILDER_PROMPT.format(
        description=description,
        schema_str=schema_str,
    )

    logger.info(f"Building pipeline for: {description}")
    result = llm.chat_json(prompt)
    return result
