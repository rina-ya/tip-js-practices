@echo off
chcp 65001 >nul
cd /d "%~dp0"
node "..\tools\open-practice.mjs" 05
set "practice_exit=%errorlevel%"
echo.
pause
exit /b %practice_exit%
