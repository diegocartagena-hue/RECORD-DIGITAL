@echo off
cd /d %~dp0
title Limpiar e Instalar Dependencias
color 0E
cls

echo.
echo ============================================================
echo   LIMPIANDO E INSTALANDO DEPENDENCIAS
echo ============================================================
echo.

echo [1] Eliminando node_modules...
if exist "node_modules" (
    echo    Eliminando carpeta node_modules...
    rmdir /s /q node_modules
    echo    OK: Carpeta eliminada
) else (
    echo    OK: No existe
)

echo.
echo [2] Eliminando package-lock.json...
if exist "package-lock.json" (
    del /q package-lock.json
    echo    OK: Archivo eliminado
) else (
    echo    OK: No existe
)

echo.
echo [3] Instalando dependencias...
echo    Esto puede tardar varios minutos...
echo    Por favor espera...
echo.

call npm install

if errorlevel 1 (
    color 0C
    echo.
    echo ============================================================
    echo   ERROR AL INSTALAR
    echo ============================================================
    echo.
    echo Revisa los mensajes de error arriba
    pause
    exit /b 1
)

color 0A
echo.
echo ============================================================
echo   INSTALACION COMPLETADA
echo ============================================================
echo.
echo Ahora puedes ejecutar: INICIAR_SIMPLE.bat
echo O desde terminal: npm start
echo.
pause






