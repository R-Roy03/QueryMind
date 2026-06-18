-- QueryMind Demo Database
-- Simulates a SaaS company's enterprise data

CREATE TABLE IF NOT EXISTS customers (
    customer_id SERIAL PRIMARY KEY,
    full_name VARCHAR(100) NOT NULL,
    email VARCHAR(150) UNIQUE NOT NULL,
    region VARCHAR(50),
    signup_date DATE,
    tier VARCHAR(20) DEFAULT 'standard',
    is_active BOOLEAN DEFAULT true
);

CREATE TABLE IF NOT EXISTS products (
    product_id SERIAL PRIMARY KEY,
    product_name VARCHAR(100) NOT NULL,
    category VARCHAR(50),
    unit_price DECIMAL(8,2),
    stock_qty INT DEFAULT 0
);

CREATE TABLE IF NOT EXISTS orders (
    order_id SERIAL PRIMARY KEY,
    customer_id INT REFERENCES customers(customer_id),
    product_id INT REFERENCES products(product_id),
    order_date DATE NOT NULL,
    total_amount DECIMAL(10,2),
    status VARCHAR(20) DEFAULT 'pending',
    region VARCHAR(50)
);

CREATE TABLE IF NOT EXISTS events (
    event_id SERIAL PRIMARY KEY,
    customer_id INT REFERENCES customers(customer_id),
    event_type VARCHAR(50),
    event_date TIMESTAMP DEFAULT NOW(),
    properties JSONB
);

-- Seed customers (25 rows)
INSERT INTO customers (full_name, email, region, signup_date, tier, is_active) VALUES
('Priya Sharma', 'priya@techcorp.in', 'North', '2023-01-15', 'premium', true),
('Rahul Verma', 'rahul@startupx.io', 'South', '2023-02-20', 'standard', true),
('Anjali Singh', 'anjali@enterprise.com', 'West', '2023-03-10', 'premium', true),
('Vikram Nair', 'vikram@solutions.co', 'East', '2023-04-05', 'standard', false),
('Deepika Rao', 'deepika@cloudbase.in', 'North', '2023-05-12', 'gold', true),
('Arjun Patel', 'arjun@datahub.io', 'South', '2023-06-18', 'standard', true),
('Pooja Mehta', 'pooja@aiventures.in', 'West', '2023-07-22', 'premium', true),
('Rohit Kumar', 'rohit@scaleup.co', 'East', '2023-08-30', 'gold', true),
('Sneha Joshi', 'sneha@techbridge.in', 'North', '2023-09-14', 'standard', false),
('Kiran Reddy', 'kiran@dataprime.io', 'South', '2023-10-01', 'premium', true),
('Manish Gupta', 'manish@nexustech.in', 'West', '2024-01-10', 'gold', true),
('Nisha Agarwal', 'nisha@cloudworks.co', 'East', '2024-02-14', 'standard', true),
('Suresh Iyer', 'suresh@analytica.in', 'North', '2024-03-20', 'premium', true),
('Kavitha Nair', 'kavitha@insightco.io', 'South', '2024-04-05', 'standard', true),
('Arun Sharma', 'arun@datastream.in', 'West', '2024-05-15', 'gold', true),
('Divya Pillai', 'divya@mlworks.co', 'East', '2024-06-10', 'standard', false),
('Ravi Shankar', 'ravi@aiplatform.in', 'North', '2024-07-01', 'premium', true),
('Meena Das', 'meena@querybase.io', 'South', '2024-08-18', 'standard', true),
('Sanjay Bose', 'sanjay@datalake.in', 'West', '2024-09-22', 'gold', true),
('Lakshmi Prasad', 'lakshmi@warehouse.co', 'East', '2024-10-30', 'premium', true),
('Ajay Khanna', 'ajay@etlpro.in', 'North', '2024-11-05', 'standard', true),
('Sunita Rao', 'sunita@pipelineai.io', 'South', '2024-12-01', 'gold', true),
('Girish Menon', 'girish@semantic.in', 'West', '2025-01-10', 'premium', true),
('Revathi Kumar', 'revathi@llmtech.co', 'East', '2025-02-14', 'standard', true),
('Harish Pillai', 'harish@datamesh.in', 'North', '2025-03-20', 'gold', true);

-- Seed products (10 rows)
INSERT INTO products (product_name, category, unit_price, stock_qty) VALUES
('Enterprise Data Suite', 'Platform', 49999.00, 100),
('AI Analytics Module', 'AI', 29999.00, 200),
('Real-time Pipeline Engine', 'Infrastructure', 39999.00, 80),
('Semantic Layer Pro', 'Platform', 19999.00, 150),
('No-code ETL Builder', 'Low-code', 24999.00, 120),
('Data Quality Monitor', 'Governance', 14999.00, 300),
('BI Dashboard License', 'Analytics', 34999.00, 90),
('Cloud Storage Premium', 'Infrastructure', 9999.00, 500),
('API Access Gold', 'Service', 7999.00, 1000),
('Managed Support Pack', 'Service', 24999.00, 200);

-- Seed 100 orders
INSERT INTO orders (customer_id, product_id, order_date, total_amount, status, region)
SELECT
    (floor(random() * 25) + 1)::INT,
    (floor(random() * 10) + 1)::INT,
    (DATE '2024-01-01' + (floor(random() * 450))::INT),
    round((random() * 95000 + 5000)::numeric, 2),
    (ARRAY['completed', 'completed', 'completed', 'pending', 'cancelled', 'processing'])[floor(random()*6+1)],
    (ARRAY['North', 'South', 'East', 'West'])[floor(random()*4+1)]
FROM generate_series(1, 100);

-- Seed events
INSERT INTO events (customer_id, event_type, event_date, properties)
SELECT
    (floor(random() * 25) + 1)::INT,
    (ARRAY['login', 'query_run', 'pipeline_create', 'report_view', 'export'])[floor(random()*5+1)],
    NOW() - (floor(random() * 90) || ' days')::INTERVAL,
    '{}'::JSONB
FROM generate_series(1, 200);
