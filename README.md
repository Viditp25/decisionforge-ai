# DecisionForge AI

DecisionForge AI is an enterprise-grade Decision Intelligence Platform designed to solve complex logistics routing and resource allocation challenges by combining deterministic solvers with a generative AI explanation layer.

---

## 📋 Table of Contents
1. [Project Overview](#-project-overview)
2. [Problem Statement & Proposed Solution](#-problem-statement--proposed-solution)
3. [Architecture Overview](#-architecture-overview)
4. [Key Features](#-key-features)
5. [Technology Stack](#-technology-stack)
6. [Installation](#-installation)
7. [Local Development](#-local-development)
8. [Docker Deployment](#-docker-deployment)
9. [API Documentation](#-api-documentation)
10. [Authentication](#-authentication)
11. [AI Explanation Module](#-ai-explanation-module)
12. [Screenshots](#-screenshots)
13. [Demo walk](#-demo-walk)
14. [Future Scope](#-future-scope)
15. [License](#-license)

---

## 🌟 Project Overview
DecisionForge AI integrates operations research solvers and generative language models into a unified decision dashboard. Rather than asking LLMs to compute mathematics (which they struggle to perform reliably), the platform relies on deterministic algorithms to solve optimal routes or resource allocations and utilizes generative AI to translate raw output vectors into natural, human-readable operational summaries.

---

## 💔 Problem Statement & Proposed Solution

### The Problem
Operational planning—such as fleet vehicle routing (VRP) or cargo packing—is traditionally solved using mathematical programming. However, traditional solvers act as "black boxes." They output raw matrices, variables, and coordinate schedules that are difficult for business managers and logistics dispatchers to interpret. This creates a critical trust gap. On the other hand, relying on generative AI chatbots to plan operations is highly risky due to their tendency to hallucinate invalid values and math.

### The Solution
DecisionForge AI bridges this gap with a **hybrid intelligence pipeline**:
1. **Deterministic Solvers** handle the mathematical heavy-lifting. They run graph optimizations (Vehicle Routing Problems via Google OR-Tools) or probability trials (Monte Carlo simulations).
2. **Generative LLMs** act as business advisors. They translate solver outputs, objective values, and binding constraint metrics into conversational, contextual reports (e.g., explaining why a vehicle route was shortened or which capacity boundaries were reached).

---

## 🏗️ Architecture Overview
The codebase follows **Clean Architecture** principles, enforcing separation of concerns between raw mathematical logic, database repositories, business service handlers, and FastAPI controllers.

```mermaid
graph TD
    Client[React Frontend] -->|HTTP / JSON| API[FastAPI Controllers]
    API -->|Dependencies| Repositories[SQLAlchemy Data Repositories]
    API -->|Core Handlers| Services[Business Services]
    Services -->|OR-Tools Solver| OptEngine[Vehicle Routing Engine]
    Services -->|Monte Carlo Sim| SimEngine[Simulation Engine]
    Services -->|OpenAI SDK| AIEngine[AI Explanation Layer]
    Repositories -->|Asyncpg Connection| PostgreSQL[(PostgreSQL + pgvector)]
```

---

## 🛠️ Key Features
- **Secure Authentication**: JWT token exchange alongside Google OAuth 2.0 Single Sign-On (SSO).
- **Role-Based Access Control (RBAC)**: Clear permissions (`Owner`, `Admin`, `Editor`, `Viewer`) enforced both on backend endpoints and frontend control views.
- **VRP Optimization**: powered by Google OR-Tools to solve vehicle routing paths minimizing total distance and respecting capacity limits.
- **Monte Carlo Simulations**: Probabilistic trials to evaluate risk distributions for knapsack capacities and bounds.
- **AI Explanation Engine**: Natural language translations of solver metrics using OpenAI GPT-4o (with local offline mock fallback).
- **Glassmorphic Analytics Dashboard**: High-fidelity dark theme dashboard showing real-time solver executions, system latencies, and AI decision cards.

---

## 💻 Technology Stack

### Backend
- **Framework**: FastAPI (Python 3.11+)
- **Solvers**: Google OR-Tools, Monte Carlo Simulator
- **ORM & Database**: SQLAlchemy 2.0 (Async), SQLite (Development), PostgreSQL (Production)
- **AI Engine**: OpenAI Python SDK
- **Queue/Cache**: Redis & Celery

### Frontend
- **Framework**: React + TypeScript (Vite bundler)
- **Styling**: Pure CSS (Custom glassmorphic dark theme)
- **Icons & Charts**: Lucide React, Recharts

---

## 💾 Installation

Ensure you have Python 3.11+ and Node.js 18+ installed on your system.

### Backend Setup
1. Navigate to the backend directory:
   ```bash
   cd backend
   ```
2. Create and activate a virtual environment:
   ```bash
   python -m venv .venv
   # On Windows (PowerShell)
   .\.venv\Scripts\Activate.ps1
   # On Linux/macOS
   source .venv/bin/activate
   ```
3. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```

### Frontend Setup
1. Navigate to the frontend directory:
   ```bash
   cd ../frontend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```

---

## ⚙️ Local Development

To run the complete platform locally on Windows using SQLite:
1. Initialize the environment configuration. Duplicate `.env.example` as `.env` in the project root:
   ```bash
   copy .env.example .env
   ```
2. Run the local launcher script from the root directory:
   ```powershell
   .\run_local.ps1
   ```
   *The launcher will launch the FastAPI server (`http://localhost:8000`) and the Vite dev server (`http://localhost:3000`) in separate processes.*

---

## 🐳 Docker Deployment

To boot up the complete multi-container production stack (PostgreSQL, Redis, backend, and frontend containers):
1. In the project root, run:
   ```bash
   docker-compose up --build
   ```
2. Once active, access the resources at:
   - **Frontend Dashboard**: `http://localhost:3000`
   - **FastAPI API Server**: `http://localhost:8000`

---

## 📄 API Documentation
The backend automatically compiles interactive OpenAPI schemas:
- **Swagger UI**: [http://localhost:8000/docs](http://localhost:8000/docs) (best for triggering and inspecting endpoints interactively)
- **ReDoc**: [http://localhost:8000/redoc](http://localhost:8000/redoc) (clean, organized documentation)

---

## 🔑 Authentication
Authentication is secured using two pathways:
1. **Local Authentication**: Uses standard credentials (email and password) to exchange JWT tokens. These tokens are stored securely in local storage and appended as a `Bearer` token to the `Authorization` header of subsequent requests.
2. **Google OAuth 2.0**: Scaffolded for Single Sign-On (SSO) login.

Both pathways inject user claims into the backend FastAPI dependency injection pipeline (`get_current_user`), enforcing granular RBAC roles (`Owner`, `Admin`, `Editor`, `Viewer`).

---

## 🤖 AI Explanation Module

DecisionForge AI supports two execution modes for compiling solver descriptions:

### 1. Offline Mock Mode (Default)
- **Trigger**: Activated when `OPENAI_API_KEY` is omitted or set to its default value `"mock-key"`.
- **Behavior**: Generates structured, high-fidelity Markdown decision reports locally using deterministic templates. This mode runs instantly, offline, and does not charge any API credits.
- **Purpose**: Zero-dependency quickstart for local testing and hackathon evaluations.

### 2. Live OpenAI Mode
- **Trigger**: Activated by adding a valid `OPENAI_API_KEY` to the `.env` file.
- **Behavior**: The backend initializes the `AsyncOpenAI` client and calls the **`gpt-4o`** completion API, sending the system prompt template and raw solver payload.
- **Graceful Fallback**: If the API call fails due to invalid credentials, network issues, or quota exhaustion, the engine catches the exception and appends the error details to the local mock markdown report, ensuring the UI remains active and stable.

---

## 📸 Screenshots
The platform features a modern, responsive, glassmorphic UI designed for dark mode:
- **Dashboard View**: Shows KPIs, recent executions, and a Recharts timeline charting active solver latencies.
- **Models View**: Interactive forms to configure constraints and parameters.
- **Executions View**: Real-time polling list showing active runs, their objective values, and a details modal hosting the AI-generated markdown explanation.

*Place visual mockups and dashboard captures in the `docs/assets/` directory.*

---

## 🎬 Demo Walk

Follow these steps to demonstrate the platform's core workflow:
1. **Sign Up / Login**: Register a new user profile. Upon submission, the platform auto-provisions a workspace organization.
2. **Datasets Config**: Select a pre-built template dataset (e.g. VRP routing nodes or Monte Carlo trial bounds).
3. **Model Constraints**: Create a model and configure variables (e.g. vehicle count to `3` and capacity limit to `15`).
4. **Trigger Run**: Click "Trigger Solver Run" in the Executions panel. The UI will poll the backend in real-time until the status turns to `SUCCESS`.
5. **Inspect AI Explanation**: Click **Inspect** on the successful run row. The details modal will slide open, presenting the optimal path calculations alongside the AI Decision Explanation translating the objective value and limits.

---

## 🔮 Future Scope
- **Websocket Streaming**: Live logs streamed from Celery worker nodes directly to the dashboard terminal.
- **Leaflet Map Visualizations**: Interactive routing simulations displaying vehicles traversing graph nodes on a map.
- **Multi-Scenario Branching**: Side-by-side comparison of different solver parameters to evaluate optimal outcomes under different risk tolerances.

---

---

## 🚀 Production Deployment (Render Free Tier)

DecisionForge AI is production-ready and configured to be deployed on **Render** completely for free using the provided **`render.yaml`** Blueprint.

### 📦 Services Provisioned:
1.  **FastAPI Backend**: Deployed as a Free Docker Web Service.
2.  **React Frontend**: Deployed as a Free Static Site (Vite) with CDN distribution.

---

### 1. Database Provisioning (Neon PostgreSQL)
Since Render's free PostgreSQL tier expires after 90 days, we recommend using **[Neon.tech](https://neon.tech/)** for a permanent, free PostgreSQL instance:
1.  Sign up for a free account at [Neon](https://neon.tech/).
2.  Create a project and database (e.g., `decisionforge`).
3.  Copy the connection string (it will look like `postgresql://alex:password@ep-cool-snowflake-123456.us-east-2.aws.neon.tech/decisionforge?sslmode=require`).
4.  No manual table creation or migration is needed! The backend automatically creates database mappers and tables on startup.

---

### 2. Render One-Click Deployment
1.  Push this repository to your GitHub account.
2.  Go to the **[Render Dashboard](https://dashboard.render.com)**.
3.  Click **New** (top right) and select **Blueprint**.
4.  Connect your GitHub repository.
5.  Render will automatically parse the **`render.yaml`** blueprint from the repository root.
6.  Fill in the required blueprint parameters:
    *   `DATABASE_URL`: Paste your Neon connection string. (The backend will automatically convert it to async `postgresql+asyncpg://` compatibility at runtime).
    *   `JWT_SECRET`: Leave blank (Render will auto-generate a secure random key).
    *   `BACKEND_CORS_ORIGINS`: Set to `*` or the public URL of your frontend static site.
    *   `OPENAI_API_KEY`: Set your OpenAI key, or use `mock-key` for offline template fallback.
7.  Click **Approve** to deploy both the backend and frontend services!

---

## 📄 License
This project is licensed under the terms of the [MIT License](LICENSE).
