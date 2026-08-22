"""
Golden set for the NL-to-SQL pipeline.

20 natural-language questions over the Olist schema, each paired with an
expected answer that was computed INDEPENDENTLY (by hand-written SQL, separate
from the model — see `expected_from` on each item, and tests/golden_ground_truth.sql).

The runner (run_golden_set.py) sends each question through the *real* generation
path used by POST /query/ask — schema + semantic context + TEXT_TO_SQL_PROMPT,
llm.chat_json, validate_sql — then executes the generated SQL and compares the
result to the expected value. Nothing here is tuned to make the model pass; the
known "average order value" defect is kept in as a documented failure.

Comparison kinds (applied uniformly, defined once in run_golden_set.py):
  scalar_num     — one numeric answer; integer-exact, or |Δ| <= 0.02 for decimals
  scalar_str     — one text answer; case-insensitive equality
  ordered_labels — a ranking; the ordered list of label values must match
  status_dict    — a {label: count} breakdown; dict equality
"""

GOLDEN_SET = [
    # ---- Easy: single-table counts / sums --------------------------------
    dict(id="q01", question="How many orders are there in total?",
         expected=99441, cmp="scalar_num",
         expected_from="COUNT(*) FROM olist_orders"),
    dict(id="q02", question="How many unique customers are there?",
         expected=96096, cmp="scalar_num",
         expected_from="COUNT(DISTINCT customer_unique_id) FROM olist_customers "
                       "(customer_id is per-order; customer_unique_id is the person)"),
    dict(id="q03", question="What is the total revenue including freight across all order items?",
         expected=15843553.24, cmp="scalar_num",
         expected_from="SUM(price + freight_value) FROM olist_order_items"),
    dict(id="q04", question="How many products are in the catalog?",
         expected=32951, cmp="scalar_num",
         expected_from="COUNT(*) FROM olist_products"),
    dict(id="q05", question="How many sellers are there?",
         expected=3095, cmp="scalar_num",
         expected_from="COUNT(*) FROM olist_sellers"),

    # ---- Medium: filters, group-by, ordering -----------------------------
    dict(id="q06", question="How many orders have been delivered?",
         expected=96478, cmp="scalar_num",
         expected_from="COUNT(*) FROM olist_orders WHERE order_status='delivered'"),
    dict(id="q07", question="What are the top 5 states by number of customers?",
         expected=["SP", "RJ", "MG", "RS", "PR"], cmp="ordered_labels",
         expected_from="olist_customers GROUP BY customer_state ORDER BY COUNT(*) DESC LIMIT 5"),
    dict(id="q08", question="What is the average review score?",
         expected=4.09, cmp="scalar_num",
         expected_from="AVG(review_score) FROM olist_order_reviews"),
    dict(id="q09", question="How many orders are there for each order status?",
         expected={"delivered": 96478, "shipped": 1107, "canceled": 625,
                   "unavailable": 609, "invoiced": 314, "processing": 301,
                   "created": 5, "approved": 2}, cmp="status_dict",
         expected_from="olist_orders GROUP BY order_status"),
    dict(id="q10", question="What is the most common payment type?",
         expected="credit_card", cmp="scalar_str",
         expected_from="olist_order_payments GROUP BY payment_type ORDER BY COUNT(*) DESC LIMIT 1"),
    dict(id="q11", question="What is the average freight value per order item?",
         expected=19.99, cmp="scalar_num",
         expected_from="AVG(freight_value) FROM olist_order_items"),
    dict(id="q12", question="How many reviews gave a score of 5?",
         expected=57328, cmp="scalar_num",
         expected_from="COUNT(*) FROM olist_order_reviews WHERE review_score=5"),

    # ---- Trickier: joins, multi-step, dates, distinctness ----------------
    dict(id="q13", question="What is the total revenue (price plus freight) from delivered orders only?",
         expected=15419773.75, cmp="scalar_num",
         expected_from="SUM(price+freight_value) from order_items JOIN orders WHERE status='delivered'"),
    dict(id="q14", question="What are the top 5 product categories by revenue?",
         expected=["beleza_saude", "relogios_presentes", "cama_mesa_banho",
                   "esporte_lazer", "informatica_acessorios"], cmp="ordered_labels",
         expected_from="SUM(price+freight) per product_category_name, top 5, NULL category excluded"),
    # ---- KNOWN, DOCUMENTED FAILURE ---------------------------------------
    dict(id="q15", question="What is the average order value?",
         expected=160.58, cmp="scalar_num",
         expected_from="AVG(order_total) over per-order totals: "
                       "AVG of SUM(price+freight_value) GROUP BY order_id. "
                       "KNOWN FAILURE: the model computes AVG(price+freight_value) over "
                       "olist_order_items — averaging per line item, not per order — "
                       "which returns 140.64 at ~0.98 self-reported confidence."),
    dict(id="q16", question="Which month had the most orders?",
         expected="2017-11", cmp="scalar_str",
         expected_from="DATE_TRUNC('month', order_purchase_timestamp) with most orders (as YYYY-MM)"),
    dict(id="q17", question="On average, how many items are in an order?",
         expected=1.14, cmp="scalar_num",
         expected_from="AVG(item_count) over per-order COUNT(*) from olist_order_items"),
    dict(id="q18", question="What percentage of orders were cancelled?",
         expected=0.63, cmp="scalar_num",
         expected_from="100 * canceled / total orders = 625/99441"),
    dict(id="q19", question="What is the average delivery time in days for delivered orders?",
         expected=12.56, cmp="scalar_num",
         expected_from="AVG(delivered_customer_date - purchase_timestamp) in days, delivered only"),
    dict(id="q20", question="How many customers placed more than one order?",
         expected=2997, cmp="scalar_num",
         expected_from="customer_unique_id values appearing on >1 order "
                       "(GROUP BY customer_unique_id HAVING COUNT(*)>1)"),
]
