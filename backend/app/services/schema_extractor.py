"""
Schema Extractor — reads the target database structure.
Uses SQLAlchemy's inspector to pull table names, columns, PKs, FKs, and row counts.
This is the foundation — everything else (semantic layer, SQL gen) depends on this.
"""
from sqlalchemy import create_engine, inspect, text
from app.config import settings
import logging

logger = logging.getLogger(__name__)


class SchemaExtractor:
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

    def get_schema(self) -> dict:
        """
        Extract full DB schema.
        Returns dict with tables, columns, PKs, FKs, row counts.
        """
        inspector = inspect(self.engine)
        schema = {"database": self.engine.url.database, "tables": []}

        for table_name in inspector.get_table_names():
            pk_cols = set(inspector.get_pk_constraint(table_name)["constrained_columns"])

            # Build a map of foreign key columns -> what they reference
            fk_map = {}
            for fk in inspector.get_foreign_keys(table_name):
                for col in fk["constrained_columns"]:
                    fk_map[col] = f"{fk['referred_table']}.{fk['referred_columns'][0]}"

            columns = []
            for col in inspector.get_columns(table_name):
                columns.append({
                    "name": col["name"],
                    "type": str(col["type"]),
                    "nullable": col.get("nullable", True),
                    "primary_key": col["name"] in pk_cols,
                    "foreign_key": fk_map.get(col["name"]),
                })

            # Get row count for context
            row_count = 0
            try:
                with self.engine.connect() as conn:
                    row_count = conn.execute(text(f"SELECT COUNT(*) FROM {table_name}")).scalar()
            except Exception:
                pass

            schema["tables"].append({
                "name": table_name,
                "columns": columns,
                "row_count": row_count,
            })

        return schema

    def to_prompt_string(self, schema: dict) -> str:
        """Convert schema to readable string for LLM prompts."""
        lines = []
        for table in schema["tables"]:
            lines.append(f"Table: {table['name']} ({table['row_count']} rows)")
            for col in table["columns"]:
                flags = []
                if col["primary_key"]:
                    flags.append("PK")
                if col["foreign_key"]:
                    flags.append(f"FK→{col['foreign_key']}")
                flag_str = f" [{', '.join(flags)}]" if flags else ""
                lines.append(f"  {col['name']}: {col['type']}{flag_str}")
            lines.append("")
        return "\n".join(lines)


# Singleton
schema_extractor = SchemaExtractor()
