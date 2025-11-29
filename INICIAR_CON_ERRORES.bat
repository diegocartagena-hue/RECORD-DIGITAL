@echo off
cd /d %~dp0
title Servidor - Sistema de Registro Digital
color 0A

echo.
echo ============================================================
echo   INICIANDO SERVIDOR CON LOGS DE ERROR
echo ============================================================
echo.

echo Instalando dependencias...
call npm install
echo.

echo ============================================================
echo   INICIANDO SERVIDOR
echo ============================================================
echo.
echo Si hay errores, apareceran aqui abajo:
echo.
echo ============================================================
echo.

node server.js 2>&1

echo.
echo ============================================================
echo   SERVIDOR DETENIDO
echo ============================================================
echo.
pause

