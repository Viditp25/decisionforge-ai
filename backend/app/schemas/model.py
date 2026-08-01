from typing import Any, Dict, Optional
from uuid import UUID
from datetime import datetime
from pydantic import BaseModel


class OptimizationModelCreate(BaseModel):
    project_id: UUID
    name: str
    model_type: str  # MILP, VRP, SCHEDULING
    configuration: Dict[str, Any]
    parameters: Dict[str, Any]


class OptimizationModelResponse(BaseModel):
    id: UUID
    project_id: UUID
    name: str
    model_type: str
    configuration: Dict[str, Any]
    parameters: Dict[str, Any]
    created_at: datetime

    class Config:
        from_attributes = True


class SimulationModelCreate(BaseModel):
    project_id: UUID
    name: str
    configuration: Dict[str, Any]
    parameters: Dict[str, Any]


class SimulationModelResponse(BaseModel):
    id: UUID
    project_id: UUID
    name: str
    configuration: Dict[str, Any]
    parameters: Dict[str, Any]
    created_at: datetime

    class Config:
        from_attributes = True
