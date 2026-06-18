"""
Query Executor — runs validated SQL against the target database.
Returns columns, rows, row count, and execution time.
"""
from sqlalchemy import create_engine, text
from app.config import settings
from decimal import Decimal
from datetime import date, datetime, timedelta
import time
import logging

logger = logging.getLogger(__name__)


def _sanitize_value(val):
    """Convert DB-native types to JSON-serializable Python types."""
    if val is None:
        return None
    if isinstance(val, Decimal):
        return float(val)
    if isinstance(val, (date, datetime)):
        return val.isoformat()
    if isinstance(val, timedelta):
        return val.total_seconds() / 86400  # Convert to days as float
    if isinstance(val, bytes):
        return val.decode("utf-8", errors="replace")
    return val


class QueryExecutor:
    def __init__(self):
        from app.services.db_manager import db_manager
        self._db_manager = db_manager

    @property
    def engine(self):
        return self._db_manager.engine

    @engine.setter
    def engine(self, value):
        """Allow db_manager to update engine on DB switch."""
        pass  # db_manager handles this

    def run(self, sql: str) -> dict:
        """Execute SQL, return columns + rows + timing."""
        start = time.time()
        try:
            with self.engine.connect() as conn:
                result = conn.execute(text(sql))
                columns = list(result.keys())
                rows = [[_sanitize_value(v) for v in r] for r in result.fetchmany(settings.max_rows)]
                elapsed = round((time.time() - start) * 1000, 2)
                return {
                    "columns": columns,
                    "rows": rows,
                    "row_count": len(rows),
                    "execution_time_ms": elapsed,
                }
        except Exception as e:
            logger.error(f"Query failed: {e}")
            raise ValueError(f"Query execution error: {str(e)}")


query_executor = QueryExecutor()

