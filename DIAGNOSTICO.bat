@echo off
title Diagnostico del Sistema
color 0E
cls

echo.
echo ============================================================
echo   DIAGNOSTICO DEL SISTEMA
echo ============================================================
echo.

echo [1] Verificando Node.js...
node --version 2>nul
if errorlevel 1 (
    echo    ERROR: Node.js NO encontrado
    echo.
    echo    Necesitas instalar Node.js desde:
    echo    https://nodejs.org/
    echo.
    echo    IMPORTANTE: Marca "Add to PATH" durante la instalacion
    echo.
    goto :fin
) else (
    echo    OK: Node.js encontrado
)

echo.
echo [2] Verificando npm...
npm --version 2>nul
if errorlevel 1 (
    echo    ERROR: npm NO encontrado
    echo    (npm viene con Node.js, reinstala Node.js)
    goto :fin
) else (
    echo    OK: npm encontrado
)

echo.
echo [3] Verificando archivos del proyecto...
if exist "server.js" (
    echo    OK: server.js encontrado
) else (
    echo    ERROR: server.js NO encontrado
    goto :fin
)

if exist "package.json" (
    echo    OK: package.json encontrado
) else (
    echo    ERROR: package.json NO encontrado
    goto :fin
)

echo.
echo [4] Verificando dependencias...
if exist "node_modules" (
    echo    OK: node_modules existe
) else (
    echo    ADVERTENCIA: node_modules NO existe
    echo    Necesitas ejecutar: npm install
)

echo.
echo ============================================================
echo   DIAGNOSTICO COMPLETADO
echo ============================================================
echo.

:fin
echo.
echo Presiona cualquier tecla para cerrar esta ventana...
pause >nul
