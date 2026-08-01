# DecisionForge AI Local Runner (SQLite Fallback)
# This script runs the entire platform locally on Windows without requiring Docker.

# Set database to local SQLite file
$env:DATABASE_URL = "sqlite+aiosqlite:///decisionforge.db"
$env:ENVIRONMENT = "development"

Write-Host "=========================================" -ForegroundColor Cyan
Write-Host "      DecisionForge AI Control Tower     " -ForegroundColor Cyan
Write-Host "=========================================" -ForegroundColor Cyan

# 1. Start Backend
Write-Host "[1/2] Launching FastAPI Backend on http://127.0.0.1:8000..." -ForegroundColor Green
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd backend; .venv\Scripts\python.exe -m uvicorn app.main:app --reload --port 8000"

# 2. Start Frontend
Write-Host "[2/2] Launching Vite React Frontend on http://localhost:3000..." -ForegroundColor Green
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd frontend; npm.cmd run dev -- --port 3000"

Write-Host "-----------------------------------------" -ForegroundColor Gray
Write-Host "Both services are launching in separate windows." -ForegroundColor Yellow
Write-Host "Press any key to exit this control launcher..." -ForegroundColor Gray
Read-Host
