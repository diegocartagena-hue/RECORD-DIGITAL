# Instrucciones de Instalación y Uso

## Paso 1: Instalar Dependencias

Abre una terminal en la carpeta del proyecto y ejecuta:

```bash
pip install -r requirements.txt
```

## Paso 2: Ejecutar la Aplicación

```bash
python app.py
```

La aplicación se iniciará en: **http://localhost:5000**

## Paso 3: Iniciar Sesión

### Usuarios por Defecto:

**Administrador:**
- Email: `admin@interamericana.edu`
- Contraseña: `admin123`

**Coordinador:**
- Email: `coord@interamericana.edu`
- Contraseña: `coord123`

**Maestro:**
- Email: `maestro@interamericana.edu`
- Contraseña: `maestro123`

## Funcionalidades por Rol

### Maestro
- Crear anotaciones a estudiantes
- Ver estudiantes y sus anotaciones
- Ver gráficas de estudiantes con más anotaciones
- Solicitar asistencia de emergencia (botón flotante rojo)

### Coordinador
- Todas las funciones de maestro
- Gestionar maestros (crear/eliminar)
- Ver y resolver solicitudes de emergencia en tiempo real
- Recibir notificaciones cuando un maestro solicita ayuda

### Administrador
- Todas las funciones de coordinador
- Crear coordinadores
- Crear grados (1° a 12°, secciones A y B)
- Importar estudiantes masivamente desde Excel
- Exportar base de datos del año
- Crear nueva base de datos para el siguiente año

## Importar Estudiantes

1. Crea un archivo Excel con las columnas:
   - `student_id`: ID del estudiante
   - `full_name`: Nombre completo

2. Ve a la sección de Administración
3. Selecciona el grado
4. Sube el archivo Excel
5. Haz clic en "Importar"

## Notas

- El sistema es completamente responsive (funciona en PC, laptop, tablet, iPad, teléfono)
- Las notificaciones de emergencia son en tiempo real usando WebSockets
- Los colores del sistema son: Azul oscuro, Blanco y Rojo (Escuela Interamericana)




