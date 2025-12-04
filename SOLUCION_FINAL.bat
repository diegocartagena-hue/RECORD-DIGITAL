@echo off
cd /d %~dp0
title Solucion Final - Instalar e Iniciar
color 0A
cls

echo.
echo ============================================================
echo   SOLUCION FINAL
echo ============================================================
echo.
echo Se cambio de better-sqlite3 a sqlite3
echo para evitar problemas de compilacion.
echo.
echo [1] Eliminando node_modules...
if exist "node_modules" (
    rmdir /s /q node_modules
    echo    OK: Eliminado
) else (
    echo    OK: No existe
)

echo.
echo [2] Eliminando package-lock.json...
if exist "package-lock.json" (
    del /q package-lock.json
    echo    OK: Eliminado
)

echo.
echo [3] Instalando dependencias con sqlite3...
echo    Esto puede tardar varios minutos...
echo.
call npm install

if errorlevel 1 (
    color 0C
    echo.
    echo ERROR al instalar dependencias
    pause
    exit /b 1
)

color 0A
echo.
echo ============================================================
echo   DEPENDENCIAS INSTALADAS
echo ============================================================
echo.
timeout /t 2 >nul

color 0B
echo ============================================================
echo   INICIANDO SERVIDOR
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

pause







