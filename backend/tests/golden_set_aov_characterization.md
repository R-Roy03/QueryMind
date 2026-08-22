# q15 "average order value" — instability characterization

The pipeline runs generation at temperature 0.1, so this question is not
deterministic. Across 6 back-to-back generations (same prompt, same schema):

| run | value returned | approach the model chose | confidence |
|-----|----------------|--------------------------|-----------|
| 1 | 13664.08 (junk) | AVG(payment_value) GROUP BY order_id, unaggregated + LIMIT | 0.95 |
| 2 | **140.64** | **AVG(price+freight_value) over line items — the documented per-line-item bug** | 0.95 |
| 3 | 72.19 (junk) | AVG(payment_value) GROUP BY order_id, unaggregated | 0.98 |
| 4 | 159.83 | SUM(price+freight) per order then AVG (all orders) | 0.98 |
| 5 | 13664.08 (junk) | same broken shape as run 1 | 0.98 |
| 6 | **140.64** | **the documented per-line-item bug again** | 0.98 |

Plus the main golden-set run: 160.24 (correct per-order SUM, but filtered to
4 order statuses).

True value (independent): **160.58** = AVG over per-order totals, all orders.

Findings:
- The documented per-line-item bug (140.64) is REAL and reproduces in ~1/3 of runs.
- The model produced at least 4 distinct strategies and never returned 160.58.
- Self-reported confidence stays 0.95–0.98 regardless of correctness — it is
  confidently wrong. Confidence is not calibrated to accuracy.
