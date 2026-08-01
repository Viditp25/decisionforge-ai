import time
from typing import Any, Dict, List, Optional
from ortools.linear_solver import pywraplp
from ortools.constraint_solver import routing_enums_pb2
from ortools.constraint_solver import pywrapcp
import numpy as np


class OptimizationEngine:
    @staticmethod
    def solve_milp(
        variables_config: List[Dict[str, Any]],
        constraints_config: List[Dict[str, Any]],
        objective_config: Dict[str, Any],
        matrix_data: Optional[Dict[str, Any]] = None,
    ) -> Dict[str, Any]:
        """
        Solves a Mixed-Integer Linear Program deterministically using Google OR-Tools (SCIP solver).
        
        variables_config: List of dicts, e.g. [{"name": "x", "type": "CONTINUOUS", "min": 0, "max": 10}]
        constraints_config: List of dicts, e.g. [{"name": "c1", "coefficients": {"x": 2, "y": 3}, "sense": "LE", "rhs": 12}]
        objective_config: Dict, e.g. {"sense": "MAXIMIZE", "coefficients": {"x": 5, "y": 4}}
        """
        start_time = time.time()
        solver = pywraplp.Solver.CreateSolver("SCIP")
        if not solver:
            return {"status": "FAILED", "error_message": "Could not create SCIP solver."}

        # 1. Create variables
        solver_vars = {}
        for var_cfg in variables_config:
            name = var_cfg["name"]
            var_type = var_cfg.get("type", "CONTINUOUS")
            min_val = var_cfg.get("min", 0.0)
            max_val = var_cfg.get("max", solver.infinity())

            # Handle dynamic length if it depends on data
            length = var_cfg.get("length")
            if length and isinstance(length, int):
                for i in range(length):
                    indexed_name = f"{name}_{i}"
                    if var_type == "BINARY":
                        solver_vars[indexed_name] = solver.BoolVar(indexed_name)
                    elif var_type == "INTEGER":
                        solver_vars[indexed_name] = solver.IntVar(min_val, max_val, indexed_name)
                    else:
                        solver_vars[indexed_name] = solver.NumVar(min_val, max_val, indexed_name)
            else:
                if var_type == "BINARY":
                    solver_vars[name] = solver.BoolVar(name)
                elif var_type == "INTEGER":
                    solver_vars[name] = solver.IntVar(min_val, max_val, name)
                else:
                    solver_vars[name] = solver.NumVar(min_val, max_val, name)

        # 2. Create constraints
        for const_cfg in constraints_config:
            sense = const_cfg.get("sense", "LE")
            rhs = float(const_cfg.get("rhs", 0.0))
            name = const_cfg.get("name", "")

            # If constraint coefficient references index keys (e.g. for facility location problems)
            coefficients = const_cfg.get("coefficients", {})
            
            # Create solver constraint
            if sense == "LE":
                constraint = solver.Constraint(-solver.infinity(), rhs, name)
            elif sense == "GE":
                constraint = solver.Constraint(rhs, solver.infinity(), name)
            elif sense == "EQ":
                constraint = solver.Constraint(rhs, rhs, name)
            else:
                continue

            for var_name, coeff in coefficients.items():
                if var_name in solver_vars:
                    constraint.SetCoefficient(solver_vars[var_name], float(coeff))

        # 3. Create objective
        objective = solver.Objective()
        obj_sense = objective_config.get("sense", "MINIMIZE")
        obj_coeffs = objective_config.get("coefficients", {})
        for var_name, coeff in obj_coeffs.items():
            if var_name in solver_vars:
                objective.SetCoefficient(solver_vars[var_name], float(coeff))
        
        if obj_sense == "MAXIMIZE":
            objective.SetMaximization()
        else:
            objective.SetMinimization()

        # 4. Solve
        status = solver.Solve()
        duration_ms = (time.time() - start_time) * 1000

        # Translate status
        status_map = {
            pywraplp.Solver.OPTIMAL: "OPTIMAL",
            pywraplp.Solver.FEASIBLE: "FEASIBLE",
            pywraplp.Solver.INFEASIBLE: "INFEASIBLE",
            pywraplp.Solver.UNBOUNDED: "UNBOUNDED",
            pywraplp.Solver.ABNORMAL: "ABNORMAL",
            pywraplp.Solver.NOT_SOLVED: "NOT_SOLVED",
        }
        solved_status = status_map.get(status, "FAILED")

        results = {}
        if solved_status in ["OPTIMAL", "FEASIBLE"]:
            results["objective_value"] = solver.Objective().Value()
            results["decisions"] = {
                var_name: var.solution_value() for var_name, var in solver_vars.items()
            }
        else:
            results["objective_value"] = None
            results["decisions"] = {}

        return {
            "status": solved_status,
            "results": results,
            "metrics": {
                "solve_duration_ms": duration_ms,
                "iterations": solver.iterations(),
                "nodes": solver.nodes(),
            },
        }

    @staticmethod
    def solve_vrp(
        distance_matrix: List[List[int]],
        num_vehicles: int,
        depot: int,
        demands: Optional[List[int]] = None,
        vehicle_capacities: Optional[List[int]] = None,
    ) -> Dict[str, Any]:
        """
        Solves the Vehicle Routing Problem (VRP) deterministically using Google OR-Tools.
        """
        start_time = time.time()
        
        # Instantiate the routing index manager.
        manager = pywrapcp.RoutingIndexManager(
            len(distance_matrix), num_vehicles, depot
        )

        # Create Routing Model.
        routing = pywrapcp.RoutingModel(manager)

        # Create and register a transit callback.
        def distance_callback(from_index, to_index):
            # Convert from routing variable Index to distance matrix NodeIndex.
            from_node = manager.IndexToNode(from_index)
            to_node = manager.IndexToNode(to_index)
            return distance_matrix[from_node][to_node]

        transit_callback_index = routing.RegisterTransitCallback(distance_callback)

        # Define cost of each arc.
        routing.SetArcCostEvaluatorOfAllVehicles(transit_callback_index)

        # Add Capacity constraint if demands and vehicle_capacities are supplied
        if demands and vehicle_capacities:
            def demand_callback(from_index):
                # Convert from routing variable Index to demand NodeIndex.
                from_node = manager.IndexToNode(from_index)
                return demands[from_node]

            demand_callback_index = routing.RegisterUnaryTransitCallback(demand_callback)
            routing.AddDimensionWithVehicleCapacity(
                demand_callback_index,
                0,  # null capacity slack
                vehicle_capacities,  # vehicle maximum capacities
                True,  # start cumul to zero
                "Capacity",
            )

        # Setting first solution heuristic.
        search_parameters = pywrapcp.DefaultRoutingSearchParameters()
        search_parameters.first_solution_strategy = (
            routing_enums_pb2.FirstSolutionStrategy.PATH_CHEAPEST_ARC
        )

        # Solve the problem.
        solution = routing.SolveWithParameters(search_parameters)
        duration_ms = (time.time() - start_time) * 1000

        if not solution:
            return {"status": "FAILED", "error_message": "VRP Solver failed to find a solution."}

        # Build paths
        routes = []
        total_distance = 0
        total_load = 0

        for vehicle_id in range(num_vehicles):
            index = routing.Start(vehicle_id)
            route = []
            route_distance = 0
            route_load = 0
            
            while not routing.IsEnd(index):
                node_index = manager.IndexToNode(index)
                route.append(node_index)
                
                previous_index = index
                index = solution.Value(routing.NextVar(index))
                route_distance += routing.GetArcCostForVehicle(previous_index, index, vehicle_id)
                
                if demands:
                    route_load += demands[node_index]
                    
            node_index = manager.IndexToNode(index)
            route.append(node_index)
            
            routes.append({
                "vehicle_id": vehicle_id,
                "path": route,
                "distance": route_distance,
                "load": route_load
            })
            total_distance += route_distance
            total_load += route_load

        return {
            "status": "SUCCESS",
            "results": {
                "routes": routes,
                "total_distance": total_distance,
                "total_load": total_load,
            },
            "metrics": {
                "solve_duration_ms": duration_ms,
            }
        }
