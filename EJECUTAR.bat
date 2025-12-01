@echo off
cd /d %~dp0
echo.
echo ============================================================
echo   SISTEMA DE REGISTRO DIGITAL
echo ============================================================
echo.
echo Verificando Node.js...
node --version
if errorlevel 1 (
    echo.
    echo ERROR: Node.js no esta instalado
    echo.
    echo Instala Node.js desde: https://nodejs.org/
    echo IMPORTANTE: Marca "Add to PATH"
    echo.
    pause
    exit
)
echo.
echo Verificando npm...
npm --version
if errorlevel 1 (
    echo.
    echo ERROR: npm no encontrado
    pause
    exit
)
echo.
echo Instalando dependencias...
npm install
if errorlevel 1 (
    echo.
    echo ERROR al instalar dependencias
    pause
    exit
)
echo.
echo ============================================================
echo   INICIANDO SERVIDOR
echo ============================================================
echo.
echo El servidor estara disponible en:
echo http://localhost:5000
echo.
echo Presiona Ctrl+C para detener el servidor
echo.
echo ============================================================
echo.
node server.js
pause




