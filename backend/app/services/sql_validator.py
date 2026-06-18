"""
SQL Validator — safety check before executing any LLM-generated SQL.
Blocks dangerous operations (INSERT, UPDATE, DELETE, DROP, etc.)
Only allows SELECT queries. Simple regex-based approach — good enough for this use case.
"""
import re
import logging

logger = logging.getLogger(__name__)

# Patterns that should NEVER appear in user-facing queries
BLOCKED = [
    r"\bINSERT\b", r"\bUPDATE\b", r"\bDELETE\b", r"\bDROP\b",
    r"\bCREATE\b", r"\bALTER\b", r"\bTRUNCATE\b", r"\bGRANT\b",
    r"\bREVOKE\b", r"--(?!.*$)", r"/\*",
]


def validate_sql(sql: str) -> dict:
    """
    Check SQL is safe before execution.
    Returns {"valid": bool, "issues": []}
    """
    issues = []
    sql_upper = sql.upper().strip()

    # Must start with SELECT or WITH (for CTEs like WITH ... AS (...) SELECT ...)
    if not (sql_upper.startswith("SELECT") or sql_upper.startswith("WITH")):
        issues.append("Only SELECT queries are allowed")

    # Check for blocked patterns
    for pattern in BLOCKED:
        if re.search(pattern, sql_upper, re.IGNORECASE):
            issues.append(f"Blocked pattern detected: {pattern}")

    # No multi-statement injections
    if sql.count(";") > 1:
        issues.append("Multiple semicolons detected")

    # Basic sanity — must have a FROM clause
    if "FROM" not in sql_upper:
        issues.append("Missing FROM clause")

    return {"valid": len(issues) == 0, "issues": issues}
