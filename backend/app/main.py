from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.config import settings
from app.routers import (
    schema_router, semantic_router, query_router,
    agent_router, pipeline_router, quality_router,
    pii_router, contract_router, monitor_router,
    anomaly_router, metrics_router, cost_router,
    db_router
)

app = FastAPI(
    title="QueryMind — Agentic Data Intelligence Platform",
    description="Natural language data querying with AI agent, pipeline builder, and data governance.",
    version="2.0.0",
)

# Allow frontend to talk to backend
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register all route groups
app.include_router(schema_router.router,   prefix="/api/schema",    tags=["Schema"])
app.include_router(semantic_router.router, prefix="/api/semantic",  tags=["Semantic"])
app.include_router(query_router.router,    prefix="/api/query",     tags=["Query"])
app.include_router(agent_router.router,    prefix="/api/agent",     tags=["Agent"])
app.include_router(pipeline_router.router, prefix="/api/pipeline",  tags=["Pipeline"])
app.include_router(quality_router.router,  prefix="/api/quality",   tags=["Data Quality"])
app.include_router(pii_router.router,      prefix="/api/pii",       tags=["PII"])
app.include_router(contract_router.router, prefix="/api/contracts", tags=["Contracts"])
app.include_router(monitor_router.router,  prefix="/api/monitor",   tags=["Monitor"])
app.include_router(anomaly_router.router,  prefix="/api/anomaly",   tags=["Anomaly"])
app.include_router(metrics_router.router,  prefix="/api/metrics",   tags=["Metrics"])
app.include_router(cost_router.router,     prefix="/api/cost",      tags=["Cost"])
app.include_router(db_router.router,       prefix="/api/db",        tags=["Database"])


@app.get("/health")
def health():
    """Simple health check endpoint."""
    return {"status": "ok", "service": "QueryMind", "version": "2.0.0", "modules": 13}
