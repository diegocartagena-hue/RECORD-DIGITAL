@echo off
cd /d %~dp0
title Solucion Completa - Sistema de Registro Digital
color 0A
cls

echo.
echo ============================================================
echo   SOLUCION COMPLETA
echo ============================================================
echo.

echo [Paso 1] Verificando Node.js...
node --version >nul 2>&1
if errorlevel 1 (
    color 0C
    echo    ERROR: Node.js no encontrado
    echo    Instala Node.js desde: https://nodejs.org/
    pause
    exit /b 1
)
echo    OK: Node.js encontrado
node --version

echo.
echo [Paso 2] Verificando npm...
npm --version >nul 2>&1
if errorlevel 1 (
    color 0C
    echo    ERROR: npm no encontrado
    pause
    exit /b 1
)
echo    OK: npm encontrado
npm --version

echo.
echo [Paso 3] Eliminando node_modules anterior (si existe)...
if exist "node_modules" (
    echo    Eliminando carpeta node_modules...
    rmdir /s /q node_modules >nul 2>&1
    echo    OK: Carpeta eliminada
) else (
    echo    OK: No hay carpeta anterior
)

echo.
echo [Paso 4] Eliminando package-lock.json (si existe)...
if exist "package-lock.json" (
    del /q package-lock.json >nul 2>&1
    echo    OK: Archivo eliminado
)

echo.
color 0E
echo [Paso 5] Instalando dependencias...
echo    Esto puede tardar varios minutos...
echo    Por favor espera...
echo.
call npm install

if errorlevel 1 (
    color 0C
    echo.
    echo ============================================================
    echo   ERROR AL INSTALAR DEPENDENCIAS
    echo ============================================================
    echo.
    echo Revisa los mensajes de error arriba
    pause
    exit /b 1
)

color 0A
echo.
echo ============================================================
echo   DEPENDENCIAS INSTALADAS CORRECTAMENTE
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
echo Presiona Ctrl+C para detener el servidor
echo.
echo ============================================================
echo.

node server.js

echo.
echo Servidor detenido.
pause

