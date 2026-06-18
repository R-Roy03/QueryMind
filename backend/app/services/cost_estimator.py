"""
Cost Estimator — Heuristic + LLM query cost and complexity scorer.
"""
from app.llm.mistral_client import llm
import logging

logger = logging.getLogger(__name__)


def estimate_query_cost(sql: str, schema_info: str) -> dict:
    """Estimate query complexity, cost tier, and optimization hints."""
    sql_upper = sql.upper()

    complexity_score = 0
    flags = []

    join_count = sql_upper.count(" JOIN ")
    complexity_score += join_count * 15
    if join_count > 2:
        flags.append({"issue": f"{join_count} JOINs detected", "impact": "high", "type": "join"})

    subquery_count = sql_upper.count("SELECT") - 1
    complexity_score += subquery_count * 10
    if subquery_count > 0:
        flags.append({"issue": f"{subquery_count} subquery/CTE", "impact": "medium", "type": "subquery"})

    if "SELECT *" in sql_upper or "SELECT\n*" in sql_upper:
        complexity_score += 20
        flags.append({"issue": "SELECT * fetches all columns unnecessarily", "impact": "high", "type": "select"})

    if "LIMIT" not in sql_upper:
        complexity_score += 15
        flags.append({"issue": "No LIMIT clause — could return all rows", "impact": "medium", "type": "limit"})

    if "ORDER BY" in sql_upper and "LIMIT" not in sql_upper:
        complexity_score += 10
        flags.append({"issue": "ORDER BY without LIMIT — full sort on all rows", "impact": "high", "type": "sort"})

    if "GROUP BY" in sql_upper:
        complexity_score += 8

    if complexity_score < 20:
        cost_tier, estimated_cost, color = "low", "$0.001", "green"
    elif complexity_score < 45:
        cost_tier, estimated_cost, color = "medium", "$0.01 - $0.05", "amber"
    else:
        cost_tier, estimated_cost, color = "high", "$0.05 - $0.50+", "red"

    prompt = f"""You are a SQL performance expert. Analyze this SQL query:

{sql}

Schema context:
{schema_info}

Give exactly 3 specific optimization recommendations.
Focus on: indexing, query rewrite, partitioning, column selection.
Each recommendation must be actionable and specific to this query.

Return as JSON array:
[{{"tip": "...", "type": "index|rewrite|partition|columns", "estimated_improvement": "10-30% faster"}}]"""
    try:
        hints = llm.chat_json(prompt)
        if isinstance(hints, dict):
            hints = hints.get("recommendations", hints.get("hints", []))
    except Exception:
        hints = []

    return {
        "complexity_score": complexity_score,
        "cost_tier": cost_tier,
        "estimated_cloud_cost": estimated_cost,
        "cost_color": color,
        "flags": flags,
        "optimization_hints": hints if isinstance(hints, list) else [],
        "summary": f"Query complexity: {cost_tier.upper()}. Estimated cloud cost per run: {estimated_cost}."
    }
