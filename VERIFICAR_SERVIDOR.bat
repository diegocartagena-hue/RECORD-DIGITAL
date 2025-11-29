@echo off
title Verificar Servidor
color 0B
cls

echo.
echo ============================================================
echo   VERIFICANDO SI EL SERVIDOR ESTA FUNCIONANDO
echo ============================================================
echo.

echo Verificando puerto 5000...
netstat -an | findstr ":5000" >nul
if errorlevel 1 (
    echo    El servidor NO esta corriendo
    echo.
    echo    Para iniciarlo, ejecuta: INICIAR.bat
    echo    O desde terminal: npm start
) else (
    echo    El servidor ESTA corriendo
    echo.
    echo    Puedes acceder en:
    echo    http://localhost:5000
    echo    http://127.0.0.1:5000
)

echo.
echo ============================================================
echo.
pause

