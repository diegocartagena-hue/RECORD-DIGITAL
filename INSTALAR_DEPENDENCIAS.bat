@echo off
title Instalando Dependencias - Record Digital
color 0B

echo ============================================================
echo   INSTALANDO DEPENDENCIAS
echo   Sistema de Registro Digital
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

echo [INFO] Instalando dependencias del proyecto...
echo.

call npm install

if %ERRORLEVEL% EQU 0 (
    echo.
    echo ============================================================
    echo   [EXITO] Dependencias instaladas correctamente
    echo ============================================================
    echo.
    echo Ahora puedes ejecutar INICIAR_SERVIDOR.bat para iniciar
    echo el servidor.
    echo.
) else (
    echo.
    echo ============================================================
    echo   [ERROR] Error al instalar dependencias
    echo ============================================================
    echo.
)

pause
