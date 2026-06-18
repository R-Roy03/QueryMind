-- ============================================================
-- QueryMind — Brazilian E-Commerce (Olist) Dataset
-- Source: https://www.kaggle.com/datasets/olistbr/brazilian-ecommerce
-- ============================================================
-- This script creates tables and loads CSVs via COPY.
-- CSVs must be mounted at /data/kaggle/ inside the container.
-- ============================================================

-- 1. CUSTOMERS
CREATE TABLE IF NOT EXISTS olist_customers (
    customer_id VARCHAR(64) PRIMARY KEY,
    customer_unique_id VARCHAR(64),
    customer_zip_code_prefix VARCHAR(10),
    customer_city VARCHAR(100),
    customer_state VARCHAR(5)
);

-- 2. SELLERS
CREATE TABLE IF NOT EXISTS olist_sellers (
    seller_id VARCHAR(64) PRIMARY KEY,
    seller_zip_code_prefix VARCHAR(10),
    seller_city VARCHAR(100),
    seller_state VARCHAR(5)
);

-- 3. PRODUCTS
CREATE TABLE IF NOT EXISTS olist_products (
    product_id VARCHAR(64) PRIMARY KEY,
    product_category_name VARCHAR(100),
    product_name_length INT,
    product_description_length INT,
    product_photos_qty INT,
    product_weight_g INT,
    product_length_cm INT,
    product_height_cm INT,
    product_width_cm INT
);

-- 4. ORDERS
CREATE TABLE IF NOT EXISTS olist_orders (
    order_id VARCHAR(64) PRIMARY KEY,
    customer_id VARCHAR(64) REFERENCES olist_customers(customer_id),
    order_status VARCHAR(30),
    order_purchase_timestamp TIMESTAMP,
    order_approved_at TIMESTAMP,
    order_delivered_carrier_date TIMESTAMP,
    order_delivered_customer_date TIMESTAMP,
    order_estimated_delivery_date TIMESTAMP
);

-- 5. ORDER ITEMS
CREATE TABLE IF NOT EXISTS olist_order_items (
    order_id VARCHAR(64) REFERENCES olist_orders(order_id),
    order_item_id INT,
    product_id VARCHAR(64) REFERENCES olist_products(product_id),
    seller_id VARCHAR(64) REFERENCES olist_sellers(seller_id),
    shipping_limit_date TIMESTAMP,
    price DECIMAL(10,2),
    freight_value DECIMAL(10,2),
    PRIMARY KEY (order_id, order_item_id)
);

-- 6. ORDER PAYMENTS
CREATE TABLE IF NOT EXISTS olist_order_payments (
    order_id VARCHAR(64) REFERENCES olist_orders(order_id),
    payment_sequential INT,
    payment_type VARCHAR(30),
    payment_installments INT,
    payment_value DECIMAL(10,2),
    PRIMARY KEY (order_id, payment_sequential)
);

-- 7. ORDER REVIEWS
CREATE TABLE IF NOT EXISTS olist_order_reviews (
    review_id VARCHAR(64),
    order_id VARCHAR(64) REFERENCES olist_orders(order_id),
    review_score INT,
    review_comment_title TEXT,
    review_comment_message TEXT,
    review_creation_date TIMESTAMP,
    review_answer_timestamp TIMESTAMP,
    PRIMARY KEY (review_id, order_id)
);

-- ============================================================
-- LOAD DATA FROM CSVs
-- ============================================================

-- Load in dependency order (parents first)
COPY olist_customers FROM '/data/kaggle/olist_customers_dataset.csv' WITH (FORMAT csv, HEADER true, NULL '');
COPY olist_sellers FROM '/data/kaggle/olist_sellers_dataset.csv' WITH (FORMAT csv, HEADER true, NULL '');
COPY olist_products FROM '/data/kaggle/olist_products_dataset.csv' WITH (FORMAT csv, HEADER true, NULL '');
COPY olist_orders FROM '/data/kaggle/olist_orders_dataset.csv' WITH (FORMAT csv, HEADER true, NULL '');
COPY olist_order_items FROM '/data/kaggle/olist_order_items_dataset.csv' WITH (FORMAT csv, HEADER true, NULL '');
COPY olist_order_payments FROM '/data/kaggle/olist_order_payments_dataset.csv' WITH (FORMAT csv, HEADER true, NULL '');
COPY olist_order_reviews FROM '/data/kaggle/olist_order_reviews_dataset.csv' WITH (FORMAT csv, HEADER true, NULL '');

-- ============================================================
-- INDEXES for query performance
-- ============================================================
CREATE INDEX idx_orders_customer ON olist_orders(customer_id);
CREATE INDEX idx_orders_status ON olist_orders(order_status);
CREATE INDEX idx_orders_purchase ON olist_orders(order_purchase_timestamp);
CREATE INDEX idx_items_product ON olist_order_items(product_id);
CREATE INDEX idx_items_seller ON olist_order_items(seller_id);
CREATE INDEX idx_payments_order ON olist_order_payments(order_id);
CREATE INDEX idx_reviews_order ON olist_order_reviews(order_id);
CREATE INDEX idx_reviews_score ON olist_order_reviews(review_score);
CREATE INDEX idx_customers_state ON olist_customers(customer_state);
CREATE INDEX idx_customers_city ON olist_customers(customer_city);
CREATE INDEX idx_products_category ON olist_products(product_category_name);
CREATE INDEX idx_sellers_state ON olist_sellers(seller_state);

-- ============================================================
-- USEFUL VIEWS for the AI query engine
-- ============================================================

-- Revenue per order (joins items + payments)
CREATE OR REPLACE VIEW v_order_summary AS
SELECT
    o.order_id,
    o.customer_id,
    o.order_status,
    o.order_purchase_timestamp,
    o.order_delivered_customer_date,
    c.customer_city,
    c.customer_state,
    COUNT(DISTINCT oi.product_id) AS total_products,
    SUM(oi.price) AS total_price,
    SUM(oi.freight_value) AS total_freight,
    SUM(oi.price + oi.freight_value) AS total_order_value
FROM olist_orders o
JOIN olist_customers c ON o.customer_id = c.customer_id
JOIN olist_order_items oi ON o.order_id = oi.order_id
GROUP BY o.order_id, o.customer_id, o.order_status,
         o.order_purchase_timestamp, o.order_delivered_customer_date,
         c.customer_city, c.customer_state;

-- Product performance
CREATE OR REPLACE VIEW v_product_performance AS
SELECT
    p.product_id,
    p.product_category_name,
    COUNT(DISTINCT oi.order_id) AS total_orders,
    SUM(oi.price) AS total_revenue,
    AVG(oi.price) AS avg_price,
    AVG(r.review_score) AS avg_review_score
FROM olist_products p
JOIN olist_order_items oi ON p.product_id = oi.product_id
JOIN olist_orders o ON oi.order_id = o.order_id
LEFT JOIN olist_order_reviews r ON o.order_id = r.order_id
GROUP BY p.product_id, p.product_category_name;

-- Seller performance
CREATE OR REPLACE VIEW v_seller_performance AS
SELECT
    s.seller_id,
    s.seller_city,
    s.seller_state,
    COUNT(DISTINCT oi.order_id) AS total_orders,
    SUM(oi.price) AS total_revenue,
    AVG(r.review_score) AS avg_review_score
FROM olist_sellers s
JOIN olist_order_items oi ON s.seller_id = oi.seller_id
JOIN olist_orders o ON oi.order_id = o.order_id
LEFT JOIN olist_order_reviews r ON o.order_id = r.order_id
GROUP BY s.seller_id, s.seller_city, s.seller_state;

-- Monthly revenue trend
CREATE OR REPLACE VIEW v_monthly_revenue AS
SELECT
    DATE_TRUNC('month', o.order_purchase_timestamp) AS month,
    COUNT(DISTINCT o.order_id) AS total_orders,
    COUNT(DISTINCT o.customer_id) AS unique_customers,
    SUM(oi.price) AS total_revenue,
    AVG(oi.price) AS avg_order_value
FROM olist_orders o
JOIN olist_order_items oi ON o.order_id = oi.order_id
WHERE o.order_status = 'delivered'
GROUP BY DATE_TRUNC('month', o.order_purchase_timestamp)
ORDER BY month;

-- ============================================================
-- DONE — ~450K+ rows loaded across 7 tables
-- ============================================================
