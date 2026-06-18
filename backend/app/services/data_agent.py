"""
Data Agent — the core agentic AI feature.
Implements a simple ReAct (Reason + Act) loop in ~100 lines.
NO LangChain. Pure Python. The agent can:
  - Run SQL queries
  - Get database schema
  - Get semantic layer
  - Suggest follow-up questions
"""
from app.llm.mistral_client import llm
from app.llm.prompts import AGENT_SYSTEM_PROMPT
from app.services.schema_extractor import schema_extractor
from app.services.semantic_builder import semantic_builder
from app.services.sql_validator import validate_sql
from app.services.query_executor import query_executor
import json
import logging

logger = logging.getLogger(__name__)

# Tools the agent can call
TOOLS = {
    "run_sql": lambda inp: _run_sql_tool(inp),
    "get_schema": lambda inp: _get_schema_tool(),
    "get_semantic_layer": lambda inp: _get_semantic_tool(),
    "suggest_followup": lambda inp: _suggest_followup_tool(inp),
    "scan_pii": lambda inp: _scan_pii_tool(),
    "validate_contracts": lambda inp: _validate_contracts_tool(inp),
    "detect_anomalies": lambda inp: _detect_anomalies_tool(inp),
    "estimate_cost": lambda inp: _estimate_cost_tool(inp),
}


def _run_sql_tool(inp: dict) -> str:
    """Execute a SQL query after validation."""
    sql = inp.get("sql", "")
    validation = validate_sql(sql)
    if not validation["valid"]:
        return f"SQL validation failed: {validation['issues']}"
    try:
        result = query_executor.run(sql)
        return json.dumps({
            "columns": result["columns"],
            "rows": result["rows"][:10],  # Agent only sees first 10 rows
            "row_count": result["row_count"],
        })
    except Exception as e:
        return f"Execution error: {str(e)}"


def _get_schema_tool() -> str:
    """Get the full database schema."""
    schema = schema_extractor.get_schema()
    return schema_extractor.to_prompt_string(schema)


def _get_semantic_tool() -> str:
    """Get the semantic layer."""
    sem = semantic_builder.build()
    return json.dumps(sem["data"])


def _suggest_followup_tool(inp: dict) -> str:
    """Suggest follow-up questions based on current context."""
    context = inp.get("context", "")
    prompt = (
        f"Based on this data analysis context, suggest 3 specific follow-up questions "
        f"a business user might want to ask:\n{context}\n"
        f"Return as JSON array of 3 strings."
    )
    return llm.chat(prompt)


def _scan_pii_tool() -> str:
    """Scan the entire schema for PII data."""
    from app.services.pii_scanner import scan_full_schema_for_pii
    try:
        result = scan_full_schema_for_pii()
        summary = {
            "total_pii_columns": result["total_pii_columns"],
            "compliance_risk": result["compliance_risk"],
            "tables": [
                {
                    "table": t["table"],
                    "pii_columns": t["pii_columns"],
                    "critical": t["critical_columns"],
                }
                for t in result["tables"] if t["pii_columns"] > 0
            ],
        }
        return json.dumps(summary)
    except Exception as e:
        return f"PII scan error: {str(e)}"


def _validate_contracts_tool(inp: dict) -> str:
    """Validate data contracts. If input has table_name, validate that table only."""
    from app.services.contract_validator import validate_contracts, validate_all_contracts
    try:
        table = inp.get("table_name")
        if table:
            result = validate_contracts(table)
        else:
            result = validate_all_contracts()
        return json.dumps({
            "overall_health": result.get("overall_contract_health", result.get("contract_health")),
            "tables_checked": result.get("tables_checked", 1),
            "status": result.get("status", ""),
        })
    except Exception as e:
        return f"Contract validation error: {str(e)}"


def _detect_anomalies_tool(inp: dict) -> str:
    """Detect anomalies. If input has table+column, scan that. Otherwise scan all."""
    from app.services.anomaly_detector import detect_numeric_anomalies, run_full_anomaly_scan
    try:
        table = inp.get("table")
        column = inp.get("column")
        if table and column:
            result = detect_numeric_anomalies(table, column)
        else:
            result = run_full_anomaly_scan()
        return json.dumps({
            "tables_scanned": result.get("tables_scanned", 1),
            "total_anomalies": result.get("total_anomalies", result.get("anomaly_count", 0)),
        })
    except Exception as e:
        return f"Anomaly detection error: {str(e)}"


def _estimate_cost_tool(inp: dict) -> str:
    """Estimate cost/complexity of a SQL query."""
    from app.services.cost_estimator import estimate_query_cost
    sql = inp.get("sql", "")
    if not sql:
        return "No SQL provided"
    schema = schema_extractor.get_schema()
    schema_str = schema_extractor.to_prompt_string(schema)
    try:
        result = estimate_query_cost(sql, schema_str)
        return json.dumps({
            "complexity_score": result["complexity_score"],
            "cost_tier": result["cost_tier"],
            "estimated_cost": result["estimated_cloud_cost"],
            "flags": result["flags"],
        })
    except Exception as e:
        return f"Cost estimation error: {str(e)}"


def run_agent(user_message: str, history: list) -> dict:
    """
    Run the ReAct agent loop.
    Returns: {"answer": str, "steps": [{"thought": str, "action": str, "result": str}]}
    """
    messages = [{"role": "system", "content": AGENT_SYSTEM_PROMPT}]

    # Add conversation history (last 3 turns = 6 messages)
    for h in history[-6:]:
        messages.append({"role": h["role"], "content": h["content"]})

    messages.append({"role": "user", "content": user_message})

    steps = []
    max_iterations = 8

    for i in range(max_iterations):
        # Send the FULL conversation history every iteration
        response = llm.chat_messages(messages)

        # Add the assistant response to history for next iteration
        messages.append({"role": "assistant", "content": response})

        # Check if agent is done (FINAL ANSWER present)
        if "FINAL ANSWER:" in response:
            answer = response.split("FINAL ANSWER:")[-1].strip()
            return {"answer": answer, "steps": steps}

        # Parse THOUGHT + ACTION + INPUT
        if "ACTION:" in response and "INPUT:" in response:
            try:
                # Extract thought
                thought = ""
                if "THOUGHT:" in response:
                    thought = response.split("THOUGHT:")[-1].split("ACTION:")[0].strip()

                # Extract action name
                action_part = response.split("ACTION:")[-1]
                action = action_part.split("INPUT:")[0].strip().split("\n")[0].strip()

                # Extract input JSON — get everything after the last INPUT:
                input_str = response.split("INPUT:")[-1].strip()
                # Clean up: take only the first JSON object
                # Remove any trailing text/commentary after the JSON
                input_str = input_str.strip()
                try:
                    action_input = json.loads(input_str)
                except json.JSONDecodeError:
                    # Try to extract just the JSON portion
                    brace_start = input_str.find("{")
                    if brace_start >= 0:
                        # Find matching closing brace
                        depth = 0
                        for idx in range(brace_start, len(input_str)):
                            if input_str[idx] == "{":
                                depth += 1
                            elif input_str[idx] == "}":
                                depth -= 1
                                if depth == 0:
                                    action_input = json.loads(input_str[brace_start:idx + 1])
                                    break
                        else:
                            action_input = {}
                    else:
                        action_input = {}

                # Execute tool
                tool_fn = TOOLS.get(action)
                if tool_fn:
                    tool_result = tool_fn(action_input)
                else:
                    tool_result = f"Unknown tool: {action}"

                steps.append({
                    "thought": thought,
                    "action": action,
                    "input": action_input,
                    "result": tool_result[:500],  # Truncate for UI
                })

                # On the second-to-last iteration, force agent to wrap up
                if i >= max_iterations - 2:
                    messages.append({
                        "role": "user",
                        "content": f"Tool '{action}' returned:\n{tool_result}\n\nYou have enough data now. You MUST provide your FINAL ANSWER immediately. Do NOT call any more tools. Format:\nTHOUGHT: summarize findings\nFINAL ANSWER: your complete response",
                    })
                else:
                    messages.append({
                        "role": "user",
                        "content": f"Tool '{action}' returned:\n{tool_result}\n\nNow analyze the results and either use another tool or provide your FINAL ANSWER.",
                    })

            except Exception as e:
                logger.error(f"Agent parse error: {e}", exc_info=True)
                # Ask agent to try again with clearer format
                messages.append({
                    "role": "user",
                    "content": "I couldn't parse your last response. Please respond using the exact format:\nTHOUGHT: your reasoning\nACTION: tool_name\nINPUT: {\"key\": \"value\"}\n\nOr if you have a final answer:\nTHOUGHT: your reasoning\nFINAL ANSWER: your response",
                })
        else:
            # Agent gave a direct response without the FINAL ANSWER tag
            # Treat the whole response as the answer
            return {"answer": response, "steps": steps}

    return {
        "answer": "I wasn't able to complete the analysis. Please try rephrasing your question.",
        "steps": steps,
    }
