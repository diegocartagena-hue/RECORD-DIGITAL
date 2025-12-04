@echo off
title Sistema de Registro Digital - Escuela Interamericana
color 0A

echo ============================================================
echo   SISTEMA DE REGISTRO DIGITAL
echo   Escuela Interamericana
echo ============================================================
echo.

REM Verificar si Node.js está instalado
where node >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Node.js no esta instalado o no esta en el PATH
    echo.
    echo Por favor instala Node.js desde: https://nodejs.org/
    echo.
    pause
    exit /b 1
)

REM Verificar si las dependencias están instaladas
if not exist "node_modules" (
    echo [INFO] Instalando dependencias...
    echo.
    call npm install
    if %ERRORLEVEL% NEQ 0 (
        echo [ERROR] Error al instalar dependencias
        pause
        exit /b 1
    )
    echo.
)

echo [INFO] Iniciando servidor...
echo.
echo El servidor estara disponible en:
echo   - http://localhost:5000
echo   - http://127.0.0.1:5000
echo.
echo Presiona Ctrl+C para detener el servidor
echo.
echo ============================================================
echo.

REM Iniciar el servidor
node server.js

REM Si el servidor se cierra, mostrar mensaje
echo.
echo [INFO] Servidor detenido
pause
