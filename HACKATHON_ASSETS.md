# DecisionForge AI - Hackathon Submission Assets

This document compiles all textual materials, pitch structures, slide outlines, and demo scripts required for submission.

---

## 1. Short Project Description (50–100 words)
DecisionForge AI is an enterprise-grade Decision Intelligence Platform designed to solve complex logistics routing and resource allocation challenges. By combining Google OR-Tools deterministic solver engines with a generative AI explanation layer (OpenAI GPT-4o), the platform calculates mathematically optimal decisions and explains the reasoning behind them in plain, contextual English. Built with a modern, glassmorphic React dashboard and a secure, role-based FastAPI backend, DecisionForge AI provides organizations with transparent, explainable, and scaleable operational decisions.

---

## 2. Long Project Description (300–500 words)
### The Paradigm Shift in Operations Planning
Modern logistics and operational planning are bottlenecked by legacy systems. Organizations either rely on manual, error-prone spreadsheets that fail to scale, or they turn to modern generative AI chatbots. However, chatbots struggle with deterministic logic, mathematical optimization, and structural planning, frequently "hallucinating" invalid routes or capacity constraints.

### The DecisionForge AI Solution
DecisionForge AI bridges this gap by introducing a hybrid intelligence paradigm. Rather than asking LLMs to compute mathematics, we use deterministic solvers (such as Google OR-Tools and Monte Carlo simulators) to run routing models and capacity planning. Once the solver outputs the mathematically optimal plan, an AI explanation engine (powered by OpenAI GPT-4o) ingests the constraints, inputs, and results to generate clear, contextual explanations in plain English. 

For example, instead of presenting a planner with a raw JSON route coordinate sheet, DecisionForge AI explains: *"Route 3 was shortened by 12.5 miles compared to yesterday because vehicle capacity limits on Truck B were reached, requiring Sunset District store demands to be rerouted to Depot A."*

### Enterprise-Ready Core Architecture
The platform is designed to be highly modular and secure out-of-the-box:
1.  **Fine-Grained Role-Based Access Control (RBAC)**: Users are bound to roles (`Owner`, `Admin`, `Editor`, `Viewer`) that restrict API endpoints and hide/disable write or delete functions in the UI.
2.  **Flexible Solver Engines**: Features a dual-engine design supporting both Vehicle Routing Problems (VRP) and Knapsack optimization, running alongside Monte Carlo risk scenario analysis.
3.  **Modular Storage & Templates**: Handles datasets dynamically, offering pre-built structural parameters to quickly launch optimization runs.
4.  **Premium Glassmorphic Dashboard**: A high-performance single-page app (SPA) that monitors active run execution status in real-time, displays system latencies, and hosts AI decision cards.

DecisionForge AI represents the future of trust-based operational automation, providing clear answers to not just **what** the optimal decision is, but **why**.

---

## 3. Problem Statement & Solution Overview

### Problem Statement
Logistics planners, fleet dispatchers, and warehouse managers make critical routing and packing decisions daily. Existing tools fail because:
*   Spreadsheets are static and do not optimize.
*   Black-box solvers find optimal mathematical paths but fail to explain their parameters to non-technical staff, creating a trust gap.
*   LLMs are poor at mathematical reasoning and optimization, making them unsuitable for direct scheduling.

### Solution Overview
DecisionForge AI solves this with a two-step pipeline:
1.  **Deterministic Solvers** handle the math, executing graph optimization (VRP) or probability trials (Monte Carlo).
2.  **LLMs** act as translators, converting raw vectors, constraints, and objective values into human-readable operations reports.

---

## 4. Key Features & Technology Stack

### Key Features
*   **Google OAuth & JWT**: Secure authentication with SSO login.
*   **Role-Based Access Control (RBAC)**: Restricts actions based on Viewer/Editor/Admin/Owner clearance.
*   **OR-Tools VRP Solver**: Solves vehicle routes minimizing distance and respecting capacities.
*   **Monte Carlo Simulator**: Runs probabilistic trials to model knapsack capacity risks.
*   **AI Explanation Engine**: Conversational summaries of optimization limits and outputs (powered by OpenAI GPT-4o, with a built-in offline mock generator).
*   **Glassmorphic UI**: High-fidelity dark mode dashboard with Recharts latency trends.
*   **Dockerized Stack**: One-command launch with PostgreSQL and Redis.

### Technology Stack
*   **Backend**: FastAPI, Python, Google OR-Tools, SQLAlchemy, PostgreSQL, Redis, OpenAI SDK.
*   **Frontend**: React, TypeScript, Vite, Recharts, Lucide Icons.
*   **Hosting**: Docker, Docker Compose, Nginx.

---

## 5. Innovation: Why It Matters
*   **Hybrid Intelligence**: Math is handled by solvers; explanations are handled by AI.
*   **Explainable Operations (XOps)**: Demystifies black-box models for planning dispatchers.
*   **Role Clearance integration**: Protects solver constraints in production environments.

---

## 6. Future Scope
*   **Cellular Automata / Simulation Mapping**: Live visual routing simulation on Leaflet maps.
*   **WebSocket streaming**: Live logs from Celery worker nodes.
*   **Multi-Scenario Branching**: Compare side-by-side solver parameters to choose cost routes.

---

## 7. Presentation Outline (10 Slides)

*   **Slide 1: Title & Hook**: "DecisionForge AI: The Hybrid Intelligence Platform for Explainable Logistics."
*   **Slide 2: The Core Problem**: "Why AI chatbots fail at math, and optimization solvers fail at explaining results."
*   **Slide 3: The Solution**: "Solvers compute the route. LLMs explain the reason. 100% accurate, 100% understandable."
*   **Slide 4: Key Features**: "OAuth, RBAC permissions, OR-Tools, Monte Carlo, and interactive analytics dashboard."
*   **Slide 5: Platform Demo**: "*Visual screenshot/mock showing dashboard and AI explanations modal.*"
*   **Slide 6: System Architecture**: "Vite + Nginx, FastAPI router, SQLAlchemy Async repositories, Postgres and Redis."
*   **Slide 7: Under the Hood**: "Enforcing RBAC dependencies (`require_role`) and custom SQLite JSONB compilation fallbacks."
*   **Slide 8: The Innovation**: "Why deterministic math + conversational generative explanations beat chatbots."
*   **Slide 9: Roadmap**: "SSO, WebSocket updates, AWS S3 storage, and Prometheus/Grafana monitoring."
*   **Slide 10: Conclusion**: "DecisionForge AI: Accessible, secure, and explainable decision automation. Try it today!"

---

## 8. Demo Script (2–3 Minutes)

*   **[0:00 - 0:30] Introduction**:
    *"Hi everyone, this is DecisionForge AI. Today, we're showing you how we make logistics routing and operational planning explainable. Let's start by logging in. The application is secured using standard JWT tokens alongside Google OAuth."*
*   **[0:30 - 1:00] Registration & Workspace Setup**:
    *"Upon registration, the backend automatically provisions a dedicated workspace organization and default project. If we inspect our profile, we can see we're logged in as an Owner, giving us full rights."*
*   **[1:00 - 1:30] Datasets & Models**:
    *"Next, we register our parameters in the Datasets section. We've included prepopulated VRP and Knapsack configurations to make this seamless. In the Solver Models view, we configure our boundaries, such as setting the vehicle count to 3 and capacity limit to 15."*
*   **[1:30 - 2:00] Triggering & Polling**:
    *"Now, we trigger our solver run in the Executions tab. The system immediately sets the run status to PENDING/RUNNING, polling the backend in real-time until completion. The VRP engine calculated an optimal route cost of $450.00."*
*   **[2:00 - 2:30] AI Explanation & Inspect**:
    *"If we click Inspect, our explanation modal appears. The system sent the metrics to OpenAI's GPT-4o (or generates it using our offline mock generator if the API key is not configured), translating the optimal route nodes into an operations summary explaining exactly how vehicles were loaded. If we log in as a Viewer, these create buttons are hidden, demonstrating our integrated RBAC."*
*   **[2:30 - 3:00] Conclusion**:
    *"DecisionForge AI is fully dockerized and ready. Thank you!"*

---

## 9. Submission Checklist
*   [x] Backend tests passing (pytest)
*   [x] Frontend TypeScript compiles and builds cleanly
*   [x] Docker Compose configured
*   [x] .env.example created
*   [x] README.md and PROJECT_HANDOVER.md populated
*   [x] Local launch script verified
