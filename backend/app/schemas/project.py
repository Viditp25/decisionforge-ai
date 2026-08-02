from typing import Optional
from uuid import UUID
from datetime import datetime
from pydantic import BaseModel


class ProjectBase(BaseModel):
    name: str
    description: Optional[str] = None


class ProjectCreate(ProjectBase):
    team_id: Optional[UUID] = None


class ProjectUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    is_archived: Optional[bool] = None


class ProjectResponse(ProjectBase):
    id: UUID
    team_id: UUID
    organization_id: UUID
    is_archived: bool
    created_at: datetime

    class Config:
        from_attributes = True
