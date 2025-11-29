// Variables globales
let currentUser = null;
let socket = null;

// Inicialización cuando el DOM está listo
document.addEventListener('DOMContentLoaded', function() {
    // Verificar si estamos en la página de login o dashboard
    if (document.getElementById('loginForm')) {
        initLogin();
    } else if (document.getElementById('dashboardPage')) {
        initDashboard();
    }
});

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
    const errorDiv = document.getElementById('loginError');

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
            errorDiv.textContent = data.error || 'Error al iniciar sesión';
            errorDiv.classList.add('show');
        }
    } catch (error) {
        errorDiv.textContent = 'Error de conexión. Intente nuevamente.';
        errorDiv.classList.add('show');
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
function showNotification(message, type = 'info') {
    const notificationsDiv = document.getElementById('notifications');
    if (!notificationsDiv) return;
    
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;
    
    notificationsDiv.appendChild(notification);
    
    // Remover después de 5 segundos
    setTimeout(() => {
        notification.remove();
    }, 5000);
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

