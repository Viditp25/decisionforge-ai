import uuid
from typing import Optional
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.run import SimulationRun
from app.models.model import SimulationModel
from app.models.dataset import Dataset
from app.engines.simulation import SimulationEngine
from app.repositories.run import SimulationRunRepository
from sqlalchemy import select


class SimulationService:
    def __init__(self, db: AsyncSession):
        self.db = db
        self.run_repo = SimulationRunRepository(db)

    async def trigger_run(self, model_id: uuid.UUID, dataset_id: uuid.UUID, user_id: uuid.UUID) -> SimulationRun:
        model_result = await self.db.execute(
            select(SimulationModel).filter(SimulationModel.id == model_id)
        )
        model: Optional[SimulationModel] = model_result.scalars().first()
        if not model:
            raise ValueError("Simulation model not found.")

        dataset_result = await self.db.execute(
            select(Dataset).filter(Dataset.id == dataset_id)
        )
        dataset: Optional[Dataset] = dataset_result.scalars().first()
        if not dataset:
            raise ValueError("Dataset not found.")

        # Create Simulation Run
        run = SimulationRun(
            model_id=model_id,
            dataset_id=dataset_id,
            status="PENDING",
            triggered_by=user_id
        )
        self.db.add(run)
        await self.db.flush()
        await self.db.commit()

        # Run Monte Carlo simulation
        await self.execute_run(run.id, model, dataset)
        return run

    async def execute_run(self, run_id: uuid.UUID, model: SimulationModel, dataset: Dataset):
        run = await self.run_repo.get(run_id)
        if not run:
            return

        run.status = "RUNNING"
        await self.db.flush()

        try:
            # Extract configuration and parameters
            base_value = float(model.configuration.get("base_value", 100.0))
            fixed_cost = float(model.parameters.get("fixed_cost", 0.0))
            uncertainty = model.parameters.get("uncertainty", {})
            num_trials = int(model.configuration.get("num_trials", 1000))

            # Run Simulation
            sim_res = SimulationEngine.run_monte_carlo(
                base_value=base_value,
                uncertainty_config=uncertainty,
                num_trials=num_trials,
                fixed_cost=fixed_cost
            )

            if sim_res["status"] == "SUCCESS":
                run.status = "SUCCESS"
                run.results = sim_res.get("results")
                run.metrics = sim_res.get("metrics")
            else:
                run.status = "FAILED"
                run.error_message = "Simulation failed to compute."
                
        except Exception as e:
            run.status = "FAILED"
            run.error_message = str(e)

        await self.db.flush()
        await self.db.commit()
