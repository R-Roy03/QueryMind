"""
Query Router — the main text-to-SQL pipeline.
Takes a natural language question, generates SQL, validates it, executes it,
and explains the results in plain English.
"""
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from app.services.schema_extractor import schema_extractor
from app.services.semantic_builder import semantic_builder
from app.services.sql_validator import validate_sql
from app.services.query_executor import query_executor
from app.llm.mistral_client import llm
from app.llm.prompts import TEXT_TO_SQL_PROMPT, RESULT_EXPLAINER_PROMPT
from app.config import settings
import logging

router = APIRouter()
logger = logging.getLogger(__name__)


class AskRequest(BaseModel):
    question: str
    max_rows: int = 100


@router.post("/ask")
def ask(request: AskRequest):
    """
    Main endpoint: natural language → SQL → execute → explain.
    This is the core feature of QueryMind.
    """
    try:
        # Step 1: Get schema + semantic context
        schema = schema_extractor.get_schema()
        schema_str = schema_extractor.to_prompt_string(schema)
        semantic = semantic_builder.build()
        semantic_str = semantic_builder.to_prompt_string(semantic["data"])

        # Step 2: Generate SQL from the question
        prompt = TEXT_TO_SQL_PROMPT.format(
            schema_str=schema_str,
            semantic_str=semantic_str,
            question=request.question,
            max_rows=request.max_rows,
        )
        gen_result = llm.chat_json(prompt)
        sql = gen_result["sql"]

        # Step 3: Validate SQL (block any destructive operations)
        validation = validate_sql(sql)
        if not validation["valid"]:
            raise HTTPException(400, detail=f"SQL validation failed: {validation['issues']}")

        # Step 4: Execute the query
        exec_result = query_executor.run(sql)

        # Step 5: Explain results in plain English
        explain_prompt = RESULT_EXPLAINER_PROMPT.format(
            question=request.question,
            sql=sql,
            row_count=exec_result["row_count"],
            columns=exec_result["columns"],
            sample_rows=exec_result["rows"][:5],
        )
        explanation = llm.chat(explain_prompt)

        return {
            "question": request.question,
            "sql": sql,
            "explanation": explanation,
            "columns": exec_result["columns"],
            "rows": exec_result["rows"],
            "row_count": exec_result["row_count"],
            "execution_time_ms": exec_result["execution_time_ms"],
            "confidence": gen_result.get("confidence", 0.9),
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Query pipeline error: {e}", exc_info=True)
        raise HTTPException(500, detail=str(e))


OPTIMIZER_PROMPT = """
You are a SQL performance expert. Analyze this SQL query and give 2-3 short optimization tips.

SQL: {sql}
SCHEMA CONTEXT: {schema_info}

Focus on: indexing suggestions, JOIN order, unnecessary columns, partition pruning.
Each tip should be 1 sentence max. Be specific to the actual query.

Respond as JSON: {{"hints": [{{"tip": "...", "type": "index|join|select|partition"}}]}}
"""


class OptimizeRequest(BaseModel):
    sql: str


@router.post("/optimize")
def optimize(request: OptimizeRequest):
    """Get SQL optimization hints from AI."""
    try:
        schema = schema_extractor.get_schema()
        schema_info = schema_extractor.to_prompt_string(schema)
        prompt = OPTIMIZER_PROMPT.format(sql=request.sql, schema_info=schema_info)
        result = llm.chat_json(prompt)
        return {"hints": result.get("hints", [])}
    except Exception:
        return {"hints": []}
