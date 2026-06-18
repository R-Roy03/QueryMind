# 🧠 QueryMind — AI Data Operating System

![Python](https://img.shields.io/badge/Python-3.11-3776AB?style=for-the-badge&logo=python&logoColor=white)
![AI](https://img.shields.io/badge/Gen_AI-Mistral_AI-FF7000?style=for-the-badge&logo=data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCAyNCI+PC9zdmc+&logoColor=white)
![React](https://img.shields.io/badge/Frontend-React_19-61DAFB?style=for-the-badge&logo=react&logoColor=black)
![FastAPI](https://img.shields.io/badge/Backend-FastAPI-009688?style=for-the-badge&logo=fastapi&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/Database-PostgreSQL_16-336791?style=for-the-badge&logo=postgresql&logoColor=white)
![Docker](https://img.shields.io/badge/Infra-Docker-2496ED?style=for-the-badge&logo=docker&logoColor=white)

### Enterprise-Grade AI Data Platform with Natural Language Query Engine

**QueryMind** is not just a SQL generator; it is a full-stack **AI Data Operating System** that transforms how teams interact with databases. Ask questions in plain English, and the system generates optimized SQL, executes it, explains the results, estimates cloud costs, detects PII, validates data contracts, and identifies anomalies — all autonomously.

Built with a **production-scale Brazilian E-Commerce dataset (550K+ rows)** from Kaggle, QueryMind demonstrates real-world data engineering capabilities across 7 interconnected tables.

> **Live Demo:** [Coming Soon](#) <!-- Update with Vercel URL after deployment -->

---

## 🚀 Key Features

### 🗣️ Natural Language → SQL Engine
Ask questions in plain English and get production-ready SQL instantly.
- **AI SQL Generation:** Mistral LLM converts natural language to optimized PostgreSQL queries.
- **VS Code-Style SQL Display:** Syntax-highlighted output with line numbers, keyword coloring, and copy button.
- **Query Optimization:** AI-powered hints for index creation, query rewriting, and performance tuning.
- **Cloud Cost Estimation:** Simulated BigQuery/Snowflake cost predictions for every query.
- **Confidence Scoring:** Each response includes an AI confidence percentage.
- **Query History:** Persistent sidebar with execution time and row count for every past query.

### 🤖 Autonomous AI Data Agent
A multi-step reasoning agent that autonomously analyzes your entire database.
- **Schema-Aware:** Automatically fetches database schema before reasoning.
- **Multi-Query Chains:** Executes multiple SQL queries in sequence to build comprehensive analysis.
- **ChatGPT-Style Responses:** Full-width, professionally formatted markdown with headers, lists, tables, and code blocks.
- **Thinking Steps:** Transparent chain-of-thought with expandable reasoning steps.

### 📊 Pipeline Builder & Visualizer
Visual ETL pipeline creation with interactive DAG visualization:
- **Natural Language → DAG:** Describe your ETL pipeline in English, get executable Airflow Python code.
- **VS Code-Style Code Display:** Syntax-highlighted Airflow DAG with line numbers and traffic light window controls.
- **Interactive Node Graph:** Draggable pipeline nodes with auto-layout (topological sort), marching ants animated edges, and color-coded node types (Source/Transform/Sink).
- **Lineage View:** Visual data flow tracking across pipeline stages.
- **Run History:** Complete pipeline execution history with timing and row counts.
- **AI Failure Diagnosis:** When a pipeline fails, the AI agent diagnoses root cause and suggests fixes.

### 🔒 Data Governance Suite
Enterprise-grade compliance and quality monitoring:
- **PII Detection:** Scans all columns for emails, phone numbers, Aadhaar, PAN, credit cards, and IP addresses.
- **Data Contract Validation:** Validates business rules (non-null, value ranges, allowed values) across all tables.
- **Anomaly Detection:** Z-score + IQR statistical analysis on numeric columns with AI-powered interpretation.
- **Compliance Risk Scoring:** GDPR/DPDP Act risk assessment with governance recommendations.

### 🛡️ Data Quality Scanner
Automated health checks across all tables:
- **NULL Analysis:** Detects columns with high null percentages.
- **Duplicate Detection:** Identifies duplicate values in columns that should be unique.
- **Health Scoring:** Each table gets a 0-100% health score with color-coded indicators.
- **AI Recommendations:** Specific, actionable fixes for every issue found.

### 📈 Metrics Dashboard
Live business intelligence at a glance:
- **KPI Cards:** Total orders, revenue, active customers, pending orders — all with color-coded icons.
- **Revenue by Region:** Interactive chart showing revenue distribution across Brazilian states.
- **Order Status Breakdown:** Real-time order lifecycle visualization.
- **Pipeline Operations:** Today's ETL activity at a glance.

### 🔌 Multi-Database Support
Connect to any database dynamically:
- **PostgreSQL** (default)
- **MySQL**
- **SQLite**
- **SQL Server**
- Hot-swap connections without restarting the application.

---

## 🏗️ System Architecture

```
┌─────────────────────────────────────────────────────────────────────────┐
│                          FRONTEND (React 19 + Vite)                     │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────────┐ │
│  │Dashboard │ │NL Query  │ │AI Agent  │ │Pipeline  │ │Governance    │ │
│  │(Metrics) │ │Engine    │ │Chat      │ │Builder   │ │(PII/Contract)│ │
│  └────┬─────┘ └────┬─────┘ └────┬─────┘ └────┬─────┘ └──────┬───────┘ │
│       │             │            │             │              │         │
│       └─────────────┴────────────┴─────────────┴──────────────┘         │
│                              Axios HTTP                                 │
└──────────────────────────────────┬──────────────────────────────────────┘
                                   │
                                   ▼
┌──────────────────────────────────────────────────────────────────────────┐
│                       BACKEND (FastAPI + SQLAlchemy)                     │
│                                                                          │
│  ┌─────────────┐  ┌───────────────┐  ┌──────────────┐                   │
│  │ Query Engine │  │ AI Data Agent │  │ Governance   │                   │
│  │ NL → SQL    │  │ Multi-step    │  │ PII Scanner  │                   │
│  │ Optimizer   │  │ Reasoning     │  │ Contracts    │                   │
│  │ Cost Est.   │  │ Chain-of-SQL  │  │ Anomaly Det. │                   │
│  └──────┬──────┘  └──────┬────────┘  └──────┬───────┘                   │
│         │                │                   │                           │
│         ▼                ▼                   ▼                           │
│  ┌─────────────────────────────────────────────────────┐                 │
│  │              Mistral AI LLM (mistral-small)         │                 │
│  └─────────────────────────────────────────────────────┘                 │
│         │                │                   │                           │
│         ▼                ▼                   ▼                           │
│  ┌─────────────────────────────────────────────────────┐                 │
│  │        DB Manager (SQLAlchemy — Multi-DB Support)   │                 │
│  └─────────────────────────┬───────────────────────────┘                 │
└────────────────────────────┬─────────────────────────────────────────────┘
                             │
                             ▼
┌──────────────────────────────────────────────────────────────────────────┐
│                    PostgreSQL 16 (Docker)                                │
│  ┌────────────┐ ┌────────────┐ ┌──────────────┐ ┌─────────────────┐    │
│  │ olist_     │ │ olist_     │ │ olist_order_ │ │ olist_order_    │    │
│  │ customers  │ │ orders     │ │ items        │ │ payments        │    │
│  │ (99K rows) │ │ (99K rows) │ │ (113K rows)  │ │ (104K rows)     │    │
│  └────────────┘ └────────────┘ └──────────────┘ └─────────────────┘    │
│  ┌────────────┐ ┌────────────┐ ┌──────────────┐                        │
│  │ olist_     │ │ olist_     │ │ olist_order_ │  + 4 Materialized     │
│  │ products   │ │ sellers    │ │ reviews      │    Views              │
│  │ (33K rows) │ │ (3K rows)  │ │ (99K rows)   │                       │
│  └────────────┘ └────────────┘ └──────────────┘                        │
└──────────────────────────────────────────────────────────────────────────┘
```

> **Flow:** User asks a question in plain English → Mistral AI generates optimized SQL → SQLAlchemy executes against PostgreSQL → Results are returned with AI explanation, confidence score, cost estimation, and optimization hints — all in under 2 seconds.

---

## 🛠️ Tech Stack

| Component | Technology | Reasoning |
| :--- | :--- | :--- |
| **LLM Engine** | **Mistral AI (Small)** | Cost-efficient, fast inference for SQL generation and agent reasoning. |
| **Backend** | **FastAPI** | Async-first Python framework with auto-generated OpenAPI docs. |
| **ORM / DB Layer** | **SQLAlchemy 2.0** | Unified interface for PostgreSQL, MySQL, SQLite, SQL Server. |
| **Frontend** | **React 19 + Vite** | Modern SPA with hot-reload, Framer Motion animations, Recharts. |
| **Styling** | **Tailwind CSS v4** | Utility-first CSS with custom enterprise design system. |
| **Graph Visualization** | **React Flow** | Interactive node-based pipeline visualization with drag-and-drop. |
| **Database** | **PostgreSQL 16** | Production-grade RDBMS with 550K+ rows of real e-commerce data. |
| **Dataset** | **Kaggle Olist** | Brazilian E-Commerce dataset — 7 tables, real-world relationships. |
| **Infrastructure** | **Docker Compose** | One-command deployment: DB + Backend + Frontend. |
| **Pipeline Monitor** | **SQLite** | Lightweight embedded DB for pipeline run history tracking. |

---

## 🏆 Competitive Advantage (Why QueryMind?)

| Feature | Standard Text-to-SQL ❌ | QueryMind ✅ |
| :--- | :---: | :---: |
| **Query Generation** | SQL Only | **SQL + Explanation + Confidence + Cost** |
| **Code Display** | Plain text | **VS Code-style syntax highlighting** |
| **Agent Capability** | None | **Multi-step Autonomous Reasoning** |
| **Agent Responses** | Basic text | **ChatGPT-style formatted markdown** |
| **Data Governance** | None | **PII Detection + Contract Validation** |
| **Anomaly Detection** | None | **Z-Score + IQR Statistical Analysis** |
| **Pipeline Builder** | None | **NL → Python DAG with Interactive Visualization** |
| **Pipeline Visualization** | Static | **Draggable nodes + Marching ants animation** |
| **Cost Estimation** | None | **Simulated BigQuery/Snowflake Pricing** |
| **Multi-DB Support** | Single DB | **PostgreSQL, MySQL, SQLite, SQL Server** |
| **Real Data** | Mock/Fake | **550K+ rows — Kaggle E-Commerce Dataset** |

---

## ⚙️ Installation & Setup

### Prerequisites
- **Docker Desktop** installed and running
- **Git** installed
- **Mistral AI API Key** ([Get free key here](https://console.mistral.ai/))

### 1. Clone the Repository
```bash
git clone https://github.com/R-Roy03/QueryMind.git
cd QueryMind
```

### 2. Download the Dataset
Download the [Brazilian E-Commerce Dataset](https://www.kaggle.com/datasets/olistbr/brazilian-ecommerce) from Kaggle and extract CSVs:
```bash
# Place these 7 CSV files in demo_data/kaggle/
# olist_customers_dataset.csv
# olist_orders_dataset.csv
# olist_order_items_dataset.csv
# olist_order_payments_dataset.csv
# olist_order_reviews_dataset.csv
# olist_products_dataset.csv
# olist_sellers_dataset.csv
```

### 3. Configure API Key
Edit `backend/.env`:
```env
MISTRAL_API_KEY=your_mistral_api_key_here
MISTRAL_MODEL=mistral-small-latest
TARGET_DB_URL=postgresql://sdil:sdilpass@db:5432/enterprise_demo
```

### 4. Launch with Docker (One Command)
```bash
docker-compose up --build
```
Wait for the logs to show:
```
db-1       | COPY 99441      ← Customers loaded
db-1       | COPY 112650     ← Order items loaded
backend-1  | Uvicorn running on http://0.0.0.0:8000
frontend-1 | VITE ready in 908 ms
```

### 5. Open the Application
```
Frontend:  http://localhost:5173
Backend:   http://localhost:8000/docs (Swagger UI)
```

---

## 🚀 Usage Guide

### 1. Dashboard
View live business metrics — total orders, revenue, active customers, revenue by state, and order trends.

### 2. Natural Language Query
Type questions like:
- *"Show me top 10 product categories by total revenue"*
- *"Which Brazilian state has the most orders?"*
- *"What is the average review score per product category?"*

The system returns: Generated SQL → Execution Results → AI Explanation → Cost Estimate → Optimization Hints.

### 3. AI Data Agent
Ask complex analytical questions:
- *"Give me an executive summary of seller performance by state"*
- *"What are the key trends in Brazilian e-commerce orders?"*

The agent autonomously runs multiple queries, chains the results, and presents a comprehensive analysis with professional formatting.

### 4. Pipeline Builder
Describe ETL pipelines in English:
- *"Read delivered orders, join with customers, aggregate revenue by state, write to summary table"*

Get interactive node visualization with draggable nodes and syntax-highlighted Airflow DAG code.

### 5. Data Governance
- **PII Scanner:** Detects email patterns, phone numbers, and ID formats across all columns.
- **Contract Validator:** Checks business rules like non-null constraints and value ranges.
- **Anomaly Detector:** Statistical outlier detection with Z-score and IQR methods.

---

## 📂 Project Structure

```
QueryMind/
├── docker-compose.yml              # One-command deployment
├── demo_data/
│   ├── kaggle/                     # 7 CSV files (550K+ rows)
│   └── seed_kaggle.sql             # Schema + COPY + Indexes + Views
│
├── backend/
│   ├── app/
│   │   ├── main.py                 # FastAPI application entry point
│   │   ├── config.py               # Environment configuration
│   │   ├── database.py             # SQLAlchemy engine setup
│   │   ├── llm/
│   │   │   └── mistral_client.py   # Mistral AI LLM wrapper
│   │   ├── routers/
│   │   │   ├── query_router.py     # NL → SQL endpoint
│   │   │   ├── agent_router.py     # AI Agent chat endpoint
│   │   │   ├── schema_router.py    # Schema introspection
│   │   │   ├── pipeline_router.py  # Pipeline builder
│   │   │   ├── monitor_router.py   # Pipeline monitoring
│   │   │   ├── quality_router.py   # Data quality scanner
│   │   │   ├── pii_router.py       # PII detection
│   │   │   ├── contract_router.py  # Data contract validation
│   │   │   ├── anomaly_router.py   # Anomaly detection
│   │   │   ├── cost_router.py      # Cost estimation
│   │   │   └── db_router.py        # Database management
│   │   └── services/
│   │       ├── sql_generator.py    # LLM-powered SQL generation
│   │       ├── query_executor.py   # Safe SQL execution
│   │       ├── data_agent.py       # Multi-step AI agent
│   │       ├── schema_extractor.py # Database introspection
│   │       ├── pii_scanner.py      # PII pattern matching
│   │       ├── contract_validator.py # Rule-based validation
│   │       ├── anomaly_detector.py # Statistical analysis
│   │       ├── pipeline_monitor.py # Run history tracking
│   │       ├── cost_estimator.py   # Cloud cost simulation
│   │       └── db_manager.py       # Multi-DB connection manager
│   ├── requirements.txt
│   └── Dockerfile
│
├── frontend/
│   ├── src/
│   │   ├── App.jsx                 # Main app with state-preserving routing
│   │   ├── pages/
│   │   │   ├── MetricsDashboard.jsx # Live KPI dashboard
│   │   │   ├── QueryPage.jsx       # NL query workspace
│   │   │   ├── AgentPage.jsx       # AI agent chat (ChatGPT-style)
│   │   │   ├── PipelinePage.jsx    # Pipeline builder + visualizer
│   │   │   ├── MonitorPage.jsx     # Pipeline monitor
│   │   │   ├── GovernancePage.jsx  # PII + Contracts + Anomalies
│   │   │   ├── SchemaPage.jsx      # Schema explorer
│   │   │   └── DataQualityPage.jsx # Quality scanner
│   │   ├── components/             # Reusable UI components
│   │   ├── hooks/                  # useTheme, useSchema
│   │   └── styles/                 # Enterprise design system (CSS variables)
│   ├── package.json
│   └── Dockerfile
│
└── README.md
```

---

## 📊 Dataset Details

**Source:** [Kaggle — Brazilian E-Commerce by Olist](https://www.kaggle.com/datasets/olistbr/brazilian-ecommerce)

| Table | Rows | Description |
| :--- | ---: | :--- |
| `olist_customers` | 99,441 | Customer IDs with city and state |
| `olist_orders` | 99,441 | Order status and timestamps |
| `olist_order_items` | 112,650 | Products in each order with pricing |
| `olist_order_payments` | 103,886 | Payment method and installments |
| `olist_order_reviews` | 99,224 | Review scores and comments |
| `olist_products` | 32,951 | Product categories and dimensions |
| `olist_sellers` | 3,095 | Seller locations across Brazil |
| **Total** | **550K+** | **7 tables with foreign key relationships** |

Pre-built SQL Views: `v_order_summary`, `v_product_performance`, `v_seller_performance`, `v_monthly_revenue`

---

## 🛡️ Future Scope
- **Live Deployment:** Vercel (frontend) + Railway (backend/DB) for public access.
- **Lineage Tracking:** Visual column-level data lineage across tables.
- **Scheduled Pipelines:** Cron-based ETL execution with Airflow integration.
- **RBAC:** Role-based access control for enterprise multi-user deployment.
- **Vector Search:** Semantic search over query history using embeddings.

---

## 📜 License

This project is licensed under the MIT License.

---

## 👤 Author

**Rakesh Raushan**

---
*Built with 🖤 by Rakesh Raushan*
