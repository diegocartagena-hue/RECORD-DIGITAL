// ==================== DASHBOARD ====================
let topStudentsChart = null;

async function loadDashboardData() {
    await loadDashboardStats();
    await loadTopStudentsChart();
    await loadGradesForSelect('gradeFilter');
    
    const gradeFilter = document.getElementById('gradeFilter');
    if (gradeFilter) {
        gradeFilter.addEventListener('change', async (e) => {
            const gradeId = e.target.value || null;
            await loadTopStudentsChart(gradeId);
        });
    }
}

async function loadDashboardStats() {
    try {
        // Obtener estadísticas generales
        const response = await fetch('/api/statistics/top-students?limit=1000');
        const students = await response.json();
        
        const totalAnnotations = students.reduce((sum, s) => sum + (s.total_annotations || 0), 0);
        const studentsWithAnnotations = students.filter(s => s.total_annotations > 0).length;
        
        document.getElementById('totalAnnotations').textContent = totalAnnotations;
        document.getElementById('studentsWithAnnotations').textContent = studentsWithAnnotations;
        
        // Cargar emergencias pendientes
        try {
            const emergencyResponse = await fetch('/api/emergency/requests');
            if (emergencyResponse.ok) {
                const emergencies = await emergencyResponse.json();
                document.getElementById('pendingEmergencies').textContent = emergencies.length;
            }
        } catch (error) {
            console.error('Error cargando emergencias:', error);
        }
    } catch (error) {
        console.error('Error cargando estadísticas:', error);
    }
}

async function loadTopStudentsChart(gradeId = null) {
    try {
        const url = gradeId 
            ? `/api/statistics/top-students?grade_id=${gradeId}&limit=10`
            : '/api/statistics/top-students?limit=10';
        
        const response = await fetch(url);
        const students = await response.json();
        
        const ctx = document.getElementById('topStudentsChart');
        if (!ctx) return;
        
        // Destruir gráfica anterior si existe
        if (topStudentsChart) {
            topStudentsChart.destroy();
        }
        
        const labels = students.map(s => `${s.full_name} (${s.grade_number}°${s.section})`);
        const annotationsData = students.map(s => s.total_annotations || 0);
        const pointsData = students.map(s => s.total_points || 0);
        
        topStudentsChart = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Número de Anotaciones',
                    data: annotationsData,
                    backgroundColor: 'rgba(26, 35, 126, 0.8)',
                    borderColor: 'rgba(26, 35, 126, 1)',
                    borderWidth: 1
                }, {
                    label: 'Puntos Totales',
                    data: pointsData,
                    backgroundColor: 'rgba(211, 47, 47, 0.8)',
                    borderColor: 'rgba(211, 47, 47, 1)',
                    borderWidth: 1,
                    yAxisID: 'y1'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: true,
                scales: {
                    y: {
                        beginAtZero: true,
                        title: {
                            display: true,
                            text: 'Número de Anotaciones'
                        }
                    },
                    y1: {
                        type: 'linear',
                        display: true,
                        position: 'right',
                        beginAtZero: true,
                        title: {
                            display: true,
                            text: 'Puntos Totales'
                        },
                        grid: {
                            drawOnChartArea: false
                        }
                    }
                },
                plugins: {
                    legend: {
                        display: true,
                        position: 'top'
                    }
                }
            }
        });
    } catch (error) {
        console.error('Error cargando gráfica:', error);
    }
}

// ==================== ESTUDIANTES ====================
async function loadStudentsList(gradeId) {
    try {
        const response = await fetch(`/api/students/${gradeId}`);
        const students = await response.json();
        
        const container = document.getElementById('studentsList');
        if (!container) return;
        
        if (students.length === 0) {
            container.innerHTML = '<p class="text-center">No hay estudiantes en este grado</p>';
            return;
        }
        
        container.innerHTML = '';
        
        for (const student of students) {
            // Obtener anotaciones del estudiante
            const annotationsResponse = await fetch(`/api/students/${student.id}/annotations`);
            const annotations = await annotationsResponse.json();
            
            const totalPoints = annotations.reduce((sum, a) => sum + (a.points || 0), 0);
            
            const card = document.createElement('div');
            card.className = 'student-card';
            card.innerHTML = `
                <div class="card-info">
                    <h3>${student.full_name}</h3>
                    <p>ID: ${student.student_id}</p>
                    <p>Anotaciones: ${annotations.length} | Puntos: ${totalPoints}</p>
                </div>
                <div class="card-actions">
                    <button class="btn btn-primary" onclick="viewStudentAnnotations(${student.id}, '${student.full_name}')">
                        Ver Anotaciones
                    </button>
                </div>
            `;
            container.appendChild(card);
        }
    } catch (error) {
        console.error('Error cargando estudiantes:', error);
    }
}

// Hacer la función disponible globalmente
window.viewStudentAnnotations = async function(studentId, studentName) {
    try {
        const response = await fetch(`/api/students/${studentId}/annotations`);
        const annotations = await response.json();
        
        let html = `<h2>Anotaciones de ${studentName}</h2>`;
        
        if (annotations.length === 0) {
            html += '<p>No hay anotaciones registradas</p>';
        } else {
            html += '<div class="annotations-list">';
            annotations.forEach(ann => {
                const date = new Date(ann.date);
                html += `
                    <div class="annotation-item" style="padding: 15px; margin-bottom: 10px; background: #f5f5f5; border-radius: 5px; border-left: 4px solid ${getAnnotationColor(ann.annotation_type)}">
                        <strong>${getAnnotationTypeLabel(ann.annotation_type)}</strong> - ${ann.points} puntos
                        <p>${ann.description || 'Sin descripción'}</p>
                        <small>Por: ${ann.teacher_name} - ${date.toLocaleString()}</small>
                    </div>
                `;
            });
            html += '</div>';
        }
        
        showModal(html);
    } catch (error) {
        console.error('Error cargando anotaciones:', error);
        showNotification('Error al cargar anotaciones', 'error');
    }
}

function getAnnotationTypeLabel(type) {
    const labels = {
        'leve': 'Leve',
        'grave': 'Grave',
        'muy_grave': 'Muy Grave'
    };
    return labels[type] || type;
}

function getAnnotationColor(type) {
    const colors = {
        'leve': '#4caf50',
        'grave': '#ff9800',
        'muy_grave': '#d32f2f'
    };
    return colors[type] || '#9e9e9e';
}

// ==================== MAESTROS ====================
async function loadTeachersList() {
    try {
        const response = await fetch('/api/teachers');
        if (!response.ok) {
            console.error('No autorizado para ver maestros');
            return;
        }
        
        const teachers = await response.json();
        const container = document.getElementById('teachersList');
        if (!container) return;
        
        if (teachers.length === 0) {
            container.innerHTML = '<p class="text-center">No hay maestros registrados</p>';
            return;
        }
        
        container.innerHTML = '';
        
        teachers.forEach(teacher => {
            const card = document.createElement('div');
            card.className = 'teacher-card';
            card.innerHTML = `
                <div class="card-info">
                    <h3>${teacher.full_name}</h3>
                    <p>${teacher.email}</p>
                    <p>Usuario: ${teacher.username}</p>
                </div>
                <div class="card-actions">
                    <button class="btn btn-danger" onclick="deleteTeacher(${teacher.id})">
                        Eliminar
                    </button>
                </div>
            `;
            container.appendChild(card);
        });
    } catch (error) {
        console.error('Error cargando maestros:', error);
    }
}

// Hacer la función disponible globalmente
window.showAddTeacherModal = function() {
    const html = `
        <h2>Agregar Maestro</h2>
        <form id="addTeacherForm">
            <div class="form-group">
                <label>Nombre Completo</label>
                <input type="text" id="teacherName" class="form-control" required>
            </div>
            <div class="form-group">
                <label>Usuario</label>
                <input type="text" id="teacherUsername" class="form-control" required>
            </div>
            <div class="form-group">
                <label>Correo Electrónico</label>
                <input type="email" id="teacherEmail" class="form-control" required>
            </div>
            <div class="form-group">
                <label>Contraseña</label>
                <input type="password" id="teacherPassword" class="form-control" required minlength="6">
                <small style="display: block; margin-top: 5px; color: #666;">Mínimo 6 caracteres</small>
            </div>
            <button type="submit" class="btn btn-primary">Crear Maestro</button>
        </form>
    `;
    
    showModal(html);
    
    const form = document.getElementById('addTeacherForm');
    if (form) {
        // Remover listeners anteriores si existen
        const newForm = form.cloneNode(true);
        form.parentNode.replaceChild(newForm, form);
        
        newForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const data = {
                full_name: document.getElementById('teacherName').value.trim(),
                username: document.getElementById('teacherUsername').value.trim(),
                email: document.getElementById('teacherEmail').value.trim(),
                password: document.getElementById('teacherPassword').value
            };
            
            // Validación básica
            if (!data.full_name || !data.username || !data.email || !data.password) {
                showNotification('Por favor complete todos los campos', 'error');
                return;
            }
            
            if (data.password.length < 6) {
                showNotification('La contraseña debe tener al menos 6 caracteres', 'error');
                return;
            }
            
            try {
                const response = await fetch('/api/teachers', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(data)
                });
                
                const result = await response.json();
                
                if (result.success) {
                    showNotification('Maestro creado exitosamente', 'success');
                    closeModal();
                    loadTeachersList();
                } else {
                    showNotification(result.error || 'Error al crear maestro', 'error');
                }
            } catch (error) {
                console.error('Error creando maestro:', error);
                showNotification('Error de conexión. Verifique su conexión a internet.', 'error');
            }
        });
    }
}

// Hacer la función disponible globalmente
window.deleteTeacher = async function(teacherId) {
    if (!confirm('¿Está seguro de eliminar este maestro?')) {
        return;
    }
    
    try {
        const response = await fetch(`/api/teachers/${teacherId}`, {
            method: 'DELETE'
        });
        
        const result = await response.json();
        
        if (result.success) {
            showNotification('Maestro eliminado exitosamente', 'success');
            loadTeachersList();
        } else {
            showNotification(result.error || 'Error al eliminar maestro', 'error');
        }
    } catch (error) {
        console.error('Error eliminando maestro:', error);
        showNotification('Error de conexión', 'error');
    }
}

// ==================== COORDINADORES ====================
async function loadCoordinatorsList() {
    try {
        const response = await fetch('/api/coordinators');
        if (!response.ok) {
            console.error('No autorizado para ver coordinadores');
            return;
        }
        
        const coordinators = await response.json();
        const container = document.getElementById('coordinatorsList');
        if (!container) return;
        
        if (coordinators.length === 0) {
            container.innerHTML = '<p class="text-center">No hay coordinadores registrados</p>';
            return;
        }
        
        container.innerHTML = '';
        
        coordinators.forEach(coord => {
            const card = document.createElement('div');
            card.className = 'coordinator-card';
            card.innerHTML = `
                <div class="card-info">
                    <h3>${coord.full_name}</h3>
                    <p>${coord.email}</p>
                    <p>Usuario: ${coord.username}</p>
                </div>
            `;
            container.appendChild(card);
        });
    } catch (error) {
        console.error('Error cargando coordinadores:', error);
    }
}

function showAddCoordinatorModal() {
    const html = `
        <h2>Agregar Coordinador</h2>
        <form id="addCoordinatorForm">
            <div class="form-group">
                <label>Nombre Completo</label>
                <input type="text" id="coordName" class="form-control" required>
            </div>
            <div class="form-group">
                <label>Usuario</label>
                <input type="text" id="coordUsername" class="form-control" required>
            </div>
            <div class="form-group">
                <label>Correo Electrónico</label>
                <input type="email" id="coordEmail" class="form-control" required>
            </div>
            <div class="form-group">
                <label>Contraseña</label>
                <input type="password" id="coordPassword" class="form-control" required>
            </div>
            <button type="submit" class="btn btn-primary">Crear Coordinador</button>
        </form>
    `;
    
    showModal(html);
    
    const form = document.getElementById('addCoordinatorForm');
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const data = {
            full_name: document.getElementById('coordName').value,
            username: document.getElementById('coordUsername').value,
            email: document.getElementById('coordEmail').value,
            password: document.getElementById('coordPassword').value
        };
        
        try {
            const response = await fetch('/api/coordinators', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(data)
            });
            
            const result = await response.json();
            
            if (result.success) {
                showNotification('Coordinador creado exitosamente', 'success');
                closeModal();
                loadCoordinatorsList();
            } else {
                showNotification(result.error || 'Error al crear coordinador', 'error');
            }
        } catch (error) {
            showNotification('Error de conexión', 'error');
        }
    });
}

// ==================== GRADOS ====================
async function loadGradesList() {
    try {
        const response = await fetch('/api/grades');
        const grades = await response.json();
        const container = document.getElementById('gradesList');
        if (!container) return;
        
        if (grades.length === 0) {
            container.innerHTML = '<p class="text-center">No hay grados registrados</p>';
            return;
        }
        
        container.innerHTML = '';
        
        grades.forEach(grade => {
            const card = document.createElement('div');
            card.className = 'grade-card';
            card.innerHTML = `
                <div class="card-info">
                    <h3>${grade.grade_number}° ${grade.section}</h3>
                    <p>Año: ${grade.year}</p>
                </div>
            `;
            container.appendChild(card);
        });
    } catch (error) {
        console.error('Error cargando grados:', error);
    }
}

function showAddGradeModal() {
    const html = `
        <h2>Agregar Grado</h2>
        <form id="addGradeForm">
            <div class="form-group">
                <label>Número de Grado (1-12)</label>
                <input type="number" id="gradeNumber" class="form-control" min="1" max="12" required>
            </div>
            <div class="form-group">
                <label>Sección</label>
                <select id="gradeSection" class="form-control" required>
                    <option value="A">A</option>
                    <option value="B">B</option>
                </select>
            </div>
            <div class="form-group">
                <label>Año</label>
                <input type="number" id="gradeYear" class="form-control" value="${new Date().getFullYear()}" required>
            </div>
            <button type="submit" class="btn btn-primary">Crear Grado</button>
        </form>
    `;
    
    showModal(html);
    
    const form = document.getElementById('addGradeForm');
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const data = {
            grade_number: parseInt(document.getElementById('gradeNumber').value),
            section: document.getElementById('gradeSection').value,
            year: parseInt(document.getElementById('gradeYear').value)
        };
        
        try {
            const response = await fetch('/api/grades', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(data)
            });
            
            const result = await response.json();
            
            if (result.success) {
                showNotification('Grado creado exitosamente', 'success');
                closeModal();
                loadGradesList();
            } else {
                showNotification(result.error || 'Error al crear grado', 'error');
            }
        } catch (error) {
            showNotification('Error de conexión', 'error');
        }
    });
}

// ==================== EMERGENCIAS ====================
async function loadEmergencyRequests() {
    try {
        const response = await fetch('/api/emergency/requests');
        if (!response.ok) {
            console.error('No autorizado para ver emergencias');
            return;
        }
        
        const requests = await response.json();
        const container = document.getElementById('emergencyRequests');
        if (!container) return;
        
        if (requests.length === 0) {
            container.innerHTML = '<p class="text-center">No hay solicitudes de emergencia pendientes</p>';
            return;
        }
        
        container.innerHTML = '';
        
        requests.forEach(req => {
            const date = new Date(req.created_at);
            const card = document.createElement('div');
            card.className = 'emergency-card';
            card.innerHTML = `
                <h3>🚨 ${req.teacher_name}</h3>
                <p><strong>Grado:</strong> ${req.grade_number}° ${req.section}</p>
                <p><strong>Mensaje:</strong> ${req.message || 'Solicitud de asistencia urgente'}</p>
                <p class="emergency-time">${date.toLocaleString()}</p>
                <button class="btn btn-success" onclick="resolveEmergency(${req.id})">
                    Marcar como Resuelto
                </button>
            `;
            container.appendChild(card);
        });
    } catch (error) {
        console.error('Error cargando emergencias:', error);
    }
}

function showEmergencyModal() {
    // Obtener grados para el select
    fetch('/api/grades')
        .then(response => response.json())
        .then(grades => {
            let options = '<option value="">Seleccionar grado</option>';
            grades.forEach(grade => {
                options += `<option value="${grade.id}">${grade.grade_number}° ${grade.section}</option>`;
            });
            
            const html = `
                <h2>Solicitar Asistencia</h2>
                <form id="emergencyForm">
                    <div class="form-group">
                        <label>Grado</label>
                        <select id="emergencyGrade" class="form-control" required>
                            ${options}
                        </select>
                    </div>
                    <div class="form-group">
                        <label>Mensaje (opcional)</label>
                        <textarea id="emergencyMessage" class="form-control" rows="3" placeholder="Describa la situación..."></textarea>
                    </div>
                    <button type="submit" class="btn btn-danger">Enviar Solicitud</button>
                </form>
            `;
            
            showModal(html);
            
            const form = document.getElementById('emergencyForm');
            form.addEventListener('submit', async (e) => {
                e.preventDefault();
                
                const data = {
                    grade_id: parseInt(document.getElementById('emergencyGrade').value),
                    message: document.getElementById('emergencyMessage').value
                };
                
                try {
                    const response = await fetch('/api/emergency', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify(data)
                    });
                    
                    const result = await response.json();
                    
                    if (result.success) {
                        showNotification('Solicitud de emergencia enviada', 'success');
                        closeModal();
                    } else {
                        showNotification(result.error || 'Error al enviar solicitud', 'error');
                    }
                } catch (error) {
                    showNotification('Error de conexión', 'error');
                }
            });
        });
}

// Hacer la función disponible globalmente
window.resolveEmergency = async function(requestId) {
    try {
        const response = await fetch(`/api/emergency/${requestId}/resolve`, {
            method: 'POST'
        });
        
        const result = await response.json();
        
        if (result.success) {
            showNotification('Emergencia resuelta', 'success');
            loadEmergencyRequests();
            // Actualizar contador en dashboard
            if (typeof loadDashboardStats === 'function') {
                loadDashboardStats();
            }
        } else {
            showNotification(result.error || 'Error al resolver emergencia', 'error');
        }
    } catch (error) {
        console.error('Error resolviendo emergencia:', error);
        showNotification('Error de conexión', 'error');
    }
}

// ==================== ADMINISTRACIÓN ====================
async function handleExportDatabase() {
    try {
        const year = new Date().getFullYear();
        const response = await fetch(`/api/export/database?year=${year}`);
        
        if (response.ok) {
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `backup_${year}_${new Date().getTime()}.db`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
            
            showNotification('Base de datos exportada exitosamente', 'success');
        } else {
            showNotification('Error al exportar base de datos', 'error');
        }
    } catch (error) {
        showNotification('Error de conexión', 'error');
    }
}

async function handleNewYear() {
    if (!confirm('¿Está seguro de crear una nueva base de datos para el siguiente año? Se hará un backup automático.')) {
        return;
    }
    
    try {
        const newYear = new Date().getFullYear() + 1;
        const response = await fetch('/api/database/new-year', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ year: newYear })
        });
        
        const result = await response.json();
        
        if (result.success) {
            showNotification(`Nuevo año ${newYear} creado exitosamente. Backup guardado.`, 'success');
        } else {
            showNotification(result.error || 'Error al crear nuevo año', 'error');
        }
    } catch (error) {
        showNotification('Error de conexión', 'error');
    }
}

async function handleImportStudents() {
    const fileInput = document.getElementById('importFile');
    const gradeSelect = document.getElementById('importGrade');
    
    if (!fileInput.files.length) {
        showNotification('Seleccione un archivo Excel o CSV', 'error');
        return;
    }
    
    if (!gradeSelect.value) {
        showNotification('Seleccione un grado', 'error');
        return;
    }
    
    const formData = new FormData();
    formData.append('file', fileInput.files[0]);
    formData.append('grade_id', gradeSelect.value);
    
    try {
        const response = await fetch('/api/students/import', {
            method: 'POST',
            body: formData
        });
        
        const result = await response.json();
        
        if (result.success) {
            let message = `${result.imported} estudiantes importados exitosamente`;
            if (result.errors && result.errors.length > 0) {
                message += `. ${result.errors.length} errores encontrados.`;
                console.warn('Errores de importación:', result.errors);
            }
            showNotification(message, 'success');
            fileInput.value = '';
        } else {
            showNotification(result.error || 'Error al importar estudiantes', 'error');
        }
    } catch (error) {
        showNotification('Error de conexión', 'error');
    }
}

function showAddStudentModal() {
    // Obtener grados para el select
    fetch('/api/grades')
        .then(response => response.json())
        .then(grades => {
            let options = '<option value="">Seleccionar grado</option>';
            grades.forEach(grade => {
                options += `<option value="${grade.id}">${grade.grade_number}° ${grade.section}</option>`;
            });
            
            const html = `
                <h2>Agregar Estudiante</h2>
                <form id="addStudentForm">
                    <div class="form-group">
                        <label>ID de Estudiante</label>
                        <input type="text" id="studentId" class="form-control" required placeholder="Ej: 2024001">
                    </div>
                    <div class="form-group">
                        <label>Nombre Completo</label>
                        <input type="text" id="studentFullName" class="form-control" required placeholder="Ej: Juan Pérez">
                    </div>
                    <div class="form-group">
                        <label>Grado</label>
                        <select id="studentGrade" class="form-control" required>
                            ${options}
                        </select>
                    </div>
                    <button type="submit" class="btn btn-primary">Agregar Estudiante</button>
                </form>
            `;
            
            showModal(html);
            
            const form = document.getElementById('addStudentForm');
            form.addEventListener('submit', async (e) => {
                e.preventDefault();
                
                const data = {
                    student_id: document.getElementById('studentId').value.trim(),
                    full_name: document.getElementById('studentFullName').value.trim(),
                    grade_id: parseInt(document.getElementById('studentGrade').value)
                };
                
                try {
                    const response = await fetch('/api/students', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify(data)
                    });
                    
                    const result = await response.json();
                    
                    if (result.success) {
                        showNotification('Estudiante agregado exitosamente', 'success');
                        closeModal();
                    } else {
                        showNotification(result.error || 'Error al agregar estudiante', 'error');
                    }
                } catch (error) {
                    showNotification('Error de conexión', 'error');
                }
            });
        })
        .catch(error => {
            showNotification('Error al cargar grados', 'error');
        });
}


