@echo off
cd /d %~dp0
title Sistema de Registro Digital
color 0A
cls

echo.
echo ============================================================
echo   SISTEMA DE REGISTRO DIGITAL
echo   Escuela Interamericana
echo ============================================================
echo.

echo Verificando Node.js...
node --version >nul 2>&1
if errorlevel 1 (
    color 0C
    echo.
    echo ERROR: Node.js NO esta instalado
    echo.
    echo Necesitas instalar Node.js (NO XAMPP)
    echo.
    echo 1. Ve a: https://nodejs.org/
    echo 2. Descarga la version LTS (boton verde)
    echo 3. Instala y marca "Add to PATH"
    echo 4. Vuelve a ejecutar este archivo
    echo.
    set /p abrir="Abrir pagina de descarga? (S/N): "
    if /i "%abrir%"=="S" start https://nodejs.org/
    echo.
    pause
    exit /b 1
)

echo OK: Node.js encontrado
node --version
echo.

echo Verificando npm...
npm --version >nul 2>&1
if errorlevel 1 (
    color 0C
    echo ERROR: npm no encontrado
    pause
    exit /b 1
)
echo OK: npm encontrado
npm --version
echo.

echo Instalando dependencias (si es necesario)...
if not exist "node_modules" (
    echo Esto puede tardar unos minutos...
    call npm install
    if errorlevel 1 (
        color 0C
        echo ERROR al instalar dependencias
        pause
        exit /b 1
    )
) else (
    echo Dependencias ya instaladas
)
echo.

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
echo El servidor se ha detenido.
pause
