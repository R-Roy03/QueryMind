"""
Database Manager — Centralized SQLAlchemy engine management.
Supports dynamic switching between PostgreSQL, MySQL, SQLite, and SQL Server.

Supported connection strings (SQLAlchemy format):
  PostgreSQL: postgresql://user:pass@host:5432/dbname
  MySQL:      mysql+pymysql://user:pass@host:3306/dbname
  SQLite:     sqlite:///path/to/database.db
  SQL Server: mssql+pyodbc://user:pass@host:1433/dbname?driver=ODBC+Driver+17+for+SQL+Server
"""
from sqlalchemy import create_engine, inspect, text
from app.config import settings
import logging

logger = logging.getLogger(__name__)

# Mapping of friendly names to SQLAlchemy driver prefixes
DB_DRIVERS = {
    "postgresql": "postgresql",
    "postgres": "postgresql",
    "mysql": "mysql+pymysql",
    "sqlite": "sqlite",
    "mssql": "mssql+pyodbc",
    "sqlserver": "mssql+pyodbc",
}


class DatabaseManager:
    """Centralized database connection manager.
    All services (QueryExecutor, SchemaExtractor, etc.) should use
    db_manager.engine instead of creating their own engines.
    """

    def __init__(self):
        self._url = settings.target_db_url
        self._engine = self._create_engine(self._url)
        self._db_type = self._detect_type(self._url)

    def _create_engine(self, url: str):
        """Create engine with appropriate settings per DB type."""
        kwargs = {"pool_pre_ping": True}

        if url.startswith("sqlite"):
            # SQLite doesn't support pool_size/max_overflow
            kwargs = {"pool_pre_ping": True}
        else:
            kwargs["pool_size"] = 5
            kwargs["max_overflow"] = 10

        return create_engine(url, **kwargs)

    def _detect_type(self, url: str) -> str:
        """Detect database type from URL."""
        if "postgresql" in url or "postgres" in url:
            return "postgresql"
        elif "mysql" in url:
            return "mysql"
        elif "sqlite" in url:
            return "sqlite"
        elif "mssql" in url:
            return "mssql"
        return "unknown"

    @property
    def engine(self):
        return self._engine

    @property
    def db_type(self) -> str:
        return self._db_type

    @property
    def db_url(self) -> str:
        return self._url

    @property
    def db_name(self) -> str:
        """Extract database name from URL."""
        try:
            return self._engine.url.database or "unknown"
        except Exception:
            return "unknown"

    def switch_database(self, new_url: str) -> dict:
        """Switch to a different database connection.
        Returns connection test result.
        """
        logger.info(f"Switching database to: {new_url[:30]}...")

        # Test connection first
        try:
            test_engine = self._create_engine(new_url)
            with test_engine.connect() as conn:
                conn.execute(text("SELECT 1"))
        except Exception as e:
            logger.error(f"Connection test failed: {e}")
            return {
                "success": False,
                "error": f"Connection failed: {str(e)}",
                "hint": self._get_connection_hint(new_url, str(e))
            }

        # Dispose old engine
        try:
            self._engine.dispose()
        except Exception:
            pass

        # Switch
        self._url = new_url
        self._engine = self._create_engine(new_url)
        self._db_type = self._detect_type(new_url)

        # Clear cached schema
        self._invalidate_caches()

        db_name = self.db_name
        logger.info(f"Switched to {self._db_type}: {db_name}")

        return {
            "success": True,
            "db_type": self._db_type,
            "db_name": db_name,
            "message": f"Connected to {self._db_type} database: {db_name}"
        }

    def test_connection(self, url: str = None) -> dict:
        """Test a database connection without switching."""
        test_url = url or self._url
        try:
            test_engine = self._create_engine(test_url)
            with test_engine.connect() as conn:
                conn.execute(text("SELECT 1"))
                inspector = inspect(test_engine)
                tables = inspector.get_table_names()
            test_engine.dispose()

            return {
                "success": True,
                "db_type": self._detect_type(test_url),
                "tables_found": len(tables),
                "table_names": tables[:20],
            }
        except Exception as e:
            return {
                "success": False,
                "error": str(e),
                "hint": self._get_connection_hint(test_url, str(e))
            }

    def get_status(self) -> dict:
        """Get current connection status."""
        try:
            with self._engine.connect() as conn:
                conn.execute(text("SELECT 1"))
            connected = True
        except Exception:
            connected = False

        return {
            "connected": connected,
            "db_type": self._db_type,
            "db_name": self.db_name,
            "db_url_masked": self._mask_url(self._url),
        }

    def _mask_url(self, url: str) -> str:
        """Mask password in connection URL for display."""
        try:
            if "@" in url:
                pre_at = url.split("@")[0]
                post_at = url.split("@", 1)[1]
                if ":" in pre_at:
                    parts = pre_at.rsplit(":", 1)
                    return f"{parts[0]}:****@{post_at}"
            return url
        except Exception:
            return "****"

    def _invalidate_caches(self):
        """Invalidate caches in dependent services after DB switch."""
        try:
            from app.services.schema_extractor import schema_extractor
            schema_extractor.engine = self._engine
        except Exception:
            pass
        try:
            from app.services.query_executor import query_executor
            query_executor.engine = self._engine
        except Exception:
            pass

    def _get_connection_hint(self, url: str, error: str) -> str:
        """Provide helpful hints for common connection errors."""
        error_lower = error.lower()
        if "no module named" in error_lower:
            if "pymysql" in error_lower:
                return "Install MySQL driver: pip install pymysql"
            if "pyodbc" in error_lower:
                return "Install SQL Server driver: pip install pyodbc"
            return f"Missing driver. Install the required package."
        if "connection refused" in error_lower:
            return "Database server is not running or not accepting connections on this host/port."
        if "authentication" in error_lower or "password" in error_lower:
            return "Check your username and password."
        if "does not exist" in error_lower:
            return "Database name not found. Check spelling."
        return "Check your connection string format."

    @staticmethod
    def build_url(db_type: str, host: str, port: int, database: str,
                  username: str = "", password: str = "") -> str:
        """Build a SQLAlchemy connection URL from parts."""
        driver = DB_DRIVERS.get(db_type.lower(), db_type)

        if db_type.lower() == "sqlite":
            return f"sqlite:///{database}"

        auth = ""
        if username:
            auth = f"{username}:{password}@" if password else f"{username}@"

        return f"{driver}://{auth}{host}:{port}/{database}"


# Singleton — import this everywhere
db_manager = DatabaseManager()
