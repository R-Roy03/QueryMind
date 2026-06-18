"""
Database connection setup.
We use two databases:
  1. target_db — the user's actual database (PostgreSQL) for running queries
  2. app_db — internal SQLite for caching semantic layers, etc.
"""
from sqlalchemy import create_engine
from app.config import settings

# Target database engine (PostgreSQL — where user data lives)
target_engine = create_engine(
    settings.target_db_url,
    pool_pre_ping=True,
    pool_size=5,
    max_overflow=10,
)
