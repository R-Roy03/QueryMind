-- Remote seed script for Render PostgreSQL
-- Uses \copy (client-side) instead of COPY (server-side)
-- Tables, indexes, and views already created by seed_kaggle.sql

\copy olist_customers FROM '/data/kaggle/olist_customers_dataset.csv' WITH (FORMAT csv, HEADER true, NULL '');
\copy olist_sellers FROM '/data/kaggle/olist_sellers_dataset.csv' WITH (FORMAT csv, HEADER true, NULL '');
\copy olist_products FROM '/data/kaggle/olist_products_dataset.csv' WITH (FORMAT csv, HEADER true, NULL '');
\copy olist_orders FROM '/data/kaggle/olist_orders_dataset.csv' WITH (FORMAT csv, HEADER true, NULL '');
\copy olist_order_items FROM '/data/kaggle/olist_order_items_dataset.csv' WITH (FORMAT csv, HEADER true, NULL '');
\copy olist_order_payments FROM '/data/kaggle/olist_order_payments_dataset.csv' WITH (FORMAT csv, HEADER true, NULL '');
\copy olist_order_reviews FROM '/data/kaggle/olist_order_reviews_dataset.csv' WITH (FORMAT csv, HEADER true, NULL '');
