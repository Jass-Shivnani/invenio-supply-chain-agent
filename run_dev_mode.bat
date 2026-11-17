@echo off
title Invenio AI Launcher - Hot-Reload Development Mode
echo ==========================================================================
echo Starting Invenio AI in Hot-Reload Development Mode
echo ==========================================================================
start "Invenio AI Backend" cmd /k "cd /d %~dp0 && python -m uvicorn api_server:app --reload --port 8000"
timeout /t 2 /nobreak >nul
start "Invenio AI Frontend (Dev)" cmd /k "cd /d %~dp0\frontend && npm run dev"
timeout /t 3 /nobreak >nul
start http://localhost:3000
