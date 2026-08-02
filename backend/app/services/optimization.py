import uuid
from typing import Optional
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.run import OptimizationRun
from app.models.model import OptimizationModel
from app.models.dataset import Dataset
from app.engines.optimization import OptimizationEngine
from app.repositories.run import OptimizationRunRepository
from sqlalchemy import select


class OptimizationService:
    def __init__(self, db: AsyncSession):
        self.db = db
        self.run_repo = OptimizationRunRepository(db)

    async def trigger_run(self, model_id: uuid.UUID, dataset_id: uuid.UUID, user_id: uuid.UUID) -> OptimizationRun:
        # Verify model
        model_result = await self.db.execute(
            select(OptimizationModel).filter(OptimizationModel.id == model_id)
        )
        model: Optional[OptimizationModel] = model_result.scalars().first()
        if not model:
            raise ValueError("Optimization model not found.")

        # Verify dataset
        dataset_result = await self.db.execute(
            select(Dataset).filter(Dataset.id == dataset_id)
        )
        dataset: Optional[Dataset] = dataset_result.scalars().first()
        if not dataset:
            raise ValueError("Dataset not found.")

        # Create Optimization Run
        run = OptimizationRun(
            model_id=model_id,
            dataset_id=dataset_id,
            status="PENDING",
            triggered_by=user_id
        )
        self.db.add(run)
        await self.db.flush()
        await self.db.commit()

        # Run synchronously for the API response or spawn background run
        # To satisfy requirements of quick execution & testing, we execute and save results
        await self.execute_run(run.id, model, dataset)
        return run

    async def execute_run(self, run_id: uuid.UUID, model: OptimizationModel, dataset: Dataset):
        run = await self.run_repo.get(run_id)
        if not run:
            return

        run.status = "RUNNING"
        await self.db.flush()

        try:
            if model.model_type == "VRP":
                # Extract VRP attributes from dataset
                distance_matrix = dataset.content.get("distance_matrix") or dataset.content.get("distances")
                num_vehicles = model.parameters.get("num_vehicles") or model.configuration.get("num_vehicles") or 1
                depot = model.parameters.get("depot") or dataset.content.get("depot") or 0
                demands = dataset.content.get("demands")
                
                if not demands and "locations" in dataset.content:
                    demands = [int(loc.get("demand", 0)) for loc in dataset.content["locations"]]
                
                capacities = model.parameters.get("vehicle_capacities")
                if not capacities:
                    capacity_limit = model.configuration.get("capacity_limit") or model.parameters.get("capacity_limit")
                    if capacity_limit:
                        capacities = [int(capacity_limit)] * num_vehicles

                if not distance_matrix:
                    raise ValueError("Dataset content is missing 'distance_matrix' or 'distances' for VRP.")

                # Convert distance matrix to integers to satisfy OR-Tools index manager constraints
                int_distance_matrix = []
                for row in distance_matrix:
                    int_row = [int(round(float(val))) for val in row]
                    int_distance_matrix.append(int_row)

                solver_res = OptimizationEngine.solve_vrp(
                    distance_matrix=int_distance_matrix,
                    num_vehicles=int(num_vehicles),
                    depot=int(depot),
                    demands=demands,
                    vehicle_capacities=capacities
                )
            
            elif model.model_type == "MILP":
                # Extract MILP variables, constraints, and objective configurations
                variables_cfg = model.configuration.get("variables", [])
                constraints_cfg = model.configuration.get("constraints", [])
                objective_cfg = model.configuration.get("objective", {})

                # Evaluate dynamic length parameters based on dataset length
                processed_variables = []
                for var in variables_cfg:
                    new_var = dict(var)
                    if "length" in new_var and isinstance(new_var["length"], str):
                        # Example dynamic length: "dataset.nodes.length"
                        expr = new_var["length"]
                        if expr == "dataset.nodes.length":
                            new_var["length"] = len(dataset.content.get("nodes", []))
                        elif expr == "dataset.edges.length":
                            new_var["length"] = len(dataset.content.get("edges", []))
                        else:
                            new_var["length"] = 1
                    processed_variables.append(new_var)

                # Solve MILP
                solver_res = OptimizationEngine.solve_milp(
                    variables_config=processed_variables,
                    constraints_config=constraints_cfg,
                    objective_config=objective_cfg,
                    matrix_data=dataset.content
                )
            else:
                raise ValueError(f"Unsupported model type: {model.model_type}")

            # Save results
            if solver_res["status"] in ["OPTIMAL", "FEASIBLE", "SUCCESS"]:
                run.status = "SUCCESS"
                run.results = solver_res.get("results")
                run.metrics = solver_res.get("metrics")
            else:
                run.status = "FAILED"
                run.error_message = solver_res.get("error_message", "Solver returned infeasible status.")
        
        except Exception as e:
            run.status = "FAILED"
            run.error_message = str(e)

        await self.db.flush()
        await self.db.commit()
