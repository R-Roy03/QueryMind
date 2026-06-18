"""
Pydantic models for database schema representation.
Used when returning schema info to the frontend.
"""
from pydantic import BaseModel
from typing import List, Optional


class ColumnInfo(BaseModel):
    name: str
    type: str
    nullable: bool = True
    primary_key: bool = False
    foreign_key: Optional[str] = None


class TableInfo(BaseModel):
    name: str
    columns: List[ColumnInfo]
    row_count: int = 0


class DatabaseSchema(BaseModel):
    database: str
    tables: List[TableInfo]
