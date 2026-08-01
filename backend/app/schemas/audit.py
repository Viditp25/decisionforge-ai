from typing import Any, Dict, Optional
from uuid import UUID
from datetime import datetime
from pydantic import BaseModel


class AuditLogResponse(BaseModel):
    id: UUID
    user_id: Optional[UUID] = None
    organization_id: UUID
    action: str
    resource_type: str
    resource_id: Optional[UUID] = None
    before_state: Optional[Dict[str, Any]] = None
    after_state: Optional[Dict[str, Any]] = None
    ip_address: Optional[str] = None
    user_agent: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True
