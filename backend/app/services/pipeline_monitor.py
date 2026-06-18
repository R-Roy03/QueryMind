"""
Pipeline Monitor — Tracks pipeline run history with SQLite + AI failure diagnosis.
Seeds realistic historical data for demo purposes.
"""
import sqlite3
import json
import random
from datetime import datetime, timedelta
from pathlib import Path
import logging

logger = logging.getLogger(__name__)

DB_PATH = "./pipeline_monitor.db"


def init_monitor_db():
    """Initialize SQLite DB for pipeline run history."""
    conn = sqlite3.connect(DB_PATH)
    conn.execute("""
        CREATE TABLE IF NOT EXISTS pipeline_runs (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            pipeline_name TEXT NOT NULL,
            pipeline_desc TEXT,
            status TEXT NOT NULL,
            started_at TEXT NOT NULL,
            completed_at TEXT,
            duration_seconds INTEGER,
            rows_processed INTEGER,
            source_tables TEXT,
            sink_table TEXT,
            error_message TEXT,
            error_type TEXT,
            dag_code TEXT
        )
    """)
    conn.commit()

    count = conn.execute("SELECT COUNT(*) FROM pipeline_runs").fetchone()[0]
    if count == 0:
        _seed_historical_runs(conn)
    conn.close()


def _seed_historical_runs(conn):
    """Seed realistic pipeline run history for demo."""
    pipelines = [
        {"name": "order_revenue_daily", "desc": "Daily order revenue aggregation from Olist",
         "sources": ["olist_orders", "olist_order_items", "olist_customers"], "sink": "order_revenue_summary"},
        {"name": "product_performance_sync", "desc": "Product performance metrics with reviews",
         "sources": ["olist_products", "olist_order_items", "olist_order_reviews"], "sink": "product_performance_snapshot"},
        {"name": "seller_metrics_monthly", "desc": "Monthly seller performance metrics",
         "sources": ["olist_sellers", "olist_order_items", "olist_orders"], "sink": "seller_engagement_metrics"},
        {"name": "state_revenue_pipeline", "desc": "Revenue by Brazilian state pipeline",
         "sources": ["olist_orders", "olist_customers", "olist_order_items"], "sink": "state_revenue_summary"},
    ]

    errors = [
        ("SchemaError", "Column 'product_category' not found in source table 'olist_products'. Schema may have changed."),
        ("NullConstraint", "NOT NULL constraint failed on sink table. 8 rows had null customer_id."),
        ("Timeout", "Query execution exceeded 30 second timeout. Consider adding index on order_purchase_timestamp."),
        ("ConnectionError", "Could not connect to source database. Connection pool exhausted."),
    ]

    runs = []
    base_time = datetime.now() - timedelta(days=7)

    for day in range(7):
        for pipeline in pipelines:
            for _ in range(random.randint(1, 3)):
                started = base_time + timedelta(days=day, hours=random.randint(0, 23), minutes=random.randint(0, 59))
                duration = random.randint(30, 300)
                is_failed = random.random() < 0.15
                status = "failed" if is_failed else "success"
                error = random.choice(errors) if is_failed else (None, None)

                runs.append((
                    pipeline["name"], pipeline["desc"], status,
                    started.isoformat(),
                    (started + timedelta(seconds=duration if not is_failed else random.randint(5, 60))).isoformat(),
                    duration if not is_failed else random.randint(5, 60),
                    random.randint(100, 50000) if not is_failed else 0,
                    json.dumps(pipeline["sources"]), pipeline["sink"],
                    error[1] if is_failed else None,
                    error[0] if is_failed else None, None
                ))

    conn.executemany("""
        INSERT INTO pipeline_runs
        (pipeline_name, pipeline_desc, status, started_at, completed_at,
         duration_seconds, rows_processed, source_tables, sink_table,
         error_message, error_type, dag_code)
        VALUES (?,?,?,?,?,?,?,?,?,?,?,?)
    """, runs)
    conn.commit()


def log_pipeline_run(pipeline_name, pipeline_desc, dag_code, source_tables, sink_table):
    """Log a new pipeline run as 'success' for demo."""
    conn = sqlite3.connect(DB_PATH)
    duration = random.randint(45, 180)
    rows = random.randint(500, 25000)
    started = datetime.now() - timedelta(seconds=duration)

    cursor = conn.execute("""
        INSERT INTO pipeline_runs
        (pipeline_name, pipeline_desc, status, started_at, completed_at,
         duration_seconds, rows_processed, source_tables, sink_table, dag_code)
        VALUES (?,?,?,?,?,?,?,?,?,?)
    """, (pipeline_name, pipeline_desc, "success",
          started.isoformat(), datetime.now().isoformat(),
          duration, rows, json.dumps(source_tables), sink_table, dag_code))
    conn.commit()
    run_id = cursor.lastrowid
    conn.close()
    return run_id


def get_run_history(limit=20):
    """Get pipeline run history with stats."""
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    rows = conn.execute("SELECT * FROM pipeline_runs ORDER BY started_at DESC LIMIT ?", (limit,)).fetchall()
    conn.close()

    runs = [dict(r) for r in rows]
    total = len(runs)
    successful = sum(1 for r in runs if r["status"] == "success")
    failed = total - successful
    success_rate = round((successful / total) * 100) if total > 0 else 0

    avg_duration = sum(r["duration_seconds"] or 0 for r in runs if r["status"] == "success")
    avg_duration = avg_duration // max(successful, 1)
    total_rows = sum(r["rows_processed"] or 0 for r in runs)

    pipeline_stats = {}
    for run in runs:
        name = run["pipeline_name"]
        if name not in pipeline_stats:
            pipeline_stats[name] = {"runs": 0, "failures": 0, "last_status": run["status"]}
        pipeline_stats[name]["runs"] += 1
        if run["status"] == "failed":
            pipeline_stats[name]["failures"] += 1

    return {
        "summary": {
            "total_runs": total, "successful": successful, "failed": failed,
            "success_rate": success_rate, "avg_duration_seconds": avg_duration,
            "total_rows_processed": total_rows
        },
        "pipeline_stats": pipeline_stats,
        "recent_runs": runs[:20]
    }


def get_failure_diagnosis(run_id):
    """Get AI diagnosis for a failed pipeline run."""
    from app.llm.mistral_client import llm

    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    run = conn.execute("SELECT * FROM pipeline_runs WHERE id = ?", (run_id,)).fetchone()
    conn.close()

    if not run:
        return {"error": "Run not found"}

    run = dict(run)
    if run["status"] != "failed":
        return {"message": "This run did not fail", "status": run["status"]}

    prompt = f"""A data pipeline failed with this error:

Pipeline: {run['pipeline_name']}
Error Type: {run['error_type']}
Error Message: {run['error_message']}
Source Tables: {run['source_tables']}
Sink Table: {run['sink_table']}

Provide:
1. Root cause analysis (2 sentences)
2. Immediate fix (specific, actionable)
3. Prevention strategy (1 sentence)

Return as JSON:
{{"root_cause": "...", "immediate_fix": "...", "prevention": "...", "severity": "critical|high|medium"}}"""
    try:
        diagnosis = llm.chat_json(prompt)
        diagnosis["pipeline"] = run["pipeline_name"]
        diagnosis["error_type"] = run["error_type"]
        diagnosis["error_message"] = run["error_message"]
        return diagnosis
    except Exception as e:
        return {"error": str(e)}


# Initialize on import
init_monitor_db()
