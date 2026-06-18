"""
Anomaly Detector — Statistical anomaly detection using Z-score + IQR methods.
Real DE techniques with LLM-powered insight generation.
"""
import statistics
from app.services.query_executor import query_executor
from app.llm.mistral_client import llm
import logging

logger = logging.getLogger(__name__)


def detect_numeric_anomalies(table: str, column: str) -> dict:
    """Detect anomalies in a numeric column using Z-score + IQR."""
    try:
        result = query_executor.run(
            f"SELECT CAST({column} AS FLOAT) FROM {table} WHERE {column} IS NOT NULL LIMIT 500"
        )
        values = [r[0] for r in result['rows'] if r[0] is not None]
    except Exception:
        return {"error": f"Cannot run anomaly detection on non-numeric column {column}"}

    if len(values) < 10:
        return {"error": "Not enough data for anomaly detection (need 10+ rows)"}

    mean = statistics.mean(values)
    std = statistics.stdev(values) if len(values) > 1 else 0

    # Z-score anomalies (|z| > 2.5)
    z_anomalies = []
    if std > 0:
        for v in values:
            z = abs((v - mean) / std)
            if z > 2.5:
                z_anomalies.append({"value": v, "z_score": round(z, 2)})

    # IQR anomalies
    sorted_vals = sorted(values)
    n = len(sorted_vals)
    q1 = sorted_vals[n // 4]
    q3 = sorted_vals[3 * n // 4]
    iqr = q3 - q1
    lower_fence = q1 - 1.5 * iqr
    upper_fence = q3 + 1.5 * iqr
    iqr_anomalies = [v for v in values if v < lower_fence or v > upper_fence]

    anomaly_count = len(set([a["value"] for a in z_anomalies] + iqr_anomalies))
    anomaly_rate = round((anomaly_count / len(values)) * 100, 1)

    ai_insight = ""
    if anomaly_count > 0:
        prompt = f"""Anomaly detection on column '{column}' in table '{table}':
- Mean: {round(mean, 2)}, Std Dev: {round(std, 2)}
- Q1: {round(q1, 2)}, Q3: {round(q3, 2)}, IQR: {round(iqr, 2)}
- Anomalies found: {anomaly_count} out of {len(values)} values ({anomaly_rate}%)
- Extreme values: {sorted([a['value'] for a in z_anomalies], reverse=True)[:5]}

In 2 sentences, explain what these anomalies likely mean for a business user
and whether they are concerning. Be specific to what this column likely represents.
Return plain text, no JSON."""
        try:
            ai_insight = llm.chat(prompt)
        except Exception:
            ai_insight = ""

    return {
        "table": table, "column": column,
        "total_values": len(values),
        "anomaly_count": anomaly_count,
        "anomaly_rate_pct": anomaly_rate,
        "stats": {
            "mean": round(mean, 2), "std_dev": round(std, 2),
            "min": round(min(values), 2), "max": round(max(values), 2),
            "q1": round(q1, 2), "q3": round(q3, 2),
        },
        "z_score_anomalies": z_anomalies[:10],
        "iqr_fence": {"lower": round(lower_fence, 2), "upper": round(upper_fence, 2)},
        "ai_insight": ai_insight,
        "severity": "high" if anomaly_rate > 10 else "medium" if anomaly_rate > 3 else "low"
    }


def run_full_anomaly_scan() -> dict:
    """Scan all numeric columns in all tables for anomalies."""
    from app.services.schema_extractor import schema_extractor
    schema = schema_extractor.get_schema()

    results = []
    numeric_types = ["integer", "bigint", "decimal", "numeric", "float", "double", "real", "int"]

    for table in schema['tables']:
        table_results = []
        for col in table['columns']:
            col_type = col['type'].lower()
            if any(nt in col_type for nt in numeric_types) and not col.get('primary_key'):
                result = detect_numeric_anomalies(table['name'], col['name'])
                if 'error' not in result:
                    table_results.append(result)

        if table_results:
            results.append({
                "table": table['name'],
                "columns_analyzed": len(table_results),
                "columns_with_anomalies": sum(1 for r in table_results if r['anomaly_count'] > 0),
                "results": table_results
            })

    return {
        "tables_scanned": len(results),
        "total_anomalies": sum(r['columns_with_anomalies'] for r in results),
        "tables": results
    }
