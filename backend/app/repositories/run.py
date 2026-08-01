import uuid
from typing import List, Optional
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload
from app.models.run import OptimizationRun, SimulationRun, ScenarioComparison
from app.repositories.base import BaseRepository


class OptimizationRunRepository(BaseRepository[OptimizationRun]):
    def __init__(self, db: AsyncSession):
        super().__init__(OptimizationRun, db)

    async def get_by_model(self, model_id: uuid.UUID) -> List[OptimizationRun]:
        result = await self.db.execute(
            select(self.model)
            .filter(self.model.model_id == model_id)
            .order_by(self.model.created_at.desc())
        )
        return list(result.scalars().all())

    async def get_with_explanation(self, run_id: uuid.UUID) -> Optional[OptimizationRun]:
        result = await self.db.execute(
            select(self.model)
            .filter(self.model.id == run_id)
            .options(selectinload(self.model.explanation))
        )
        return result.scalars().first()


class SimulationRunRepository(BaseRepository[SimulationRun]):
    def __init__(self, db: AsyncSession):
        super().__init__(SimulationRun, db)

    async def get_by_model(self, model_id: uuid.UUID) -> List[SimulationRun]:
        result = await self.db.execute(
            select(self.model)
            .filter(self.model.model_id == model_id)
            .order_by(self.model.created_at.desc())
        )
        return list(result.scalars().all())

    async def get_with_explanation(self, run_id: uuid.UUID) -> Optional[SimulationRun]:
        result = await self.db.execute(
            select(self.model)
            .filter(self.model.id == run_id)
            .options(selectinload(self.model.explanation))
        )
        return result.scalars().first()


class ScenarioComparisonRepository(BaseRepository[ScenarioComparison]):
    def __init__(self, db: AsyncSession):
        super().__init__(ScenarioComparison, db)

    async def get_by_project(self, project_id: uuid.UUID) -> List[ScenarioComparison]:
        result = await self.db.execute(
            select(self.model)
            .filter(self.model.project_id == project_id)
            .order_by(self.model.created_at.desc())
        )
        return list(result.scalars().all())
