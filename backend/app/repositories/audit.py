import uuid
from typing import List
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.audit import AuditLog
from app.repositories.base import BaseRepository


class AuditLogRepository(BaseRepository[AuditLog]):
    def __init__(self, db: AsyncSession):
        super().__init__(AuditLog, db)

    async def get_by_org(
        self, organization_id: uuid.UUID, limit: int = 100
    ) -> List[AuditLog]:
        result = await self.db.execute(
            select(self.model)
            .filter(self.model.organization_id == organization_id)
            .order_by(self.model.created_at.desc())
            .limit(limit)
        )
        return list(result.scalars().all())
