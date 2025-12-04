@echo off
cd /d %~dp0
title Reiniciar Servidor
color 0C

echo.
echo ============================================================
echo   DETENIENDO SERVIDOR ANTERIOR
echo ============================================================
echo.

taskkill /F /IM node.exe >nul 2>&1
if errorlevel 1 (
    echo No hay servidores corriendo
) else (
    echo Servidor anterior detenido
)

timeout /t 2 >nul

echo.
echo ============================================================
echo   INICIANDO SERVIDOR NUEVO
echo ============================================================
echo.

start "Servidor - Sistema de Registro Digital" cmd /k "cd /d %~dp0 && npm start"

timeout /t 3 >nul

echo.
echo ============================================================
echo   VERIFICANDO SERVIDOR
echo ============================================================
echo.

netstat -an | findstr ":5000" >nul
if errorlevel 1 (
    echo ERROR: El servidor no esta corriendo
    echo.
    echo Revisa la ventana del servidor para ver errores
) else (
    echo OK: El servidor esta corriendo
    echo.
    echo Puedes acceder en:
    echo   http://localhost:5000
)

echo.
pause






