"""
Data Quality Service — runs NULL checks, duplicate checks, and LLM recommendations.
"""
from app.services.query_executor import query_executor
from app.llm.mistral_client import llm
import logging

logger = logging.getLogger(__name__)


def run_quality_checks(table_name: str, columns: list) -> dict:
    checks = []

    # Get total row count
    total_result = query_executor.run(f"SELECT COUNT(*) FROM {table_name}")
    total = total_result['rows'][0][0] if total_result['rows'] else 0

    if total == 0:
        return {"table": table_name, "total_checks": 0, "issues": [], "health_score": 100}

    # 1. NULL check for each column
    for col in columns:
        try:
            result = query_executor.run(
                f"SELECT COUNT(*) FROM {table_name} WHERE {col['name']} IS NULL"
            )
            null_count = result['rows'][0][0] if result['rows'] else 0

            if null_count > 0:
                pct = round((null_count / total) * 100, 1)
                checks.append({
                    "type": "null_check",
                    "table": table_name,
                    "column": col['name'],
                    "severity": "high" if pct > 20 else "medium" if pct > 5 else "low",
                    "message": f"{null_count} NULL values ({pct}% of rows)",
                    "affected_rows": null_count
                })
        except Exception as e:
            logger.warning(f"NULL check failed for {table_name}.{col['name']}: {e}")

    # 2. Duplicate check on PK columns
    pk_cols = [c['name'] for c in columns if c.get('primary_key')]
    if pk_cols:
        pk_str = ', '.join(pk_cols)
        try:
            result = query_executor.run(f"""
                SELECT COUNT(*) FROM (
                    SELECT {pk_str}, COUNT(*) as cnt 
                    FROM {table_name} 
                    GROUP BY {pk_str} 
                    HAVING COUNT(*) > 1
                ) dups
            """)
            dup_count = result['rows'][0][0] if result['rows'] else 0
            if dup_count > 0:
                checks.append({
                    "type": "duplicate_check",
                    "table": table_name,
                    "column": pk_str,
                    "severity": "high",
                    "message": f"{dup_count} duplicate primary key combinations found",
                    "affected_rows": dup_count
                })
        except Exception as e:
            logger.warning(f"Duplicate check failed for {table_name}: {e}")

    # 3. LLM interprets findings and adds recommendations
    if checks:
        try:
            prompt = f"""You are a Data Quality Engineer. Here are quality issues found in table '{table_name}':
{[c['message'] + ' in column ' + c['column'] for c in checks]}

For each issue, give a 1-line actionable recommendation for fixing it.
Respond as JSON array: [{{"issue": "...", "recommendation": "..."}}]"""
            recs = llm.chat_json(prompt)
            if isinstance(recs, list):
                for i, check in enumerate(checks):
                    if i < len(recs):
                        check['recommendation'] = recs[i].get('recommendation', '')
            elif isinstance(recs, dict) and 'recommendations' in recs:
                rec_list = recs['recommendations']
                for i, check in enumerate(checks):
                    if i < len(rec_list):
                        check['recommendation'] = rec_list[i].get('recommendation', '')
        except Exception as e:
            logger.warning(f"LLM recommendation failed: {e}")

    # Calculate health score
    high_count = len([c for c in checks if c['severity'] == 'high'])
    med_count = len([c for c in checks if c['severity'] == 'medium'])
    health_score = max(0, 100 - (high_count * 30) - (med_count * 10))

    return {
        "table": table_name,
        "total_checks": len(checks),
        "issues": checks,
        "health_score": health_score
    }
