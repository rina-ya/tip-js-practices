@echo off
chcp 65001 >nul
cd /d "%~dp0"
node "..\tools\open-practice.mjs" 06
if errorlevel 1 (
  pause
  exit /b 1
)
start "" "http://127.0.0.1:5506/"
