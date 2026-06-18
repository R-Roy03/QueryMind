"""
Data Contract Validator — Validates data quality rules per table.
Pre-built contract templates + LLM failure diagnosis.
"""
from app.services.query_executor import query_executor
from app.llm.mistral_client import llm
import logging

logger = logging.getLogger(__name__)

DEFAULT_CONTRACTS = {
    "orders": [
        {"id": "r1", "column": "total_amount", "check": "gt", "value": 0, "description": "Order amount must be positive"},
        {"id": "r2", "column": "status", "check": "in", "value": ["completed", "pending", "cancelled", "processing"], "description": "Status must be a valid value"},
        {"id": "r3", "column": "order_date", "check": "not_null", "description": "Order date cannot be null"},
        {"id": "r4", "column": "customer_id", "check": "not_null", "description": "Order must be linked to a customer"},
    ],
    "customers": [
        {"id": "r1", "column": "email", "check": "not_null", "description": "Email is required"},
        {"id": "r2", "column": "full_name", "check": "not_null", "description": "Customer must have a name"},
        {"id": "r3", "column": "tier", "check": "in", "value": ["standard", "gold", "premium"], "description": "Tier must be valid"},
        {"id": "r4", "column": "signup_date", "check": "not_null", "description": "Signup date required"},
    ],
    "products": [
        {"id": "r1", "column": "unit_price", "check": "gt", "value": 0, "description": "Price must be positive"},
        {"id": "r2", "column": "stock_qty", "check": "gte", "value": 0, "description": "Stock cannot be negative"},
        {"id": "r3", "column": "product_name", "check": "not_null", "description": "Product must have a name"},
    ],
    "events": [
        {"id": "r1", "column": "customer_id", "check": "not_null", "description": "Event must belong to a customer"},
        {"id": "r2", "column": "event_type", "check": "not_null", "description": "Event type required"},
        {"id": "r3", "column": "event_date", "check": "not_null", "description": "Event timestamp required"},
    ]
}


def _build_check_sql(table: str, rule: dict):
    col = rule["column"]
    check = rule["check"]
    val = rule.get("value")

    if check == "not_null":
        return (f"SELECT COUNT(*) FROM {table} WHERE {col} IS NOT NULL",
                f"SELECT COUNT(*) FROM {table}")
    elif check == "gt":
        return (f"SELECT COUNT(*) FROM {table} WHERE CAST({col} AS DECIMAL) > {val}",
                f"SELECT COUNT(*) FROM {table} WHERE {col} IS NOT NULL")
    elif check == "gte":
        return (f"SELECT COUNT(*) FROM {table} WHERE CAST({col} AS DECIMAL) >= {val}",
                f"SELECT COUNT(*) FROM {table} WHERE {col} IS NOT NULL")
    elif check == "in":
        vals = "','".join(str(v) for v in val)
        return (f"SELECT COUNT(*) FROM {table} WHERE {col} IN ('{vals}')",
                f"SELECT COUNT(*) FROM {table} WHERE {col} IS NOT NULL")
    elif check == "unique":
        return (f"SELECT COUNT(DISTINCT {col}) FROM {table}",
                f"SELECT COUNT(*) FROM {table}")
    return None, None


def validate_contracts(table_name: str) -> dict:
    """Run all contract rules for a table and return pass/fail per rule."""
    rules = DEFAULT_CONTRACTS.get(table_name, [])
    if not rules:
        return {"table": table_name, "rules": [], "message": "No contracts defined for this table"}

    results = []
    for rule in rules:
        try:
            pass_sql, total_sql = _build_check_sql(table_name, rule)
            pass_count = query_executor.run(pass_sql)['rows'][0][0]
            total_count = query_executor.run(total_sql)['rows'][0][0]

            pass_rate = round((pass_count / total_count) * 100, 1) if total_count > 0 else 0
            status = "pass" if pass_rate == 100 else "warn" if pass_rate >= 90 else "fail"

            results.append({
                "rule_id": rule["id"],
                "description": rule["description"],
                "column": rule["column"],
                "check": rule["check"],
                "expected": str(rule.get("value", "not null")),
                "pass_count": pass_count,
                "total_count": total_count,
                "pass_rate": pass_rate,
                "status": status
            })
        except Exception as e:
            results.append({
                "rule_id": rule["id"],
                "description": rule["description"],
                "status": "error",
                "error": str(e)
            })

    passing = sum(1 for r in results if r["status"] == "pass")
    health = round((passing / len(results)) * 100) if results else 0

    failures = [r for r in results if r["status"] in ["fail", "warn"]]
    ai_diagnosis = []
    if failures:
        fail_desc = [f["description"] + f" — only {f.get('pass_rate', 0)}% passing" for f in failures]
        prompt = f"""Data contract violations found in table '{table_name}':
{chr(10).join(fail_desc)}

For each violation, suggest the most likely root cause and a 1-line fix.
Return as JSON: [{{"violation": "...", "root_cause": "...", "fix": "..."}}]"""
        try:
            ai_diagnosis = llm.chat_json(prompt)
            if isinstance(ai_diagnosis, dict):
                ai_diagnosis = ai_diagnosis.get("violations", ai_diagnosis.get("diagnosis", []))
        except Exception:
            ai_diagnosis = []

    return {
        "table": table_name,
        "total_rules": len(results),
        "passing": passing,
        "contract_health": health,
        "status": "healthy" if health == 100 else "degraded" if health >= 80 else "violated",
        "rules": results,
        "ai_diagnosis": ai_diagnosis
    }


def validate_all_contracts() -> dict:
    """Validate contracts for all tables with defined contracts."""
    all_results = []
    for table_name in DEFAULT_CONTRACTS.keys():
        result = validate_contracts(table_name)
        all_results.append(result)

    overall_health = sum(r["contract_health"] for r in all_results) // max(len(all_results), 1)
    return {
        "overall_contract_health": overall_health,
        "tables_checked": len(all_results),
        "tables": all_results
    }
