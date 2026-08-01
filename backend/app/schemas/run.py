from typing import Any, Dict, Optional
from uuid import UUID
from datetime import datetime
from pydantic import BaseModel


class OptimizationRunTrigger(BaseModel):
    model_id: UUID
    dataset_id: UUID


class OptimizationRunResponse(BaseModel):
    id: UUID
    model_id: UUID
    dataset_id: UUID
    status: str
    results: Optional[Dict[str, Any]] = None
    metrics: Optional[Dict[str, Any]] = None
    error_message: Optional[str] = None
    triggered_by: Optional[UUID] = None
    created_at: datetime

    class Config:
        from_attributes = True


class SimulationRunTrigger(BaseModel):
    model_id: UUID
    dataset_id: UUID


class SimulationRunResponse(BaseModel):
    id: UUID
    model_id: UUID
    dataset_id: UUID
    status: str
    results: Optional[Dict[str, Any]] = None
    metrics: Optional[Dict[str, Any]] = None
    error_message: Optional[str] = None
    triggered_by: Optional[UUID] = None
    created_at: datetime

    class Config:
        from_attributes = True


class ScenarioComparisonCreate(BaseModel):
    project_id: UUID
    name: str
    run_a_id: UUID
    run_b_id: UUID


class ScenarioComparisonResponse(BaseModel):
    id: UUID
    project_id: UUID
    name: str
    run_a_id: UUID
    run_b_id: UUID
    comparison_metrics: Dict[str, Any]
    created_at: datetime

    class Config:
        from_attributes = True
