from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.database import get_db
from app.schemas.audit import AuditLogResponse
from app.repositories.audit import AuditLogRepository
from app.api.deps import require_role
from app.models.user import User

router = APIRouter()


@router.get("", response_model=List[AuditLogResponse])
async def get_audit_logs(
    limit: int = 100,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role(["Owner", "Admin"])),
):
    audit_repo = AuditLogRepository(db)
    logs = await audit_repo.get_by_org(current_user.organization_id, limit=limit)
    return logs
