"""
Semantic Builder — uses Mistral to auto-annotate database schema with business meanings.
This is the "secret sauce" — turns cryptic column names into human-readable descriptions.
Results are cached in memory so we don't hit the LLM on every request.
"""
from app.llm.mistral_client import llm
from app.llm.prompts import SEMANTIC_LAYER_PROMPT
from app.services.schema_extractor import schema_extractor
import logging

logger = logging.getLogger(__name__)


class SemanticBuilder:
    def __init__(self):
        self._cache = {}  # Simple in-memory cache

    def build(self, force: bool = False) -> dict:
        """Generate semantic layer. Uses cache unless force=True."""
        cache_key = "semantic_layer"
        if not force and cache_key in self._cache:
            logger.info("Serving semantic layer from cache")
            return {"data": self._cache[cache_key], "from_cache": True}

        schema = schema_extractor.get_schema()
        schema_str = schema_extractor.to_prompt_string(schema)
        prompt = SEMANTIC_LAYER_PROMPT.format(schema_str=schema_str)

        logger.info("Generating semantic layer via Mistral...")
        result = llm.chat_json(prompt)
        self._cache[cache_key] = result

        return {"data": result, "from_cache": False}

    def to_prompt_string(self, semantic: dict) -> str:
        """Convert semantic layer to string for injection into SQL prompts."""
        lines = []
        for table, cols in semantic.items():
            table_desc = cols.get("_table_desc", "")
            lines.append(f"Table '{table}': {table_desc}")
            for col, desc in cols.items():
                if col != "_table_desc":
                    lines.append(f"  - {col}: {desc}")
            lines.append("")
        return "\n".join(lines)


semantic_builder = SemanticBuilder()
