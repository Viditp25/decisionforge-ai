from typing import Any, Dict, List, Optional
from uuid import UUID
from datetime import datetime
from pydantic import BaseModel


class DatasetCreate(BaseModel):
    project_id: UUID
    name: str
    data_type: str  # NODES, EDGES, DEMAND, GENERIC
    content: Dict[str, Any]
    summary_metadata: Optional[Dict[str, Any]] = None


class DatasetResponse(BaseModel):
    id: UUID
    project_id: UUID
    name: str
    data_type: str
    content: Dict[str, Any]
    summary_metadata: Optional[Dict[str, Any]] = None
    created_by: Optional[UUID] = None
    created_at: datetime

    class Config:
        from_attributes = True
