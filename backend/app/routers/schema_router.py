"""
Schema Router — exposes database schema info to the frontend.
"""
from fastapi import APIRouter, HTTPException
from app.services.schema_extractor import schema_extractor

router = APIRouter()


@router.get("/")
def get_schema():
    """Get the full database schema (tables, columns, PKs, FKs, row counts)."""
    try:
        return schema_extractor.get_schema()
    except Exception as e:
        raise HTTPException(500, detail=str(e))


@router.get("/profile/{table_name}/{column_name}")
def profile_column(table_name: str, column_name: str):
    """Get data profile for a specific column."""
    try:
        from app.services.query_executor import query_executor

        stats_sql = f"""
            SELECT 
                COUNT(*) as total_rows,
                COUNT({column_name}) as non_null_count,
                COUNT(*) - COUNT({column_name}) as null_count,
                COUNT(DISTINCT {column_name}) as unique_count
            FROM {table_name}
        """
        stats = query_executor.run(stats_sql)

        top_values_sql = f"""
            SELECT CAST({column_name} AS TEXT) as val, COUNT(*) as frequency
            FROM {table_name}
            WHERE {column_name} IS NOT NULL
            GROUP BY CAST({column_name} AS TEXT)
            ORDER BY COUNT(*) DESC
            LIMIT 5
        """
        top_values = query_executor.run(top_values_sql)

        row = stats['rows'][0] if stats['rows'] else [0, 0, 0, 0]
        total = row[0] or 1

        return {
            "column": column_name,
            "table": table_name,
            "total_rows": row[0],
            "non_null_count": row[1],
            "null_count": row[2],
            "null_percentage": round((row[2] / total) * 100, 1),
            "unique_count": row[3],
            "uniqueness_percentage": round((row[3] / total) * 100, 1),
            "top_values": [
                {"value": str(r[0]), "count": r[1]}
                for r in top_values['rows']
            ]
        }
    except Exception as e:
        raise HTTPException(500, detail=str(e))
