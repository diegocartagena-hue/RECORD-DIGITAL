@echo off
chcp 65001 >nul
cls
echo.
echo ╔══════════════════════════════════════════════════════════╗
echo ║   INSTALACIÓN DE PYTHON                                  ║
echo ╚══════════════════════════════════════════════════════════╝
echo.
echo Python no está instalado o no está en el PATH del sistema.
echo.
echo OPCIONES:
echo.
echo 1. INSTALAR DESDE python.org (RECOMENDADO)
echo    - Ve a: https://www.python.org/downloads/
echo    - Descarga Python 3.12 o superior
echo    - IMPORTANTE: Marca "Add Python to PATH" durante la instalación
echo.
echo 2. INSTALAR DESDE MICROSOFT STORE
echo    - Abre Microsoft Store
echo    - Busca "Python 3.12"
echo    - Haz clic en Instalar
echo.
echo ═══════════════════════════════════════════════════════════
echo.
echo Después de instalar Python:
echo 1. Cierra y vuelve a abrir esta terminal
echo 2. Ejecuta: python --version (para verificar)
echo 3. Ejecuta: pip install -r requirements.txt
echo 4. Ejecuta: python app.py
echo.
echo ═══════════════════════════════════════════════════════════
echo.
echo ¿Quieres abrir la página de descarga de Python ahora?
echo.
set /p respuesta="Escribe S para abrir python.org o N para salir: "
if /i "%respuesta%"=="S" (
    start https://www.python.org/downloads/
    echo.
    echo Página abierta en el navegador.
    echo Sigue las instrucciones arriba para instalar Python.
)
echo.
pause

