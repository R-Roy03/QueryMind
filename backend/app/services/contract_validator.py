"""
Data Contract Validator — Validates data quality rules per table.
Pre-built contract templates + LLM failure diagnosis.
"""
from app.services.query_executor import query_executor
from app.llm.mistral_client import llm
import logging

logger = logging.getLogger(__name__)

# Contracts are defined against the live Olist schema (as loaded by
# demo_data/seed_kaggle.sql). Table and column names match the PostgreSQL
# database, which corrects the misspelled CSV headers (e.g. the CSV column
# 'product_name_lenght' is loaded as 'product_name_length').
#
# Most rules are expected to pass at 100%. Two are deliberately kept even
# though they fail against the real data, because they surface genuine
# completeness gaps rather than reporting a meaningless 100%.
DEFAULT_CONTRACTS = {
    "olist_orders": [
        {"id": "r1", "column": "order_id", "check": "not_null", "description": "Every order must have an ID"},
        {"id": "r2", "column": "customer_id", "check": "not_null", "description": "Order must be linked to a customer"},
        {"id": "r3", "column": "order_purchase_timestamp", "check": "not_null", "description": "Order must have a purchase timestamp"},
        {"id": "r4", "column": "order_status", "check": "in",
         "value": ["delivered", "shipped", "canceled", "unavailable", "invoiced", "processing", "created", "approved"],
         "description": "Order status must be one of the known lifecycle states"},
        # Known partial (~97%): undelivered/cancelled orders legitimately have
        # no delivery date. This is a completeness signal, not corruption.
        {"id": "r5", "column": "order_delivered_customer_date", "check": "not_null", "description": "Delivered orders should have a delivery date"},
    ],
    "olist_customers": [
        {"id": "r1", "column": "customer_id", "check": "not_null", "description": "Every customer row must have an ID"},
        {"id": "r2", "column": "customer_unique_id", "check": "not_null", "description": "Customer must have a cross-order unique ID"},
        {"id": "r3", "column": "customer_state", "check": "not_null", "description": "Customer must have a state for regional analysis"},
        {"id": "r4", "column": "customer_zip_code_prefix", "check": "not_null", "description": "Customer must have a zip code prefix"},
    ],
    "olist_products": [
        {"id": "r1", "column": "product_id", "check": "not_null", "description": "Every product must have an ID"},
        {"id": "r2", "column": "product_weight_g", "check": "gte", "value": 0, "description": "Product weight cannot be negative"},
        # Known partial (~98%): 610 products have no category in the source data.
        {"id": "r3", "column": "product_category_name", "check": "not_null", "description": "Product should have a category"},
    ],
    "olist_order_items": [
        {"id": "r1", "column": "order_id", "check": "not_null", "description": "Line item must belong to an order"},
        {"id": "r2", "column": "product_id", "check": "not_null", "description": "Line item must reference a product"},
        {"id": "r3", "column": "price", "check": "gt", "value": 0, "description": "Item price must be positive"},
        {"id": "r4", "column": "freight_value", "check": "gte", "value": 0, "description": "Freight cost cannot be negative"},
    ],
    "olist_order_payments": [
        {"id": "r1", "column": "order_id", "check": "not_null", "description": "Payment must belong to an order"},
        {"id": "r2", "column": "payment_value", "check": "gte", "value": 0, "description": "Payment amount cannot be negative"},
        {"id": "r3", "column": "payment_type", "check": "in",
         "value": ["credit_card", "boleto", "voucher", "debit_card", "not_defined"],
         "description": "Payment type must be a known method"},
    ],
    "olist_order_reviews": [
        {"id": "r1", "column": "review_id", "check": "not_null", "description": "Every review must have an ID"},
        {"id": "r2", "column": "order_id", "check": "not_null", "description": "Review must belong to an order"},
        {"id": "r3", "column": "review_score", "check": "between", "value": [1, 5], "description": "Review score must be between 1 and 5"},
    ],
}


def _present(col: str) -> str:
    """SQL predicate for 'this value is actually populated'.

    A bare `IS NOT NULL` is not enough. Whether a missing CSV field lands as
    NULL or as an empty string depends entirely on how the data was loaded:
    the production Postgres seed uses `COPY ... WITH (NULL '')` so blanks
    become real NULLs, but a plain CSV import into SQLite/MySQL stores them
    as ''. Against such a load `IS NOT NULL` passes vacuously and the
    contract reports a meaningless 100%.

    Treating blank-or-whitespace as missing makes the rule report the same
    completeness number on every backend db_manager supports. The CAST is
    needed because several checked columns are TIMESTAMP or numeric, and
    TRIM() has no implicit cast from those on Postgres.
    """
    try:
        from app.services.db_manager import db_manager
        db_type = db_manager.db_type
    except Exception:
        db_type = "unknown"
    char_type = "CHAR" if db_type == "mysql" else "VARCHAR"
    return f"({col} IS NOT NULL AND TRIM(CAST({col} AS {char_type})) <> '')"


def _build_check_sql(table: str, rule: dict):
    col = rule["column"]
    check = rule["check"]
    val = rule.get("value")

    if check == "not_null":
        return (f"SELECT COUNT(*) FROM {table} WHERE {_present(col)}",
                f"SELECT COUNT(*) FROM {table}")
    elif check == "gt":
        return (f"SELECT COUNT(*) FROM {table} WHERE {_present(col)} AND CAST({col} AS DECIMAL) > {val}",
                f"SELECT COUNT(*) FROM {table} WHERE {_present(col)}")
    elif check == "gte":
        return (f"SELECT COUNT(*) FROM {table} WHERE {_present(col)} AND CAST({col} AS DECIMAL) >= {val}",
                f"SELECT COUNT(*) FROM {table} WHERE {_present(col)}")
    elif check == "in":
        vals = "','".join(str(v) for v in val)
        return (f"SELECT COUNT(*) FROM {table} WHERE {_present(col)} AND {col} IN ('{vals}')",
                f"SELECT COUNT(*) FROM {table} WHERE {_present(col)}")
    elif check == "between":
        lo, hi = val
        return (f"SELECT COUNT(*) FROM {table} WHERE {_present(col)} AND CAST({col} AS DECIMAL) BETWEEN {lo} AND {hi}",
                f"SELECT COUNT(*) FROM {table} WHERE {_present(col)}")
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

            if pass_count > total_count:
                raise ValueError(
                    f"rule {rule['id']}: pass_count {pass_count} exceeds total_count "
                    f"{total_count} — numerator and denominator disagree on which "
                    f"rows are in scope"
                )
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
