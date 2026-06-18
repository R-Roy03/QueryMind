"""
Data Quality Router — scan tables for quality issues.
"""
from fastapi import APIRouter, HTTPException
from app.services.data_quality import run_quality_checks
from app.services.schema_extractor import schema_extractor

router = APIRouter()


@router.get("/scan")
def scan_all_tables():
    """Scan all tables for data quality issues."""
    try:
        schema = schema_extractor.get_schema()
        results = []
        for table in schema['tables']:
            result = run_quality_checks(table['name'], table['columns'])
            results.append(result)

        total_issues = sum(r['total_checks'] for r in results)
        avg_health = sum(r['health_score'] for r in results) // max(len(results), 1)

        return {
            "summary": {
                "tables_scanned": len(results),
                "total_issues": total_issues,
                "overall_health_score": avg_health
            },
            "tables": results
        }
    except Exception as e:
        raise HTTPException(500, detail=str(e))


@router.get("/scan/{table_name}")
def scan_table(table_name: str):
    """Scan a specific table for data quality issues."""
    try:
        schema = schema_extractor.get_schema()
        table = next((t for t in schema['tables'] if t['name'] == table_name), None)
        if not table:
            raise HTTPException(404, detail=f"Table {table_name} not found")
        return run_quality_checks(table['name'], table['columns'])
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(500, detail=str(e))
