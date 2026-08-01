import uuid
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.database import get_db
from app.schemas.project import ProjectCreate, ProjectResponse, ProjectUpdate
from app.repositories.project import ProjectRepository
from app.api.deps import get_current_user, require_role
from app.models.user import User

router = APIRouter()


@router.post("", response_model=ProjectResponse, status_code=status.HTTP_201_CREATED)
async def create_project(
    req: ProjectCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role(["Owner", "Admin", "Editor"])),
):
    project_repo = ProjectRepository(db)
    obj_data = req.model_dump()
    obj_data["organization_id"] = current_user.organization_id
    project = await project_repo.create(obj_in=obj_data)
    await db.commit()
    return project


@router.get("", response_model=List[ProjectResponse])
async def list_projects(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    project_repo = ProjectRepository(db)
    projects = await project_repo.get_by_org(current_user.organization_id)
    return projects


@router.get("/{project_id}", response_model=ProjectResponse)
async def get_project(
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
    return project


@router.put("/{project_id}", response_model=ProjectResponse)
async def update_project(
    project_id: uuid.UUID,
    req: ProjectUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role(["Owner", "Admin", "Editor"])),
):
    project_repo = ProjectRepository(db)
    project = await project_repo.get(project_id)
    if not project or project.organization_id != current_user.organization_id:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Project not found or access denied"
        )
    
    updated_project = await project_repo.update(db_obj=project, obj_in=req.model_dump(exclude_unset=True))
    await db.commit()
    return updated_project
