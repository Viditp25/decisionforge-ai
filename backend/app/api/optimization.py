import uuid
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.database import get_db
from app.schemas.model import OptimizationModelCreate, OptimizationModelResponse
from app.schemas.run import OptimizationRunTrigger, OptimizationRunResponse
from app.repositories.project import ProjectRepository
from app.repositories.run import OptimizationRunRepository
from app.models.model import OptimizationModel
from app.services.optimization import OptimizationService
from app.api.deps import get_current_user, require_role
from app.models.user import User
from sqlalchemy import select

router = APIRouter()


@router.post("/models", response_model=OptimizationModelResponse, status_code=status.HTTP_201_CREATED)
async def create_model(
    req: OptimizationModelCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role(["Owner", "Admin", "Editor"])),
):
    project_repo = ProjectRepository(db)
    project = await project_repo.get(req.project_id)
    if not project or project.organization_id != current_user.organization_id:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Project not found or access denied"
        )

    model = OptimizationModel(
        project_id=req.project_id,
        name=req.name,
        model_type=req.model_type,
        configuration=req.configuration,
        parameters=req.parameters
    )
    db.add(model)
    await db.commit()
    return model


@router.get("/models/project/{project_id}", response_model=List[OptimizationModelResponse])
async def list_models(
    project_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    project_repo = ProjectRepository(db)
    project = await project_repo.get(project_id)
    if not project or project.organization_id != current_user.organization_id:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Project not found or access denied"
        )

    result = await db.execute(
        select(OptimizationModel).filter(OptimizationModel.project_id == project_id)
    )
    return list(result.scalars().all())


@router.post("/runs", response_model=OptimizationRunResponse, status_code=status.HTTP_202_ACCEPTED)
@router.post("/run", response_model=OptimizationRunResponse, status_code=status.HTTP_202_ACCEPTED)
async def run_optimization(
    req: OptimizationRunTrigger,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role(["Owner", "Admin", "Editor"])),
):
    opt_service = OptimizationService(db)
    try:
        run = await opt_service.trigger_run(
            model_id=req.model_id,
            dataset_id=req.dataset_id,
            user_id=current_user.id
        )
        return run
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )


@router.get("/runs/{run_id}", response_model=OptimizationRunResponse)
async def get_run(
    run_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    run_repo = OptimizationRunRepository(db)
    run = await run_repo.get(run_id)
    if not run:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Run not found"
        )
    return run


@router.delete("/models/{model_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_model(
    model_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role(["Owner", "Admin"]))
):
    result = await db.execute(
        select(OptimizationModel).filter(OptimizationModel.id == model_id)
    )
    model = result.scalar_one_or_none()
    if not model:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Model not found"
        )
        
    project_repo = ProjectRepository(db)
    project = await project_repo.get(model.project_id)
    if not project or project.organization_id != current_user.organization_id:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Access denied"
        )
        
    await db.delete(model)
    await db.commit()
