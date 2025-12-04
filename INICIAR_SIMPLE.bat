@echo off
cd /d %~dp0
title Servidor - Sistema de Registro Digital
color 0A

echo.
echo ============================================================
echo   INICIANDO SERVIDOR
echo ============================================================
echo.
echo Instalando dependencias (si es necesario)...
call npm install
echo.
echo ============================================================
echo   SERVIDOR INICIANDO
echo ============================================================
echo.
echo El servidor estara disponible en:
echo   http://localhost:5000
echo.
echo Presiona Ctrl+C para detener
echo.
echo ============================================================
echo.

node server.js

echo.
echo Servidor detenido.
pause







