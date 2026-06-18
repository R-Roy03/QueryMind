"""
Metrics Engine — Computes live business + pipeline metrics from the Olist database.
"""
from app.services.query_executor import query_executor
import random
from datetime import datetime, timedelta


def get_live_metrics() -> dict:
    """Compute live metrics from the Olist Brazilian E-Commerce database + simulated pipeline stats."""
    try:
        total_orders = query_executor.run("SELECT COUNT(*) FROM olist_orders")['rows'][0][0]
        total_revenue = query_executor.run(
            "SELECT COALESCE(SUM(price + freight_value), 0) FROM olist_order_items"
        )['rows'][0][0]
        active_customers = query_executor.run(
            "SELECT COUNT(DISTINCT customer_unique_id) FROM olist_customers"
        )['rows'][0][0]
        pending_orders = query_executor.run(
            "SELECT COUNT(*) FROM olist_orders WHERE order_status IN ('created', 'approved', 'processing')"
        )['rows'][0][0]
        total_events = query_executor.run(
            "SELECT COUNT(*) FROM olist_order_reviews"
        )['rows'][0][0]

        # Revenue by state (top 8)
        region_rev = query_executor.run("""
            SELECT c.customer_state AS region,
                   COALESCE(SUM(oi.price + oi.freight_value), 0) AS rev
            FROM olist_orders o
            JOIN olist_customers c ON o.customer_id = c.customer_id
            JOIN olist_order_items oi ON o.order_id = oi.order_id
            WHERE o.order_status = 'delivered'
            GROUP BY c.customer_state
            ORDER BY rev DESC LIMIT 8
        """)
        region_data = [{"region": r[0], "revenue": float(r[1])} for r in region_rev['rows']]

        # Orders by status
        status_dist = query_executor.run(
            "SELECT order_status, COUNT(*) FROM olist_orders GROUP BY order_status"
        )
        status_data = [{"status": r[0], "count": r[1]} for r in status_dist['rows']]

        # Monthly trend (last 12 months of data)
        daily_orders = query_executor.run("""
            SELECT DATE_TRUNC('month', o.order_purchase_timestamp)::DATE AS month,
                   COUNT(DISTINCT o.order_id) AS orders,
                   SUM(oi.price + oi.freight_value) AS revenue
            FROM olist_orders o
            JOIN olist_order_items oi ON o.order_id = oi.order_id
            GROUP BY DATE_TRUNC('month', o.order_purchase_timestamp)
            ORDER BY month DESC LIMIT 14
        """)
        daily_data = [
            {"date": str(r[0]), "orders": r[1], "revenue": float(r[2] or 0)}
            for r in daily_orders['rows']
        ]

    except Exception as e:
        return {"error": str(e)}

    pipeline_metrics = {
        "rows_processed_today": random.randint(45000, 120000),
        "pipelines_running": random.randint(0, 2),
        "pipelines_succeeded_today": random.randint(8, 15),
        "pipelines_failed_today": random.randint(0, 2),
        "avg_pipeline_duration_s": random.randint(45, 180),
        "data_freshness_minutes": random.randint(2, 15),
        "last_pipeline_run": (datetime.now() - timedelta(minutes=random.randint(5, 45))).isoformat(),
    }

    return {
        "timestamp": datetime.now().isoformat(),
        "business_metrics": {
            "total_orders": total_orders,
            "total_revenue": float(total_revenue or 0),
            "active_customers": active_customers,
            "pending_orders": pending_orders,
            "total_events": total_events,
        },
        "pipeline_metrics": pipeline_metrics,
        "charts": {
            "revenue_by_region": region_data,
            "orders_by_status": status_data,
            "daily_trend": daily_data,
        }
    }
