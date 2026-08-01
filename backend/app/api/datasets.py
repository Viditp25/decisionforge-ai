import io
import csv
import uuid
import pandas as pd
from typing import List
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, status
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.database import get_db
from app.schemas.dataset import DatasetResponse, DatasetCreate
from app.repositories.dataset import DatasetRepository
from app.repositories.project import ProjectRepository
from app.api.deps import get_current_user, require_role
from app.models.user import User
from app.models.dataset import Dataset

router = APIRouter()


@router.post("/", response_model=DatasetResponse, status_code=status.HTTP_201_CREATED)
async def create_dataset(
    req: DatasetCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role(["Owner", "Admin", "Editor"]))
):
    project_repo = ProjectRepository(db)
    project = await project_repo.get(req.project_id)
    if not project or project.organization_id != current_user.organization_id:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Project not found or access denied"
        )
        
    dataset_repo = DatasetRepository(db)
    dataset = await dataset_repo.create(obj_in={
        "project_id": req.project_id,
        "name": req.name,
        "data_type": req.data_type,
        "content": req.content,
        "summary_metadata": req.summary_metadata or {"keys": list(req.content.keys()) if isinstance(req.content, dict) else []},
        "created_by": current_user.id
    })
    await db.commit()
    return dataset


@router.post("/upload", response_model=DatasetResponse, status_code=status.HTTP_201_CREATED)
async def upload_dataset(
    project_id: uuid.UUID = Form(...),
    name: str = Form(...),
    data_type: str = Form(...),  # NODES, EDGES, DEMAND, GENERIC
    file: UploadFile = File(...),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role(["Owner", "Admin", "Editor"])),
):
    # Verify project exists and belongs to organization
    project_repo = ProjectRepository(db)
    project = await project_repo.get(project_id)
    if not project or project.organization_id != current_user.organization_id:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Project not found or access denied"
        )

    # Read and parse file
    contents = await file.read()
    filename = file.filename or ""
    
    parsed_content = {}
    summary_metadata = {}

    try:
        if filename.endswith(".csv"):
            df = pd.read_csv(io.BytesIO(contents))
            # Convert NaN to None for JSON compliance
            df = df.where(pd.notnull(df), None)
            
            # Formulate structured dataset depending on type
            records = df.to_dict(orient="records")
            if data_type == "NODES":
                parsed_content = {"nodes": records}
            elif data_type == "EDGES":
                parsed_content = {"edges": records}
            else:
                parsed_content = {"records": records}
                
            summary_metadata = {
                "rows": len(df),
                "columns": list(df.columns),
            }
        elif filename.endswith(".json"):
            import json
            parsed_content = json.loads(contents.decode("utf-8"))
            summary_metadata = {
                "keys": list(parsed_content.keys()) if isinstance(parsed_content, dict) else []
            }
        else:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Unsupported file format. Please upload a CSV or JSON file."
            )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=f"Could not parse file: {str(e)}"
        )

    # Save dataset
    dataset_repo = DatasetRepository(db)
    dataset = await dataset_repo.create(obj_in={
        "project_id": project_id,
        "name": name,
        "data_type": data_type,
        "content": parsed_content,
        "summary_metadata": summary_metadata,
        "created_by": current_user.id
    })
    await db.commit()
    return dataset


@router.get("/project/{project_id}", response_model=List[DatasetResponse])
async def list_project_datasets(
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

    dataset_repo = DatasetRepository(db)
    datasets = await dataset_repo.get_by_project(project_id)
    return datasets


@router.get("/{dataset_id}", response_model=DatasetResponse)
async def get_dataset(
    dataset_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    dataset_repo = DatasetRepository(db)
    dataset = await dataset_repo.get(dataset_id)
    if not dataset:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Dataset not found"
        )
    
    # Verify project
    project_repo = ProjectRepository(db)
    project = await project_repo.get(dataset.project_id)
    if not project or project.organization_id != current_user.organization_id:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Access denied"
        )
    return dataset


@router.delete("/{dataset_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_dataset(
    dataset_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role(["Owner", "Admin"]))
):
    dataset_repo = DatasetRepository(db)
    dataset = await dataset_repo.get(dataset_id)
    if not dataset:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Dataset not found"
        )
        
    project_repo = ProjectRepository(db)
    project = await project_repo.get(dataset.project_id)
    if not project or project.organization_id != current_user.organization_id:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Access denied"
        )
        
    await dataset_repo.remove(dataset_id)
    await db.commit()
