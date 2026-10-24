@echo off
title BlocoCraft - Servidor local
cd /d "%~dp0"
where py >nul 2>nul
if %errorlevel%==0 (
  start "" http://localhost:8000/
  py -m http.server 8000 --bind 127.0.0.1
  goto fim
)
where python >nul 2>nul
if %errorlevel%==0 (
  start "" http://localhost:8000/
  python -m http.server 8000 --bind 127.0.0.1
  goto fim
)
echo Python nao foi encontrado. Instale Python 3 e marque "Add Python to PATH".
pause
:fim
