// Variables globales
let currentUser = null;
let socket = null;

// Inicialización cuando el DOM está listo
document.addEventListener('DOMContentLoaded', function() {
    // Inicializar tema
    initTheme();
    
    // Verificar si estamos en la página de login o dashboard
    if (document.getElementById('loginForm')) {
        initLogin();
    } else if (document.getElementById('dashboardPage')) {
        initDashboard();
    }
});

// ==================== SISTEMA DE TEMAS ====================
function initTheme() {
    // Obtener tema guardado o usar el preferido del sistema
    const savedTheme = localStorage.getItem('theme');
    const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    const theme = savedTheme || systemTheme;
    
    // Aplicar tema
    document.documentElement.setAttribute('data-theme', theme);
    updateThemeIcon(theme);
    
    // Listener para cambios en la preferencia del sistema
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
        if (!localStorage.getItem('theme')) {
            const newTheme = e.matches ? 'dark' : 'light';
            document.documentElement.setAttribute('data-theme', newTheme);
            updateThemeIcon(newTheme);
        }
    });
    
    // Toggle del tema
    const themeToggle = document.getElementById('themeToggle');
    if (themeToggle) {
        themeToggle.addEventListener('click', (e) => {
            e.preventDefault();
            toggleTheme();
        });
    }
}

function toggleTheme() {
    const currentTheme = document.documentElement.getAttribute('data-theme');
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    
    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem('theme', newTheme);
    updateThemeIcon(newTheme);
}

function updateThemeIcon(theme) {
    const themeIcon = document.getElementById('themeIcon');
    if (!themeIcon) return;
    
    if (theme === 'dark') {
        // Icono de luna para modo oscuro
        themeIcon.innerHTML = `
            <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>
        `;
    } else {
        // Icono de sol para modo claro
        themeIcon.innerHTML = `
            <circle cx="12" cy="12" r="5"></circle>
            <line x1="12" y1="1" x2="12" y2="3"></line>
            <line x1="12" y1="21" x2="12" y2="23"></line>
            <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line>
            <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line>
            <line x1="1" y1="12" x2="3" y2="12"></line>
            <line x1="21" y1="12" x2="23" y2="12"></line>
            <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line>
            <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line>
        `;
    }
}

// ==================== LOGIN ====================
function initLogin() {
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', handleLogin);
    }
}

async function handleLogin(e) {
    e.preventDefault();
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;

    try {
        const response = await fetch('/api/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ email, password })
        });

        const data = await response.json();

        if (data.success) {
            window.location.href = '/';
        } else {
            showNotification(data.error || 'Credenciales inválidas', 'error');
        }
    } catch (error) {
        showNotification('Error de conexión. Intente nuevamente.', 'error');
    }
}

// ==================== DASHBOARD ====================
function initDashboard() {
    // Verificar autenticación
    checkAuth();
    
    // Inicializar WebSocket
    initWebSocket();
    
    // Inicializar navegación
    initNavigation();
    
    // Cargar datos del usuario
    loadUserData();
    
    // Cargar dashboard inicial
    loadDashboard();
    
    // Inicializar logout
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', handleLogout);
    }
}

async function checkAuth() {
    try {
        const response = await fetch('/api/grades');
        if (response.status === 401) {
            window.location.href = '/';
        }
    } catch (error) {
        console.error('Error verificando autenticación:', error);
    }
}

function initWebSocket() {
    socket = io({
        transports: ['websocket', 'polling'],
        reconnection: true,
        reconnectionDelay: 1000,
        reconnectionAttempts: 5
    });
    
    socket.on('connect', () => {
        console.log('✅ Conectado al servidor WebSocket, ID:', socket.id);
        joinRoomsIfNeeded();
    });
    
    socket.on('connect_error', (error) => {
        console.error('❌ Error de conexión WebSocket:', error);
    });
    
    socket.on('disconnect', (reason) => {
        console.log('⚠️ Desconectado del servidor WebSocket:', reason);
    });
    
    socket.on('reconnect', (attemptNumber) => {
        console.log('🔄 Reconectado al servidor WebSocket después de', attemptNumber, 'intentos');
        joinRoomsIfNeeded();
    });
    
    socket.on('joined_room', (data) => {
        console.log('✅ Unido a la sala:', data.room);
    });
    
    socket.on('emergency_request', (data) => {
        console.log('🚨 Alerta de emergencia recibida:', data);
        
        // Verificar si el usuario actual es coordinador o admin
        if (currentUser && (currentUser.role === 'coordinator' || currentUser.role === 'admin')) {
            const gradeInfo = data.grade_number && data.section 
                ? `${data.grade_number}° ${data.section}` 
                : `grado ${data.grade_id}`;
            
            // Reproducir alarma sonora (especialmente para administradores)
            if (currentUser.role === 'admin') {
                playEmergencyAlarm();
            }
            
            // Mostrar notificación persistente
            showPersistentEmergencyNotification(data, gradeInfo);
            
            // Mostrar alerta del navegador si está permitido
            if (Notification.permission === 'granted') {
                new Notification('🚨 EMERGENCIA', {
                    body: `${data.teacher} necesita asistencia urgente en ${gradeInfo}`,
                    icon: '/images/emergency.png',
                    tag: 'emergency-' + data.request_id,
                    requireInteraction: true,
                    badge: '/images/emergency.png'
                });
            }
            
            // Recargar solicitudes de emergencia si estamos en esa página
            const emergencyPage = document.getElementById('emergencyPage');
            if (emergencyPage && emergencyPage.classList.contains('active')) {
                loadEmergencyRequests();
            }
            
            // Actualizar contador de emergencias en el dashboard
            if (typeof loadDashboardStats === 'function') {
                loadDashboardStats();
            }
        }
    });
    
    socket.on('emergency_status_update', (data) => {
        console.log('Actualización de estado de emergencia:', data);
        if (typeof loadEmergencyRequests === 'function') {
            loadEmergencyRequests();
        }
    });
    
    // Función para unirse a las salas según el rol
    function joinRoomsIfNeeded() {
        if (currentUser) {
            if (currentUser.role === 'coordinator' || currentUser.role === 'admin') {
                socket.emit('join_coordinator_room');
                console.log('📢 Solicitando unirse a la sala de coordinadores...');
            }
            if (currentUser.role === 'admin') {
                socket.emit('join_admin_room');
                console.log('📢 Solicitando unirse a la sala de administradores...');
            }
        }
    }
    
    // Intentar unirse cuando currentUser esté disponible
    if (currentUser) {
        joinRoomsIfNeeded();
    }
    
    socket.on('new_annotation', (data) => {
        if (currentUser && (currentUser.role === 'coordinator' || currentUser.role === 'admin')) {
            showNotification(`Nueva anotación registrada por ${data.teacher}`, 'success');
        }
    });
    
    // Solicitar permiso para notificaciones del navegador
    if ('Notification' in window && Notification.permission === 'default') {
        Notification.requestPermission();
    }
}

function initNavigation() {
    // Toggle del menú móvil
    const navToggle = document.getElementById('navToggle');
    const navMenu = document.getElementById('navMenu');
    
    if (navToggle) {
        navToggle.addEventListener('click', () => {
            navMenu.classList.toggle('active');
        });
    }
    
    // Navegación entre páginas
    const navLinks = document.querySelectorAll('.nav-link[data-page]');
    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const page = link.getAttribute('data-page');
            showPage(page);
            
            // Cerrar menú móvil
            if (navMenu) {
                navMenu.classList.remove('active');
            }
        });
    });
}

function showPage(pageName) {
    // Ocultar todas las páginas
    const pages = document.querySelectorAll('.page');
    pages.forEach(page => page.classList.remove('active'));
    
    // Mostrar la página seleccionada
    const targetPage = document.getElementById(pageName + 'Page');
    if (targetPage) {
        targetPage.classList.add('active');
    }
    
    // Actualizar enlaces activos
    const navLinks = document.querySelectorAll('.nav-link');
    navLinks.forEach(link => link.classList.remove('active'));
    const activeLink = document.querySelector(`[data-page="${pageName}"]`);
    if (activeLink) {
        activeLink.classList.add('active');
    }
    
    // Cargar datos específicos de la página
    loadPageData(pageName);
}

// Hacer showPage disponible globalmente
window.showPage = showPage;

function loadPageData(pageName) {
    switch(pageName) {
        case 'dashboard':
            loadDashboard();
            break;
        case 'annotations':
            loadAnnotationsPage();
            break;
        case 'students':
            loadStudentsPage();
            break;
        case 'teachers':
            loadTeachersPage();
            break;
        case 'coordinators':
            loadCoordinatorsPage();
            break;
        case 'grades':
            loadGradesPage();
            break;
        case 'emergency':
            loadEmergencyPage();
            break;
        case 'admin':
            loadAdminPage();
            break;
        case 'profile':
            loadProfilePage();
            break;
    }
}

async function loadUserData() {
    try {
        // Obtener información del usuario desde la sesión
        const response = await fetch('/api/user/current');
        if (response.ok) {
            currentUser = await response.json();
            console.log('Usuario cargado:', currentUser);
            // Configurar visibilidad de menús según el rol
            setupMenuVisibility();
            
            // Si el usuario es coordinador o admin y el socket ya está conectado, unirse a las salas
            if (socket) {
                if (socket.connected) {
                    if (currentUser.role === 'coordinator' || currentUser.role === 'admin') {
                        socket.emit('join_coordinator_room');
                        console.log('📢 Uniéndose a la sala de coordinadores después de cargar usuario');
                    }
                    if (currentUser.role === 'admin') {
                        socket.emit('join_admin_room');
                        console.log('📢 Uniéndose a la sala de administradores después de cargar usuario');
                    }
                } else {
                    // Esperar a que se conecte
                    socket.once('connect', () => {
                        if (currentUser.role === 'coordinator' || currentUser.role === 'admin') {
                            socket.emit('join_coordinator_room');
                            console.log('📢 Uniéndose a la sala de coordinadores después de reconexión');
                        }
                        if (currentUser.role === 'admin') {
                            socket.emit('join_admin_room');
                            console.log('📢 Uniéndose a la sala de administradores después de reconexión');
                        }
                    });
                }
            }
        }
    } catch (error) {
        console.error('Error cargando datos del usuario:', error);
    }
}

function setupMenuVisibility() {
    if (!currentUser) return;
    
    const role = currentUser.role;
    
    // Ocultar todos primero
    const allNavs = ['annotationsNav', 'studentsNav', 'teachersNav', 'coordinatorsNav', 
                     'gradesNav', 'emergencyNav', 'adminNav', 'emergencyButton'];
    allNavs.forEach(navId => {
        const nav = document.getElementById(navId);
        if (nav) nav.style.display = 'none';
    });
    
    // Mostrar según el rol
    if (role === 'teacher') {
        const teacherNavs = ['annotationsNav', 'studentsNav', 'emergencyNav', 'emergencyButton'];
        teacherNavs.forEach(navId => {
            const nav = document.getElementById(navId);
            if (nav) nav.style.display = 'block';
        });
    }
    
    if (role === 'coordinator' || role === 'admin') {
        const coordNavs = ['annotationsNav', 'studentsNav', 'teachersNav', 'emergencyNav'];
        coordNavs.forEach(navId => {
            const nav = document.getElementById(navId);
            if (nav) nav.style.display = 'block';
        });
    }
    
    if (role === 'admin') {
        const adminNavs = ['annotationsNav', 'studentsNav', 'teachersNav', 'coordinatorsNav', 
                          'gradesNav', 'emergencyNav', 'adminNav'];
        adminNavs.forEach(navId => {
            const nav = document.getElementById(navId);
            if (nav) nav.style.display = 'block';
        });
    }
}

async function handleLogout() {
    try {
        await fetch('/api/logout', { method: 'POST' });
        window.location.href = '/';
    } catch (error) {
        console.error('Error al cerrar sesión:', error);
        window.location.href = '/';
    }
}

// ==================== NOTIFICACIONES ====================
let emergencyNotifications = new Map(); // Para almacenar notificaciones persistentes

function showNotification(message, type = 'info') {
    const notificationsDiv = document.getElementById('notifications');
    if (!notificationsDiv) return;
    
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;
    
    notificationsDiv.appendChild(notification);
    
    // Remover después de 5 segundos (excepto emergencias)
    if (type !== 'emergency') {
        setTimeout(() => {
            notification.remove();
        }, 5000);
    }
}

function showPersistentEmergencyNotification(data, gradeInfo) {
    const notificationsDiv = document.getElementById('notifications');
    if (!notificationsDiv) return;
    
    // Si ya existe una notificación para esta emergencia, no crear otra
    if (emergencyNotifications.has(data.request_id)) {
        return;
    }
    
    const notification = document.createElement('div');
    notification.className = 'notification emergency persistent';
    notification.id = `emergency-${data.request_id}`;
    notification.innerHTML = `
        <div class="emergency-notification-content">
            <div class="emergency-alert-icon">🚨</div>
            <div class="emergency-notification-text">
                <strong>EMERGENCIA</strong>
                <p>${data.teacher} necesita asistencia urgente en ${gradeInfo}</p>
                <small>${data.message || 'Solicitud de asistencia urgente'}</small>
            </div>
            <div class="emergency-notification-actions">
                <button class="btn btn-sm btn-primary" onclick="goToEmergencyPage()">Ver Detalles</button>
                <button class="btn btn-sm btn-secondary" onclick="dismissEmergencyNotification(${data.request_id})">Cerrar</button>
            </div>
        </div>
    `;
    
    notificationsDiv.appendChild(notification);
    emergencyNotifications.set(data.request_id, notification);
    
    // Hacer parpadear la notificación
    notification.style.animation = 'pulse 2s infinite';
}

// Funciones globales para notificaciones
window.dismissEmergencyNotification = function(requestId) {
    const notification = document.getElementById(`emergency-${requestId}`);
    if (notification) {
        notification.remove();
        emergencyNotifications.delete(requestId);
    }
}

window.goToEmergencyPage = function() {
    showPage('emergency');
    const navMenu = document.getElementById('navMenu');
    if (navMenu) {
        navMenu.classList.remove('active');
    }
}

// Función para reproducir alarma sonora
function playEmergencyAlarm() {
    // Crear un contexto de audio para generar un sonido de alarma
    try {
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        oscillator.frequency.value = 800; // Frecuencia alta para alarma
        oscillator.type = 'sine';
        
        gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);
        
        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + 0.5);
        
        // Repetir 3 veces
        setTimeout(() => {
            const oscillator2 = audioContext.createOscillator();
            const gainNode2 = audioContext.createGain();
            oscillator2.connect(gainNode2);
            gainNode2.connect(audioContext.destination);
            oscillator2.frequency.value = 800;
            oscillator2.type = 'sine';
            gainNode2.gain.setValueAtTime(0.3, audioContext.currentTime);
            gainNode2.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);
            oscillator2.start(audioContext.currentTime);
            oscillator2.stop(audioContext.currentTime + 0.5);
        }, 600);
        
        setTimeout(() => {
            const oscillator3 = audioContext.createOscillator();
            const gainNode3 = audioContext.createGain();
            oscillator3.connect(gainNode3);
            gainNode3.connect(audioContext.destination);
            oscillator3.frequency.value = 800;
            oscillator3.type = 'sine';
            gainNode3.gain.setValueAtTime(0.3, audioContext.currentTime);
            gainNode3.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);
            oscillator3.start(audioContext.currentTime);
            oscillator3.stop(audioContext.currentTime + 0.5);
        }, 1200);
    } catch (error) {
        console.error('Error reproduciendo alarma:', error);
    }
}

// ==================== MODAL ====================
function showModal(content) {
    const modal = document.getElementById('modalOverlay');
    const modalBody = document.getElementById('modalBody');
    
    if (modal && modalBody) {
        modalBody.innerHTML = content;
        modal.classList.add('active');
        
        // Cerrar modal al hacer clic fuera
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                closeModal();
            }
        });
        
        // Cerrar con botón X
        const closeBtn = modal.querySelector('.modal-close');
        if (closeBtn) {
            closeBtn.addEventListener('click', closeModal);
        }
    }
}

function closeModal() {
    const modal = document.getElementById('modalOverlay');
    if (modal) {
        modal.classList.remove('active');
    }
}

// Hacer closeModal disponible globalmente
window.closeModal = closeModal;

// ==================== FUNCIONES DE CARGA DE PÁGINAS ====================
async function loadDashboard() {
    // Esta función se implementará en dashboard.js
    if (typeof loadDashboardData === 'function') {
        loadDashboardData();
    }
}

async function loadAnnotationsPage() {
    await loadGradesForSelect('annotationGrade');
    document.getElementById('annotationGrade').addEventListener('change', async (e) => {
        const gradeId = e.target.value;
        if (gradeId) {
            await loadStudentsForGrade(gradeId, 'annotationStudent');
        }
    });
    
    document.getElementById('annotationType').addEventListener('change', (e) => {
        const type = e.target.value;
        const pointsInput = document.getElementById('annotationPoints');
        if (type === 'leve') {
            pointsInput.value = 5;
        } else if (type === 'grave') {
            pointsInput.value = 10;
        } else if (type === 'muy_grave') {
            pointsInput.value = 20;
        }
    });
    
    const form = document.getElementById('annotationForm');
    if (form) {
        form.addEventListener('submit', handleCreateAnnotation);
    }
}

async function loadStudentsPage() {
    await loadGradesForSelect('studentGradeFilter');
    document.getElementById('studentGradeFilter').addEventListener('change', async (e) => {
        const gradeId = e.target.value;
        if (gradeId) {
            await loadStudentsList(gradeId);
        }
    });
}

async function loadTeachersPage() {
    await loadTeachersList();
    const btnAdd = document.getElementById('btnAddTeacher');
    if (btnAdd) {
        btnAdd.addEventListener('click', () => showAddTeacherModal());
    }
}

async function loadCoordinatorsPage() {
    await loadCoordinatorsList();
    const btnAdd = document.getElementById('btnAddCoordinator');
    if (btnAdd) {
        btnAdd.addEventListener('click', () => showAddCoordinatorModal());
    }
}

async function loadGradesPage() {
    // Asegurarse de que currentUser esté cargado
    if (!currentUser) {
        await loadUserData();
    }
    await loadGradesList();
    const btnAdd = document.getElementById('btnAddGrade');
    if (btnAdd) {
        btnAdd.addEventListener('click', () => showAddGradeModal());
    }
}

async function loadEmergencyPage() {
    loadEmergencyRequests();
    
    // Botón de emergencia
    const btnEmergency = document.getElementById('btnEmergency');
    if (btnEmergency) {
        btnEmergency.addEventListener('click', () => showEmergencyModal());
    }
}

async function loadAdminPage() {
    await loadGradesForSelect('importGrade');
    
    const btnExport = document.getElementById('btnExportDB');
    if (btnExport) {
        btnExport.addEventListener('click', handleExportDatabase);
    }
    
    const btnNewYear = document.getElementById('btnNewYear');
    if (btnNewYear) {
        btnNewYear.addEventListener('click', handleNewYear);
    }
    
    const btnImport = document.getElementById('btnImport');
    if (btnImport) {
        btnImport.addEventListener('click', handleImportStudents);
    }
    
    const btnAddStudent = document.getElementById('btnAddStudent');
    if (btnAddStudent) {
        btnAddStudent.addEventListener('click', showAddStudentModal);
    }
}

// ==================== FUNCIONES AUXILIARES ====================
async function loadGradesForSelect(selectId) {
    try {
        const response = await fetch('/api/grades');
        const grades = await response.json();
        
        const select = document.getElementById(selectId);
        if (select) {
            select.innerHTML = '<option value="">Seleccionar grado</option>';
            grades.forEach(grade => {
                const option = document.createElement('option');
                option.value = grade.id;
                option.textContent = `${grade.grade_number}° ${grade.section}`;
                select.appendChild(option);
            });
        }
    } catch (error) {
        console.error('Error cargando grados:', error);
    }
}

async function loadStudentsForGrade(gradeId, selectId) {
    try {
        const response = await fetch(`/api/students/${gradeId}`);
        const students = await response.json();
        
        const select = document.getElementById(selectId);
        if (select) {
            select.innerHTML = '<option value="">Seleccionar estudiante</option>';
            students.forEach(student => {
                const option = document.createElement('option');
                option.value = student.id;
                option.textContent = student.full_name;
                select.appendChild(option);
            });
        }
    } catch (error) {
        console.error('Error cargando estudiantes:', error);
    }
}

async function handleCreateAnnotation(e) {
    e.preventDefault();
    
    const studentId = document.getElementById('annotationStudent').value;
    const type = document.getElementById('annotationType').value;
    const points = document.getElementById('annotationPoints').value;
    const description = document.getElementById('annotationDescription').value;
    
    try {
        const response = await fetch('/api/annotations', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                student_id: studentId,
                annotation_type: type,
                points: parseInt(points),
                description: description
            })
        });
        
        const data = await response.json();
        
        if (data.success) {
            showNotification('Anotación registrada exitosamente', 'success');
            document.getElementById('annotationForm').reset();
        } else {
            showNotification(data.error || 'Error al registrar anotación', 'error');
        }
    } catch (error) {
        showNotification('Error de conexión', 'error');
    }
}

// Funciones adicionales se implementarán en los otros archivos JS
async function loadStudentsList(gradeId) {
    // Implementar en dashboard.js
}

async function loadTeachersList() {
    // Implementar en dashboard.js
}

async function loadCoordinatorsList() {
    // Implementar en dashboard.js
}

async function loadGradesList() {
    // Implementar en dashboard.js
}

async function loadEmergencyRequests() {
    // Implementar en dashboard.js
}

// showAddTeacherModal está implementada en dashboard.js

function showAddCoordinatorModal() {
    // Implementar en dashboard.js
}

function showAddGradeModal() {
    // Implementar en dashboard.js
}

function showEmergencyModal() {
    // Implementar en dashboard.js
}

async function handleExportDatabase() {
    // Implementar en dashboard.js
}

async function handleNewYear() {
    // Implementar en dashboard.js
}

async function handleImportStudents() {
    // Implementar en dashboard.js
}

// showAddStudentModal está implementada en dashboard.js

function loadProfilePage() {
    if (currentUser) {
        document.getElementById('profileId').textContent = currentUser.id || '-';
        document.getElementById('profileFullName').textContent = currentUser.full_name || '-';
        document.getElementById('profileUsername').textContent = currentUser.username || '-';
        document.getElementById('profileEmail').textContent = currentUser.email || '-';
        
        const roleLabels = {
            'admin': 'Administrador',
            'coordinator': 'Coordinador',
            'teacher': 'Maestro'
        };
        document.getElementById('profileRole').textContent = roleLabels[currentUser.role] || currentUser.role || '-';
    } else {
        // Recargar datos del usuario si no están disponibles
        loadUserData().then(() => {
            if (currentUser) {
                document.getElementById('profileId').textContent = currentUser.id || '-';
                document.getElementById('profileFullName').textContent = currentUser.full_name || '-';
                document.getElementById('profileUsername').textContent = currentUser.username || '-';
                document.getElementById('profileEmail').textContent = currentUser.email || '-';
                
                const roleLabels = {
                    'admin': 'Administrador',
                    'coordinator': 'Coordinador',
                    'teacher': 'Maestro'
                };
                document.getElementById('profileRole').textContent = roleLabels[currentUser.role] || currentUser.role || '-';
            }
        });
    }
}

