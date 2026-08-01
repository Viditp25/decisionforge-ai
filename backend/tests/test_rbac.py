import pytest
import uuid
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.models.user import User
from app.models.org import TeamMembership
from app.models.project import Project

pytestmark = pytest.mark.asyncio


async def test_rbac_rules(client: AsyncClient, db_session: AsyncSession):
    # 1. Register Owner
    reg_owner = {
        "email": "owner@df.ai",
        "password": "SecurePassword123!",
        "first_name": "Owner",
        "last_name": "User",
        "organization_name": "Apex Corp"
    }
    res = await client.post("/api/v1/auth/register", json=reg_owner)
    assert res.status_code == 201
    owner_data = res.json()
    org_id = owner_data["organization_id"]
    owner_token = (await client.post("/api/v1/auth/login", json={"email": "owner@df.ai", "password": "SecurePassword123!"})).json()["access_token"]
    owner_headers = {"Authorization": f"Bearer {owner_token}"}

    # Fetch Owner's Team ID from DB
    result = await db_session.execute(
        select(TeamMembership).filter(TeamMembership.user_id == uuid.UUID(owner_data["id"]))
    )
    owner_membership = result.scalars().first()
    assert owner_membership is not None
    team_id = owner_membership.team_id

    # Create Owner's Project
    res = await client.post("/api/v1/projects", json={
        "name": "Operations project",
        "description": "Ops",
        "team_id": str(team_id)
    }, headers=owner_headers)
    assert res.status_code == 201
    project_id = res.json()["id"]

    # 2. Register Editor
    reg_editor = {
        "email": "editor@df.ai",
        "password": "SecurePassword123!",
        "first_name": "Editor",
        "last_name": "User",
        "organization_name": "Editor Corp"
    }
    res = await client.post("/api/v1/auth/register", json=reg_editor)
    assert res.status_code == 201
    editor_data = res.json()
    editor_token = (await client.post("/api/v1/auth/login", json={"email": "editor@df.ai", "password": "SecurePassword123!"})).json()["access_token"]
    editor_headers = {"Authorization": f"Bearer {editor_token}"}

    # 3. Register Viewer
    reg_viewer = {
        "email": "viewer@df.ai",
        "password": "SecurePassword123!",
        "first_name": "Viewer",
        "last_name": "User",
        "organization_name": "Viewer Corp"
    }
    res = await client.post("/api/v1/auth/register", json=reg_viewer)
    assert res.status_code == 201
    viewer_data = res.json()
    viewer_token = (await client.post("/api/v1/auth/login", json={"email": "viewer@df.ai", "password": "SecurePassword123!"})).json()["access_token"]
    viewer_headers = {"Authorization": f"Bearer {viewer_token}"}

    # Clear active transactions to enable clean updates
    await db_session.commit()

    # Move Editor to Owner's Org and Team with "Editor" Role
    res_editor_user = await db_session.execute(select(User).filter(User.email == "editor@df.ai"))
    editor_user = res_editor_user.scalars().first()
    editor_user.organization_id = uuid.UUID(org_id)

    res_editor_mem = await db_session.execute(select(TeamMembership).filter(TeamMembership.user_id == editor_user.id))
    editor_mem = res_editor_mem.scalars().first()
    editor_mem.team_id = team_id
    editor_mem.role = "Editor"

    # Move Viewer to Owner's Org and Team with "Viewer" Role
    res_viewer_user = await db_session.execute(select(User).filter(User.email == "viewer@df.ai"))
    viewer_user = res_viewer_user.scalars().first()
    viewer_user.organization_id = uuid.UUID(org_id)

    res_viewer_mem = await db_session.execute(select(TeamMembership).filter(TeamMembership.user_id == viewer_user.id))
    viewer_mem = res_viewer_mem.scalars().first()
    viewer_mem.team_id = team_id
    viewer_mem.role = "Viewer"

    await db_session.commit()

    # --- VERIFY ROLE: VIEWER ---
    # Try to create model -> Should fail (403)
    res = await client.post("/api/v1/optimization/models", json={
        "project_id": project_id,
        "name": "Viewer Model",
        "model_type": "VRP",
        "configuration": {"num_vehicles": 2},
        "parameters": {"time_limit_seconds": 10}
    }, headers=viewer_headers)
    assert res.status_code == 403

    # --- VERIFY ROLE: EDITOR ---
    # Try to create model -> Should succeed (201)
    res = await client.post("/api/v1/optimization/models", json={
        "project_id": project_id,
        "name": "Editor Model",
        "model_type": "VRP",
        "configuration": {"num_vehicles": 2},
        "parameters": {"time_limit_seconds": 10}
    }, headers=editor_headers)
    assert res.status_code == 201
    model_id = res.json()["id"]

    # Try to delete model -> Should fail (403)
    res = await client.delete(f"/api/v1/optimization/models/{model_id}", headers=editor_headers)
    assert res.status_code == 403

    # --- VERIFY ROLE: OWNER ---
    # Try to delete model -> Should succeed (204)
    res = await client.delete(f"/api/v1/optimization/models/{model_id}", headers=owner_headers)
    assert res.status_code == 204
