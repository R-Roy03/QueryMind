"""
Identifier Guard — whitelist database identifiers against the LIVE schema.

Several read-only endpoints take a table and/or column name from the URL path
and interpolate it straight into an f-string SQL query. Those parameters cannot
be bound as SQL placeholders (a bound parameter is a *value*, not an identifier),
so the only safe defence is to confirm the name is a real table/column in the
currently-connected database before it is ever placed in the query text.

Anything not present in the live schema is rejected with InvalidIdentifierError,
which the routers translate to HTTP 400. This closes UNION/subquery/comment
injection through the identifier position, because an attacker-supplied string
like "customer_id FROM secrets --" is simply not a column name and never matches.
"""
from sqlalchemy import inspect
import logging

logger = logging.getLogger(__name__)


class InvalidIdentifierError(ValueError):
    """Raised when a table/column name is not found in the live schema."""


def _inspector():
    # Import here so this module has no import-time dependency on a live DB
    # connection (keeps it importable offline, like the rest of the services).
    from app.services.db_manager import db_manager
    return inspect(db_manager.engine)


def validate_table(table_name: str) -> str:
    """Return table_name unchanged iff it is a real table in the live schema.

    Rejects anything else — including valid-looking SQL fragments — before it
    can reach a query string.
    """
    if not isinstance(table_name, str):
        raise InvalidIdentifierError(f"Table name must be a string, got {type(table_name).__name__}")
    real_tables = set(_inspector().get_table_names())
    if table_name not in real_tables:
        raise InvalidIdentifierError(f"Unknown table '{table_name}'")
    return table_name


def validate_column(table_name: str, column_name: str) -> tuple[str, str]:
    """Validate the table, then confirm column_name belongs to it.

    Returns the (table, column) pair unchanged on success.
    """
    table_name = validate_table(table_name)
    if not isinstance(column_name, str):
        raise InvalidIdentifierError(f"Column name must be a string, got {type(column_name).__name__}")
    real_columns = {c["name"] for c in _inspector().get_columns(table_name)}
    if column_name not in real_columns:
        raise InvalidIdentifierError(f"Unknown column '{column_name}' on table '{table_name}'")
    return table_name, column_name
