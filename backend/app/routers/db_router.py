"""
Database Connection Router — switch databases, test connections, get status.
"""
from fastapi import APIRouter, HTTPException
from app.services.db_manager import db_manager

router = APIRouter()


@router.get("/status")
def connection_status():
    """Get current database connection status."""
    return db_manager.get_status()


@router.post("/switch")
def switch_database(body: dict):
    """Switch to a different database.
    Body can contain either:
      - url: full SQLAlchemy connection string
      - OR parts: db_type, host, port, database, username, password
    """
    url = body.get("url")

    if not url:
        db_type = body.get("db_type", "postgresql")
        host = body.get("host", "localhost")
        port = body.get("port", 5432)
        database = body.get("database", "")
        username = body.get("username", "")
        password = body.get("password", "")

        if not database:
            raise HTTPException(400, detail="Database name is required")

        url = db_manager.build_url(db_type, host, port, database, username, password)

    result = db_manager.switch_database(url)
    if not result["success"]:
        raise HTTPException(400, detail=result)
    return result


@router.post("/test")
def test_connection(body: dict):
    """Test a database connection without switching."""
    url = body.get("url")

    if not url:
        db_type = body.get("db_type", "postgresql")
        host = body.get("host", "localhost")
        port = body.get("port", 5432)
        database = body.get("database", "")
        username = body.get("username", "")
        password = body.get("password", "")

        if not database:
            raise HTTPException(400, detail="Database name is required")

        url = db_manager.build_url(db_type, host, port, database, username, password)

    return db_manager.test_connection(url)
