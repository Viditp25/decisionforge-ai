import uuid
from typing import List
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.dataset import Dataset
from app.repositories.base import BaseRepository


class DatasetRepository(BaseRepository[Dataset]):
    def __init__(self, db: AsyncSession):
        super().__init__(Dataset, db)

    async def get_by_project(self, project_id: uuid.UUID) -> List[Dataset]:
        result = await self.db.execute(
            select(self.model)
            .filter(self.model.project_id == project_id)
            .order_by(self.model.created_at.desc())
        )
        return list(result.scalars().all())
