@echo off
cd /d %~dp0
title Instalando e Iniciando Servidor
color 0E
cls

echo.
echo ============================================================
echo   INSTALANDO DEPENDENCIAS
echo ============================================================
echo.
echo Esto puede tardar varios minutos...
echo Por favor NO cierres esta ventana.
echo.
echo ============================================================
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
    echo.
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






