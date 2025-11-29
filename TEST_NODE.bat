@echo off
echo Probando Node.js...
echo.
node --version
echo.
if errorlevel 1 (
    echo ERROR: Node.js no esta instalado
    echo.
    echo Instala Node.js desde: https://nodejs.org/
) else (
    echo Node.js esta instalado correctamente
)
echo.
echo Probando npm...
echo.
npm --version
echo.
if errorlevel 1 (
    echo ERROR: npm no encontrado
) else (
    echo npm esta instalado correctamente
)
echo.
pause

