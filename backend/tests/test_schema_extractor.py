"""
Tests for Schema Extractor.
Basic tests — we just make sure the methods exist and return the right shape.
Full integration tests need a running DB.
"""
from app.services.schema_extractor import SchemaExtractor


def test_to_prompt_string():
    """Test that schema-to-string conversion works."""
    # Mock schema data
    fake_schema = {
        "database": "test_db",
        "tables": [
            {
                "name": "users",
                "row_count": 100,
                "columns": [
                    {"name": "id", "type": "INTEGER", "primary_key": True, "foreign_key": None},
                    {"name": "name", "type": "VARCHAR", "primary_key": False, "foreign_key": None},
                    {"name": "team_id", "type": "INTEGER", "primary_key": False, "foreign_key": "teams.id"},
                ],
            }
        ],
    }

    extractor = SchemaExtractor.__new__(SchemaExtractor)
    result = extractor.to_prompt_string(fake_schema)

    assert "users" in result
    assert "100 rows" in result
    assert "PK" in result
    assert "FK→teams.id" in result
