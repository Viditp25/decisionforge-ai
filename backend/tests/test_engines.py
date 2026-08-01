import pytest
from app.engines.optimization import OptimizationEngine
from app.engines.simulation import SimulationEngine
from app.engines.graph import GraphEngine


def test_milp_solver():
    # Maximize 5x + 4y
    # subject to:
    # 2x + 3y <= 12
    # x, y >= 0
    variables = [
        {"name": "x", "type": "CONTINUOUS", "min": 0, "max": 10},
        {"name": "y", "type": "CONTINUOUS", "min": 0, "max": 10},
    ]
    constraints = [
        {"name": "c1", "coefficients": {"x": 2, "y": 3}, "sense": "LE", "rhs": 12}
    ]
    objective = {
        "sense": "MAXIMIZE",
        "coefficients": {"x": 5, "y": 4}
    }

    res = OptimizationEngine.solve_milp(variables, constraints, objective)
    assert res["status"] == "OPTIMAL"
    # Max profit occurs at x=6, y=0 -> 5*6 + 4*0 = 30
    assert abs(res["results"]["objective_value"] - 30.0) < 1e-5
    assert abs(res["results"]["decisions"]["x"] - 6.0) < 1e-5
    assert abs(res["results"]["decisions"]["y"] - 0.0) < 1e-5


def test_vrp_solver():
    # 4 nodes distance matrix (depot is 0)
    distance_matrix = [
        [0, 10, 15, 20],
        [10, 0, 35, 25],
        [15, 35, 0, 30],
        [20, 25, 30, 0],
    ]
    res = OptimizationEngine.solve_vrp(distance_matrix, num_vehicles=1, depot=0)
    assert res["status"] == "SUCCESS"
    assert res["results"]["total_distance"] > 0
    assert len(res["results"]["routes"]) == 1
    # Check that route starts and ends at depot (0)
    route = res["results"]["routes"][0]["path"]
    assert route[0] == 0
    assert route[-1] == 0


def test_monte_carlo_simulation():
    uncertainty_config = {
        "distribution": "normal",
        "std_dev": 5.0
    }
    res = SimulationEngine.run_monte_carlo(
        base_value=100.0,
        uncertainty_config=uncertainty_config,
        num_trials=500,
        fixed_cost=20.0
    )
    assert res["status"] == "SUCCESS"
    # Expected mean should be around 100 - 20 = 80
    assert abs(res["results"]["mean"] - 80.0) < 2.0
    assert res["results"]["std_dev"] > 0
    assert "percentiles" in res["results"]
    assert "value_at_risk_95" in res["results"]


def test_graph_analytics():
    nodes = [
        {"id": "A", "label": "Source"},
        {"id": "B", "label": "Hub"},
        {"id": "C", "label": "Sink"}
    ]
    edges = [
        {"source": "A", "target": "B", "weight": 5.0, "capacity": 10.0},
        {"source": "B", "target": "C", "weight": 3.0, "capacity": 5.0}
    ]
    res = GraphEngine.analyze_network(nodes, edges, source_sink={"source": "A", "sink": "C"})
    assert res["status"] == "SUCCESS"
    assert res["results"]["shortest_path"] == ["A", "B", "C"]
    assert res["results"]["shortest_path_length"] == 8.0
    assert res["results"]["max_flow_value"] == 5.0
