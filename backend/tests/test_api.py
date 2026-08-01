import pytest
from httpx import AsyncClient

# Make all tests in this file async
pytestmark = pytest.mark.asyncio


async def test_auth_and_project_lifecycle(client: AsyncClient):
    # 1. Register User
    reg_payload = {
        "email": "evelyn@decisionforge.ai",
        "password": "SecurePassword123!",
        "first_name": "Evelyn",
        "last_name": "Vance",
        "organization_name": "Apex Logistics"
    }
    response = await client.post("/api/v1/auth/register", json=reg_payload)
    assert response.status_code == 201
    reg_data = response.json()
    assert reg_data["email"] == "evelyn@decisionforge.ai"
    assert "organization_id" in reg_data

    # 2. Login User
    login_payload = {
        "email": "evelyn@decisionforge.ai",
        "password": "SecurePassword123!"
    }
    response = await client.post("/api/v1/auth/login", json=login_payload)
    assert response.status_code == 200
    token_data = response.json()
    assert "access_token" in token_data
    token = token_data["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # 3. Get profile
    response = await client.get("/api/v1/auth/me", headers=headers)
    assert response.status_code == 200
    profile = response.json()
    assert profile["email"] == "evelyn@decisionforge.ai"

    # Fetch default team id
    # (Since registering auto-created a Team and default membership, we can find the project's team)
    # Let's create a project by first creating a dummy Team ID (or query it)
    # For testing, we can use a mock team UUID
    team_id = "1c7a523a-f2b3-4690-b18c-3c81e3a479ff"

    # Let's create a Project
    project_payload = {
        "name": "Global VRP Route Optimization",
        "description": "Minimize routing distance for fleet VRP",
        "team_id": team_id
    }
    response = await client.post("/api/v1/projects", json=project_payload, headers=headers)
    # Should create project successfully
    assert response.status_code == 201
    project_data = response.json()
    project_id = project_data["id"]

    # 4. Upload Dataset
    # Upload mock VRP JSON dataset
    import json
    vrp_data = {
        "distance_matrix": [
            [0, 10, 20],
            [10, 0, 15],
            [20, 15, 0]
        ],
        "demands": [0, 5, 10]
    }
    
    files = {
        "file": ("vrp_dataset.json", json.dumps(vrp_data), "application/json")
    }
    data = {
        "project_id": project_id,
        "name": "Test VRP Dataset",
        "data_type": "GENERIC"
    }
    response = await client.post("/api/v1/datasets/upload", data=data, files=files, headers=headers)
    assert response.status_code == 201
    dataset_data = response.json()
    dataset_id = dataset_data["id"]

    # 5. Create Optimization Model
    model_payload = {
        "project_id": project_id,
        "name": "Fleet Delivery VRP Model",
        "model_type": "VRP",
        "configuration": {},
        "parameters": {
            "num_vehicles": 1,
            "depot": 0,
            "vehicle_capacities": [20]
        }
    }
    response = await client.post("/api/v1/optimization/models", json=model_payload, headers=headers)
    assert response.status_code == 201
    model_data = response.json()
    model_id = model_data["id"]

    # 6. Trigger Optimization Run
    run_payload = {
        "model_id": model_id,
        "dataset_id": dataset_id
    }
    response = await client.post("/api/v1/optimization/runs", json=run_payload, headers=headers)
    assert response.status_code == 202
    run_data = response.json()
    assert run_data["status"] == "SUCCESS"  # Synchronous execute runs instantly in mock service
    run_id = run_data["id"]

    # 7. Generate AI Explanation
    explain_payload = {
        "run_id": run_id,
        "run_type": "OPTIMIZATION"
    }
    response = await client.post("/api/v1/explanations/generate", json=explain_payload, headers=headers)
    assert response.status_code == 200
    explain_data = response.json()
    assert "explanation" in explain_data
    assert "Executive Decision Summary" in explain_data["explanation"]
