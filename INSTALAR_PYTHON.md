# CÓMO INSTALAR PYTHON EN WINDOWS

## Opción 1: Instalar desde python.org (RECOMENDADO)

1. **Descargar Python:**
   - Ve a: https://www.python.org/downloads/
   - Haz clic en "Download Python 3.12.x" (o la versión más reciente)
   - Se descargará un archivo .exe

2. **Instalar Python:**
   - Ejecuta el archivo descargado
   - **MUY IMPORTANTE:** Marca la casilla "Add Python to PATH" antes de hacer clic en "Install Now"
   - Espera a que termine la instalación
   - Haz clic en "Close"

3. **Verificar la instalación:**
   - Abre una nueva terminal (PowerShell o CMD)
   - Ejecuta: `python --version`
   - Deberías ver algo como: `Python 3.12.x`

## Opción 2: Instalar desde Microsoft Store

1. Abre Microsoft Store
2. Busca "Python 3.12"
3. Haz clic en "Obtener" o "Instalar"
4. Espera a que termine la instalación

## DESPUÉS DE INSTALAR PYTHON

1. **Cierra y vuelve a abrir la terminal** (importante para que reconozca Python)

2. **Verifica que Python funciona:**
   ```
   python --version
   ```

3. **Instala las dependencias del proyecto:**
   ```
   cd C:\Users\User\Videos\RECORD-DIGITAL
   pip install -r requirements.txt
   ```

4. **Ejecuta el servidor:**
   ```
   python app.py
   ```

## Si Python ya está instalado pero no funciona

1. **Busca dónde está instalado Python:**
   - Normalmente está en: `C:\Users\TuUsuario\AppData\Local\Programs\Python\`
   - O en: `C:\Python3x\`

2. **Agrega Python al PATH manualmente:**
   - Presiona `Win + R`
   - Escribe: `sysdm.cpl` y presiona Enter
   - Ve a la pestaña "Opciones avanzadas"
   - Haz clic en "Variables de entorno"
   - En "Variables del sistema", busca "Path" y haz clic en "Editar"
   - Haz clic en "Nuevo" y agrega la ruta donde está Python (ej: `C:\Python312\`)
   - También agrega la carpeta Scripts (ej: `C:\Python312\Scripts\`)
   - Haz clic en "Aceptar" en todas las ventanas
   - **Cierra y vuelve a abrir la terminal**

## Verificación rápida

Abre PowerShell o CMD y ejecuta:
```
python --version
pip --version
```

Si ambos comandos funcionan, Python está correctamente instalado.

