@echo off
title Verificar e Iniciar Servidor
color 0A
cls

echo.
echo ============================================================
echo   VERIFICACION E INICIO DEL SERVIDOR
echo ============================================================
echo.

echo [1] Verificando Node.js...
where node >nul 2>&1
if errorlevel 1 (
    echo    ERROR: Node.js no encontrado
    echo.
    echo    Instala Node.js desde: https://nodejs.org/
    echo    IMPORTANTE: Marca "Add to PATH"
    echo.
    pause
    exit /b 1
)
echo    OK: Node.js encontrado
node --version

echo.
echo [2] Verificando npm...
where npm >nul 2>&1
if errorlevel 1 (
    echo    ERROR: npm no encontrado
    pause
    exit /b 1
)
echo    OK: npm encontrado
npm --version

echo.
echo [3] Instalando dependencias...
if not exist "node_modules" (
    echo    Instalando (esto puede tardar unos minutos)...
    call npm install
    if errorlevel 1 (
        echo    ERROR al instalar dependencias
        pause
        exit /b 1
    )
) else (
    echo    Dependencias ya instaladas
)

echo.
echo [4] Iniciando servidor...
echo.
echo ============================================================
echo   SERVIDOR INICIANDO
echo ============================================================
echo.
echo   El servidor estara disponible en:
echo   http://localhost:5000
echo.
echo   Presiona Ctrl+C para detener el servidor
echo.
echo ============================================================
echo.

node server.js

if errorlevel 1 (
    echo.
    echo ERROR: El servidor no pudo iniciarse
    echo Revisa los mensajes de error arriba
    echo.
)

pause






