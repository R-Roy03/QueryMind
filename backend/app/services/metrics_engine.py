"""
Metrics Engine — Computes live business metrics and dataset overview from the Olist database.
"""
from app.services.query_executor import query_executor
from datetime import datetime


def get_live_metrics() -> dict:
    """Compute live business metrics and a real dataset overview from the Olist Brazilian E-Commerce database."""
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

        # Real dataset overview — every value here is queried from the connected
        # database, not fabricated. Replaces a former block of random.randint()
        # "pipeline" numbers that were rendered next to the real KPIs and
        # reshuffled on every refresh. The Olist data is a static historical
        # export, so "operations today" telemetry has no real source; these are
        # facts about the data that actually loaded.
        core_tables = [
            "olist_orders", "olist_customers", "olist_products",
            "olist_order_items", "olist_order_payments",
            "olist_order_reviews", "olist_sellers",
        ]
        total_rows = 0
        tables_tracked = 0
        for t in core_tables:
            try:
                total_rows += query_executor.run(f"SELECT COUNT(*) FROM {t}")['rows'][0][0]
                tables_tracked += 1
            except Exception:
                # A table absent from the connected DB is skipped, not fatal.
                pass

        delivered_orders = query_executor.run(
            "SELECT COUNT(*) FROM olist_orders WHERE order_status = 'delivered'"
        )['rows'][0][0]
        oldest = query_executor.run(
            "SELECT MIN(order_purchase_timestamp) FROM olist_orders"
        )['rows'][0][0]
        newest = query_executor.run(
            "SELECT MAX(order_purchase_timestamp) FROM olist_orders"
        )['rows'][0][0]

        dataset_overview = {
            "total_rows": total_rows,
            "tables_tracked": tables_tracked,
            "delivered_orders": delivered_orders,
            # Trim to YYYY-MM; this is a fixed historical range, not a live clock.
            "data_from": str(oldest)[:7] if oldest else None,
            "data_to": str(newest)[:7] if newest else None,
        }

    except Exception as e:
        return {"error": str(e)}

    return {
        "timestamp": datetime.now().isoformat(),
        "business_metrics": {
            "total_orders": total_orders,
            "total_revenue": float(total_revenue or 0),
            "active_customers": active_customers,
            "pending_orders": pending_orders,
            "total_events": total_events,
        },
        "dataset_overview": dataset_overview,
        "charts": {
            "revenue_by_region": region_data,
            "orders_by_status": status_data,
            "daily_trend": daily_data,
        }
    }
