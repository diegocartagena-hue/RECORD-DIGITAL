@echo off
chcp 65001 >nul
title Instalar Node.js
color 0B
cls

echo.
echo ╔══════════════════════════════════════════════════════════╗
echo ║   INSTALACIÓN DE NODE.JS                                 ║
echo ╚══════════════════════════════════════════════════════════╝
echo.
echo Node.js es necesario para ejecutar este sistema.
echo.
echo ═══════════════════════════════════════════════════════════
echo   INSTRUCCIONES
echo ═══════════════════════════════════════════════════════════
echo.
echo 1. Se abrirá la página de descarga de Node.js
echo 2. Descarga la versión LTS (recomendada)
echo 3. Ejecuta el instalador
echo 4. ⚠️ IMPORTANTE: Marca "Add to PATH" durante la instalación
echo 5. Completa la instalación
echo 6. Cierra y vuelve a abrir esta ventana
echo 7. Ejecuta: DIAGNOSTICO.bat para verificar
echo.
echo ═══════════════════════════════════════════════════════════
echo.

set /p abrir="¿Abrir página de descarga ahora? (S/N): "
if /i "%abrir%"=="S" (
    echo.
    echo Abriendo https://nodejs.org/ ...
    start https://nodejs.org/
    echo.
    echo Sigue las instrucciones arriba para instalar Node.js.
    echo.
) else (
    echo.
    echo Puedes instalar Node.js manualmente desde:
    echo https://nodejs.org/
    echo.
)

pause






