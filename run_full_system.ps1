Write-Host "==========================================================================" -ForegroundColor Cyan
Write-Host "Starting Invenio AI — Unified Enterprise Inventory & Agentic AI System" -ForegroundColor Green
Write-Host "==========================================================================" -ForegroundColor Cyan

$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path

# 1. Start FastAPI Agentic Backend
Write-Host "`n[1/2] Starting FastAPI Agentic Backend on http://localhost:8000..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "Set-Location '$ScriptDir'; python -m uvicorn api_server:app --reload --port 8000"

# 2. Start Next.js Enterprise Frontend
Write-Host "[2/2] Starting Next.js Enterprise Frontend on http://localhost:3000..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "Set-Location '$ScriptDir\frontend'; npm run dev"

Start-Sleep -Seconds 3
Write-Host "`n[OK] Both services launched successfully!" -ForegroundColor Green
Write-Host "Backend API Docs: http://localhost:8000/docs" -ForegroundColor White
Write-Host "Next.js Web App:  http://localhost:3000" -ForegroundColor White
Start-Process "http://localhost:3000"
