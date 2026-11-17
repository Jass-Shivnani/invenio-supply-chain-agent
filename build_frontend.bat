@echo off
title Invenio AI Frontend Compiler
echo ==========================================================================
echo Compiling Invenio Next.js Frontend for Production
echo ==========================================================================
cd /d %~dp0\frontend
npm run build
echo.
echo Build complete! Run run_full_system.bat to start the pre-compiled system.
pause
