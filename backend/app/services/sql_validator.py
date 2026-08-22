"""
SQL Validator — safety check before executing any LLM-generated SQL.

Only read-only single-statement SELECT/WITH queries are allowed.

Approach: strip string literals, quoted identifiers and comments FIRST, then
scan what's left for dangerous keywords. Scanning the raw text produced false
positives (a query containing the word 'create' inside a LIKE pattern was
rejected) and false negatives (keywords could hide behind comments).

This is a safety check, not a correctness check. See the limitations section
in tests/test_sql_validator.py for what this deliberately cannot catch.
"""
import re
import logging

logger = logging.getLogger(__name__)

# Statement types that must never appear. INTO is here because Postgres
# treats `SELECT ... INTO new_table` as a table-creating statement even
# though it starts with SELECT.
BLOCKED_KEYWORDS = [
    "INSERT", "UPDATE", "DELETE", "DROP", "CREATE", "ALTER", "TRUNCATE",
    "GRANT", "REVOKE", "COPY", "MERGE", "CALL", "EXECUTE", "VACUUM", "INTO",
]

# Server-side functions and system catalogues that are read-only in the SQL
# sense but leak the filesystem, credentials, or burn the connection.
BLOCKED_IDENTIFIERS = [
    "pg_read_file", "pg_read_binary_file", "pg_ls_dir", "pg_stat_file",
    "pg_sleep", "lo_import", "lo_export", "dblink",
    "pg_authid", "pg_shadow", "pg_user_mappings",
]


def _strip_literals_and_comments(sql: str) -> tuple[str, bool]:
    """
    Replace string literals, quoted identifiers and comments with spaces.

    Returns (stripped_sql, comment_found). Keyword and semicolon checks run
    against the stripped text so that data can never be mistaken for code.
    """
    out = []
    comment_found = False
    i, n = 0, len(sql)

    while i < n:
        ch = sql[i]

        # Single-quoted string literal ('' is an escaped quote)
        if ch == "'":
            i += 1
            while i < n:
                if sql[i] == "'":
                    if i + 1 < n and sql[i + 1] == "'":
                        i += 2
                        continue
                    i += 1
                    break
                i += 1
            out.append(" ")
            continue

        # Double-quoted identifier ("" is an escaped quote)
        if ch == '"':
            i += 1
            while i < n:
                if sql[i] == '"':
                    if i + 1 < n and sql[i + 1] == '"':
                        i += 2
                        continue
                    i += 1
                    break
                i += 1
            out.append(" ")
            continue

        # -- line comment, runs to end of line
        if ch == "-" and i + 1 < n and sql[i + 1] == "-":
            comment_found = True
            while i < n and sql[i] != "\n":
                i += 1
            out.append(" ")
            continue

        # /* block comment */
        if ch == "/" and i + 1 < n and sql[i + 1] == "*":
            comment_found = True
            i += 2
            while i + 1 < n and not (sql[i] == "*" and sql[i + 1] == "/"):
                i += 1
            i += 2
            out.append(" ")
            continue

        out.append(ch)
        i += 1

    return "".join(out), comment_found


def validate_sql(sql: str) -> dict:
    """
    Check SQL is safe before execution.
    Returns {"valid": bool, "issues": []}
    """
    issues = []

    stripped, has_comment = _strip_literals_and_comments(sql)
    stripped_upper = stripped.upper().strip()

    # Must start with SELECT or WITH (for CTEs like WITH ... AS (...) SELECT ...)
    if not (stripped_upper.startswith("SELECT") or stripped_upper.startswith("WITH")):
        issues.append("Only SELECT queries are allowed")

    # Dangerous statement keywords, scanned outside of literals
    for keyword in BLOCKED_KEYWORDS:
        if re.search(rf"\b{keyword}\b", stripped_upper):
            issues.append(f"Blocked keyword: {keyword}")

    # Dangerous functions and system catalogues
    for identifier in BLOCKED_IDENTIFIERS:
        if re.search(rf"\b{identifier}\b", stripped_upper, re.IGNORECASE):
            issues.append(f"Blocked identifier: {identifier}")

    # Comments are an obfuscation vector and have no place in generated SQL
    if has_comment:
        issues.append("SQL comments are not allowed")

    # Single statement only. One trailing semicolon is normal; any other
    # semicolon (outside a string literal) means a second statement.
    if ";" in stripped.rstrip().rstrip(";"):
        issues.append("Multiple statements detected")

    # Basic sanity — must have a FROM clause
    if not re.search(r"\bFROM\b", stripped_upper):
        issues.append("Missing FROM clause")

    return {"valid": len(issues) == 0, "issues": issues}
