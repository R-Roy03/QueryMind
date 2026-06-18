"""
Tests for SQL Validator.
Making sure our safety checks actually work — this is important
since we're executing LLM-generated SQL against a real database.
"""
from app.services.sql_validator import validate_sql


def test_valid_select():
    """Normal SELECT should pass."""
    result = validate_sql("SELECT * FROM customers LIMIT 10")
    assert result["valid"] is True
    assert len(result["issues"]) == 0


def test_blocks_insert():
    """INSERT should be blocked."""
    result = validate_sql("INSERT INTO customers (name) VALUES ('test')")
    assert result["valid"] is False


def test_blocks_drop():
    """DROP TABLE should be blocked."""
    result = validate_sql("DROP TABLE customers")
    assert result["valid"] is False


def test_blocks_delete():
    """DELETE should be blocked."""
    result = validate_sql("DELETE FROM customers WHERE id = 1")
    assert result["valid"] is False


def test_blocks_update():
    """UPDATE should be blocked."""
    result = validate_sql("UPDATE customers SET name = 'hacked' WHERE id = 1")
    assert result["valid"] is False


def test_blocks_multiple_semicolons():
    """Multiple statements should be blocked (SQL injection attempt)."""
    result = validate_sql("SELECT 1; DROP TABLE customers;")
    assert result["valid"] is False


def test_requires_from():
    """Query without FROM should fail."""
    result = validate_sql("SELECT 1")
    assert result["valid"] is False
