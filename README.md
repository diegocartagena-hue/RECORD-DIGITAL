# Sistema de Registro Digital - Escuela Interamericana

Sistema web para llevar el registro de anotaciones disciplinarias de estudiantes.

## Tecnologías

- **Backend**: Node.js + Express
- **Frontend**: JavaScript (Vanilla) + HTML + CSS
- **Base de datos**: SQLite (better-sqlite3)
- **Tiempo real**: Socket.io
- **Estilos**: CSS Responsive

## Instalación

### 1. Instalar Node.js

Descarga e instala Node.js desde: https://nodejs.org/
- Versión recomendada: 18.x o superior
- Durante la instalación, marca "Add to PATH"

### 2. Instalar dependencias

```bash
npm install
```

### 3. Ejecutar el servidor

```bash
npm start
```

O simplemente:
```bash
node server.js
```

El servidor estará disponible en: **http://localhost:5000**

## Usuarios por Defecto

**Administrador:**
- Email: `admin@interamericana.edu`
- Contraseña: `admin123`

**Coordinador:**
- Email: `coord@interamericana.edu`
- Contraseña: `coord123`

**Maestro:**
- Email: `maestro@interamericana.edu`
- Contraseña: `maestro123`

## Características

- ✅ Sistema de autenticación por roles
- ✅ Gestión de grados (1° a 12°, secciones A y B)
- ✅ Sistema de anotaciones (Leve, Grave, Muy Grave)
- ✅ Dashboard con gráficas
- ✅ Notificaciones en tiempo real
- ✅ Botón de emergencia para maestros
- ✅ Importación masiva de estudiantes (Excel)
- ✅ Exportación de base de datos
- ✅ Diseño responsive (PC, laptop, tablet, móvil)

## Estructura del Proyecto

```
RECORD-DIGITAL/
├── server.js              # Servidor principal
├── database.js            # Configuración de base de datos
├── auth.js                # Autenticación y autorización
├── package.json           # Dependencias
├── static/
│   ├── css/
│   │   └── style.css      # Estilos responsive
│   └── js/
│       ├── main.js        # JavaScript principal
│       ├── dashboard.js   # Lógica del dashboard
│       └── charts.js      # Gráficas
├── templates/
│   ├── login.html         # Página de login
│   └── dashboard.html     # Dashboard principal
└── database/
    └── records.db         # Base de datos SQLite
```

## Colores del Sistema

- **Azul oscuro**: #1a237e (Principal)
- **Blanco**: #ffffff (Fondo)
- **Rojo**: #d32f2f (Acentos, emergencias)

## Licencia

MIT
