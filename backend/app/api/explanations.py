import uuid
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.database import get_db
from app.schemas.explanation import ExplanationTrigger, ExplanationResponse
from app.services.explanation import ExplanationService
from app.api.deps import get_current_user
from app.models.user import User
from app.models.explanation import AIExplanation
from app.models.model import OptimizationModel, SimulationModel
from app.models.run import OptimizationRun, SimulationRun
from sqlalchemy import select

router = APIRouter()


@router.get("/project/{project_id}/runs", response_model=List[dict])
async def list_project_runs(
    project_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    # Fetch Optimization Runs
    opt_stmt = (
        select(OptimizationRun)
        .join(OptimizationModel, OptimizationRun.model_id == OptimizationModel.id)
        .filter(OptimizationModel.project_id == project_id)
    )
    opt_result = await db.execute(opt_stmt)
    opt_runs = opt_result.scalars().all()
    
    # Fetch Simulation Runs
    sim_stmt = (
        select(SimulationRun)
        .join(SimulationModel, SimulationRun.model_id == SimulationModel.id)
        .filter(SimulationModel.project_id == project_id)
    )
    sim_result = await db.execute(sim_stmt)
    sim_runs = sim_result.scalars().all()
    
    combined = []
    for r in opt_runs:
        combined.append({
            "id": str(r.id),
            "run_type": "OPTIMIZATION",
            "status": r.status,
            "results": r.results,
            "created_at": r.created_at.isoformat() if r.created_at else None,
            "error_message": r.error_message
        })
    for r in sim_runs:
        combined.append({
            "id": str(r.id),
            "run_type": "SIMULATION",
            "status": r.status,
            "results": r.results,
            "created_at": r.created_at.isoformat() if r.created_at else None,
            "error_message": r.error_message
        })
        
    combined.sort(key=lambda x: x["created_at"] or "", reverse=True)
    return combined


@router.post("/generate", response_model=ExplanationResponse, status_code=status.HTTP_200_OK)
async def generate_explanation(
    req: ExplanationTrigger,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    explanation_service = ExplanationService(db)
    try:
        explanation = await explanation_service.generate_explanation(
            run_id=req.run_id,
            run_type=req.run_type
        )
        return explanation
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )


@router.get("/run/{run_id}", response_model=ExplanationResponse)
async def get_explanation_by_run(
    run_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = await db.execute(
        select(AIExplanation).filter(AIExplanation.run_id == run_id)
    )
    explanation = result.scalars().first()
    if not explanation:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Explanation not found for this run"
        )
    return explanation
