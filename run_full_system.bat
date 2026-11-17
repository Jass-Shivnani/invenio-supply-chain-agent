@echo off
title Invenio AI Launcher - Production Demo Mode
echo ==========================================================================
echo Starting Invenio AI - Enterprise Inventory & Autonomous Supply Chain Agents
echo ==========================================================================
echo Mode: Pre-Compiled Production Build (Instant Zero-Lag Navigation)
echo.

echo [1/2] Starting FastAPI Agentic Backend on http://localhost:8000...
start "Invenio AI Backend" cmd /k "cd /d %~dp0 && python -m uvicorn api_server:app --port 8000"

timeout /t 2 /nobreak >nul

echo [2/2] Starting Pre-Compiled Next.js Production Server on http://localhost:3000...
start "Invenio AI Frontend (Compiled Production)" cmd /k "cd /d %~dp0\frontend && npm run start"

timeout /t 3 /nobreak >nul
echo Both services are live! Opening browser at http://localhost:3000...
start http://localhost:3000
