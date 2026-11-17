@echo off
title Invenio AI Launcher
echo ==========================================================================
echo Starting Invenio AI - Unified Enterprise Inventory & Agentic AI System
echo ==========================================================================

echo [1/2] Starting FastAPI Agentic Backend on http://localhost:8000...
start "Invenio AI Backend" cmd /k "cd /d %~dp0 && python -m uvicorn api_server:app --reload --port 8000"

timeout /t 2 /nobreak >nul

echo [2/2] Starting Next.js Enterprise Frontend on http://localhost:3000...
start "Invenio AI Frontend" cmd /k "cd /d %~dp0\frontend && npm run dev"

timeout /t 3 /nobreak >nul
echo Both services are running! Opening browser at http://localhost:3000...
start http://localhost:3000
