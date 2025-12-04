@echo off
cd /d %~dp0
title Instalando Dependencias
color 0E
cls

echo.
echo ============================================================
echo   INSTALANDO DEPENDENCIAS
echo ============================================================
echo.
echo Esto puede tardar varios minutos...
echo Por favor espera hasta que termine.
echo.
echo ============================================================
echo.

npm install

if errorlevel 1 (
    color 0C
    echo.
    echo ============================================================
    echo   ERROR AL INSTALAR DEPENDENCIAS
    echo ============================================================
    echo.
    echo Revisa los mensajes de error arriba
    echo.
) else (
    color 0A
    echo.
    echo ============================================================
    echo   DEPENDENCIAS INSTALADAS CORRECTAMENTE
    echo ============================================================
    echo.
    echo Ahora puedes ejecutar: INICIAR_SIMPLE.bat
    echo.
)

echo.
pause






