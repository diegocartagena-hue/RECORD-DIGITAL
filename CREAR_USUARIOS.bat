@echo off
cd /d %~dp0
title Crear Usuarios
color 0B
cls

echo.
echo ============================================================
echo   CREANDO USUARIOS DE PRUEBA
echo ============================================================
echo.

node crear_usuarios.js

if errorlevel 1 (
    color 0C
    echo.
    echo ERROR al crear usuarios
    echo.
) else (
    color 0A
    echo.
    echo Usuarios creados correctamente
    echo.
)

pause




