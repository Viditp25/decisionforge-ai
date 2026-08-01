import uuid
from typing import List
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.project import Project
from app.repositories.base import BaseRepository


class ProjectRepository(BaseRepository[Project]):
    def __init__(self, db: AsyncSession):
        super().__init__(Project, db)

    async def get_by_org(self, organization_id: uuid.UUID) -> List[Project]:
        result = await self.db.execute(
            select(self.model)
            .filter(self.model.organization_id == organization_id, self.model.is_archived == False)
            .order_by(self.model.created_at.desc())
        )
        return list(result.scalars().all())

    async def get_by_team(self, team_id: uuid.UUID) -> List[Project]:
        result = await self.db.execute(
            select(self.model)
            .filter(self.model.team_id == team_id, self.model.is_archived == False)
            .order_by(self.model.created_at.desc())
        )
        return list(result.scalars().all())
