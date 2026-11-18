@echo off
title Invenio AI Launcher - Production Demo Mode
echo ==========================================================================
echo Starting Invenio AI - Enterprise Inventory & Autonomous Supply Chain Agents
echo ==========================================================================
echo Mode: Pre-Compiled Production Build (Instant Zero-Lag Navigation)
echo.

echo Freeing ports 8000 and 3000 if already in use...
for /f "tokens=5" %%a in ('netstat -aon ^| findstr :8000 ^| findstr LISTENING') do taskkill /F /PID %%a >nul 2>&1
for /f "tokens=5" %%a in ('netstat -aon ^| findstr :3000 ^| findstr LISTENING') do taskkill /F /PID %%a >nul 2>&1
timeout /t 1 /nobreak >nul

echo [1/2] Starting FastAPI Agentic Backend on http://localhost:8000...
start "Invenio AI Backend" cmd /k "cd /d %~dp0 && python api_server.py"

timeout /t 2 /nobreak >nul

echo [2/2] Starting Pre-Compiled Next.js Production Server on http://localhost:3000...
start "Invenio AI Frontend" cmd /k "cd /d %~dp0\frontend && npm run start"

timeout /t 3 /nobreak >nul
echo Both services are live! Opening browser at http://localhost:3000...
start http://localhost:3000
