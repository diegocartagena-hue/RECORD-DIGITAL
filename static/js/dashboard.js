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
            
            const totalPointsDeducted = annotations.reduce((sum, a) => sum + (a.points || 0), 0);
            const initialConductPoints = 10;
            const currentConductPoints = Math.max(0, initialConductPoints - totalPointsDeducted);
            
            // Determinar color del indicador según puntos de conducta
            let conductColor = '#4caf50'; // Verde
            let conductStatus = 'Excelente';
            if (currentConductPoints <= 3) {
                conductColor = '#d32f2f'; // Rojo
                conductStatus = 'Crítico';
            } else if (currentConductPoints <= 5) {
                conductColor = '#ff9800'; // Naranja
                conductStatus = 'Bajo';
            } else if (currentConductPoints <= 7) {
                conductColor = '#ffc107'; // Amarillo
                conductStatus = 'Regular';
            }
            
            const card = document.createElement('div');
            card.className = 'student-card';
            card.innerHTML = `
                <div class="card-info">
                    <h3>${student.full_name}</h3>
                    <p>ID: ${student.student_id}</p>
                    <p>Anotaciones: ${annotations.length} | Puntos descontados: ${totalPointsDeducted}</p>
                    <div class="conduct-indicator" style="margin-top: 10px;">
                        <div class="conduct-bar-container">
                            <div class="conduct-bar-label">
                                <strong>Puntos de Conducta:</strong> 
                                <span style="color: ${conductColor}; font-weight: bold; font-size: 16px;">
                                    ${currentConductPoints}/10
                                </span>
                                <span class="conduct-status" style="color: ${conductColor}; margin-left: 10px;">
                                    (${conductStatus})
                                </span>
                            </div>
                            <div class="conduct-bar" style="background: #e0e0e0; height: 20px; border-radius: 10px; margin-top: 5px; overflow: hidden; position: relative;">
                                <div class="conduct-bar-fill" style="background: ${conductColor}; height: 100%; width: ${(currentConductPoints / initialConductPoints) * 100}%; transition: width 0.3s ease; border-radius: 10px;"></div>
                            </div>
                        </div>
                    </div>
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
        
        const totalPointsDeducted = annotations.reduce((sum, a) => sum + (a.points || 0), 0);
        const initialConductPoints = 10;
        const currentConductPoints = Math.max(0, initialConductPoints - totalPointsDeducted);
        
        // Determinar color del indicador según puntos de conducta
        let conductColor = '#4caf50'; // Verde
        let conductStatus = 'Excelente';
        if (currentConductPoints <= 3) {
            conductColor = '#d32f2f'; // Rojo
            conductStatus = 'Crítico';
        } else if (currentConductPoints <= 5) {
            conductColor = '#ff9800'; // Naranja
            conductStatus = 'Bajo';
        } else if (currentConductPoints <= 7) {
            conductColor = '#ffc107'; // Amarillo
            conductStatus = 'Regular';
        }
        
        const isAdmin = currentUser && currentUser.role === 'admin';
        
        let html = `
            <h2>Anotaciones de ${studentName}</h2>
            <div class="conduct-indicator" style="margin-bottom: 20px; padding: 15px; background: #f9f9f9; border-radius: 8px; border-left: 3px solid ${conductColor};">
                <div class="conduct-bar-label">
                    <strong>Puntos de Conducta Actuales:</strong> 
                    <span style="color: ${conductColor}; font-weight: bold; font-size: 18px; margin-left: 10px;">
                        ${currentConductPoints}/10
                    </span>
                    <span class="conduct-status" style="color: ${conductColor}; margin-left: 10px;">
                        (${conductStatus})
                    </span>
                </div>
                <div class="conduct-bar" style="background: #e0e0e0; height: 25px; border-radius: 12px; margin-top: 10px; overflow: hidden; position: relative;">
                    <div class="conduct-bar-fill" style="background: ${conductColor}; height: 100%; width: ${(currentConductPoints / initialConductPoints) * 100}%; transition: width 0.3s ease; border-radius: 12px; display: flex; align-items: center; justify-content: center; color: white; font-weight: bold;">
                        ${currentConductPoints}/10
                    </div>
                </div>
                <p style="margin-top: 10px; font-size: 12px; color: #666;">
                    Puntos descontados: ${totalPointsDeducted} | Total de anotaciones: ${annotations.length}
                </p>
            </div>
        `;
        
        if (annotations.length === 0) {
            html += '<p>No hay anotaciones registradas</p>';
        } else {
            html += '<div class="annotations-list">';
            annotations.forEach(ann => {
                const date = new Date(ann.date);
                const editButton = isAdmin ? `
                    <button class="btn btn-sm btn-primary" onclick="showEditAnnotationModal(${ann.id}, '${ann.annotation_type}', ${ann.points}, '${(ann.description || '').replace(/'/g, "\\'")}')" style="margin-top: 5px;">
                        ✏️ Editar
                    </button>
                ` : '';
                html += `
                    <div class="annotation-item" style="padding: 15px; margin-bottom: 10px; background: #f5f5f5; border-radius: 5px; border-left: 4px solid ${getAnnotationColor(ann.annotation_type)}">
                        <strong>${getAnnotationTypeLabel(ann.annotation_type)}</strong> - ${ann.points} puntos descontados
                        <p>${ann.description || 'Sin descripción'}</p>
                        <small>Por: ${ann.teacher_name} - ${date.toLocaleString()}</small>
                        ${editButton}
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

window.showEditAnnotationModal = function(annotationId, currentType, currentPoints, currentDescription) {
    const html = `
        <h2>Editar Anotación</h2>
        <form id="editAnnotationForm">
            <div class="form-group">
                <label>Tipo de Falta</label>
                <select id="editAnnotationType" class="form-control" required>
                    <option value="leve" ${currentType === 'leve' ? 'selected' : ''}>Leve (5 puntos)</option>
                    <option value="grave" ${currentType === 'grave' ? 'selected' : ''}>Grave (10 puntos)</option>
                    <option value="muy_grave" ${currentType === 'muy_grave' ? 'selected' : ''}>Muy Grave (20 puntos)</option>
                </select>
            </div>
            <div class="form-group">
                <label>Puntos</label>
                <input type="number" id="editAnnotationPoints" class="form-control" value="${currentPoints}" required>
            </div>
            <div class="form-group">
                <label>Descripción</label>
                <textarea id="editAnnotationDescription" class="form-control" rows="4">${currentDescription || ''}</textarea>
            </div>
            <button type="submit" class="btn btn-primary">Guardar Cambios</button>
            <button type="button" class="btn btn-secondary" onclick="closeModal()" style="margin-left: 10px;">Cancelar</button>
        </form>
    `;
    
    showModal(html);
    
    // Actualizar puntos cuando cambie el tipo
    document.getElementById('editAnnotationType').addEventListener('change', (e) => {
        const type = e.target.value;
        const pointsInput = document.getElementById('editAnnotationPoints');
        if (type === 'leve') {
            pointsInput.value = 5;
        } else if (type === 'grave') {
            pointsInput.value = 10;
        } else if (type === 'muy_grave') {
            pointsInput.value = 20;
        }
    });
    
    const form = document.getElementById('editAnnotationForm');
    if (form) {
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const data = {
                annotation_type: document.getElementById('editAnnotationType').value,
                points: parseInt(document.getElementById('editAnnotationPoints').value),
                description: document.getElementById('editAnnotationDescription').value.trim()
            };
            
            try {
                const response = await fetch(`/api/annotations/${annotationId}`, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(data)
                });
                
                const result = await response.json();
                
                if (result.success) {
                    showNotification('Anotación actualizada exitosamente', 'success');
                    closeModal();
                    // Recargar la vista de anotaciones si está abierta
                    // Esto requeriría pasar el studentId, pero por ahora cerramos y el usuario puede volver a abrir
                } else {
                    showNotification(result.error || 'Error al actualizar anotación', 'error');
                }
            } catch (error) {
                console.error('Error actualizando anotación:', error);
                showNotification('Error de conexión', 'error');
            }
        });
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
        
        // Verificar si el usuario es administrador
        const isAdmin = currentUser && currentUser.role === 'admin';
        
        // Obtener conteo de estudiantes por grado
        for (const grade of grades) {
            try {
                const studentsResponse = await fetch(`/api/students/${grade.id}`);
                const students = await studentsResponse.json();
                const studentCount = students ? students.length : 0;
                
                const card = document.createElement('div');
                card.className = 'grade-card';
                
                let actionsHTML = '';
                if (isAdmin) {
                    actionsHTML = `
                        <div class="card-actions">
                            <button class="btn btn-primary btn-sm" onclick="showAddStudentToGradeModal(${grade.id}, '${grade.grade_number}° ${grade.section}')">
                                ➕ Agregar Estudiante
                            </button>
                            <button class="btn btn-success btn-sm" onclick="showImportStudentsToGradeModal(${grade.id}, '${grade.grade_number}° ${grade.section}')">
                                📥 Importar Lista
                            </button>
                        </div>
                    `;
                }
                
                card.innerHTML = `
                    <div class="card-info">
                        <h3>${grade.grade_number}° ${grade.section}</h3>
                        <p>Año: ${grade.year}</p>
                        <p style="margin-top: 5px;"><strong>Estudiantes:</strong> ${studentCount}</p>
                    </div>
                    ${actionsHTML}
                `;
                container.appendChild(card);
            } catch (error) {
                console.error(`Error cargando estudiantes para grado ${grade.id}:`, error);
                // Crear tarjeta sin conteo si hay error
                const card = document.createElement('div');
                card.className = 'grade-card';
                let actionsHTML = '';
                if (isAdmin) {
                    actionsHTML = `
                        <div class="card-actions">
                            <button class="btn btn-primary btn-sm" onclick="showAddStudentToGradeModal(${grade.id}, '${grade.grade_number}° ${grade.section}')">
                                ➕ Agregar Estudiante
                            </button>
                            <button class="btn btn-success btn-sm" onclick="showImportStudentsToGradeModal(${grade.id}, '${grade.grade_number}° ${grade.section}')">
                                📥 Importar Lista
                            </button>
                        </div>
                    `;
                }
                card.innerHTML = `
                    <div class="card-info">
                        <h3>${grade.grade_number}° ${grade.section}</h3>
                        <p>Año: ${grade.year}</p>
                    </div>
                    ${actionsHTML}
                `;
                container.appendChild(card);
            }
        }
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
        // Cargar todas las emergencias (pendientes, en progreso y resueltas)
        const response = await fetch('/api/emergency/requests?status=all');
        if (!response.ok) {
            console.error('No autorizado para ver emergencias');
            return;
        }
        
        const requests = await response.json();
        const container = document.getElementById('emergencyRequests');
        if (!container) return;
        
        // Filtrar por estado
        const pendingRequests = requests.filter(r => r.status === 'pending');
        const inProgressRequests = requests.filter(r => r.status === 'in_progress');
        const resolvedRequests = requests.filter(r => r.status === 'resolved');
        
        container.innerHTML = '';
        
        // Mostrar pendientes primero
        if (pendingRequests.length > 0) {
            const section = document.createElement('div');
            section.className = 'emergency-section';
            section.innerHTML = '<h3 style="color: #d32f2f; margin-bottom: 15px;">🚨 Pendientes</h3>';
            container.appendChild(section);
            
            pendingRequests.forEach(req => {
                section.appendChild(createEmergencyCard(req, true));
            });
        }
        
        // Mostrar en progreso
        if (inProgressRequests.length > 0) {
            const section = document.createElement('div');
            section.className = 'emergency-section';
            section.innerHTML = '<h3 style="color: #ff9800; margin-top: 30px; margin-bottom: 15px;">⏳ En Progreso</h3>';
            container.appendChild(section);
            
            inProgressRequests.forEach(req => {
                section.appendChild(createEmergencyCard(req, false));
            });
        }
        
        // Mostrar resueltas (solo últimas 10)
        if (resolvedRequests.length > 0) {
            const section = document.createElement('div');
            section.className = 'emergency-section';
            section.innerHTML = '<h3 style="color: #4caf50; margin-top: 30px; margin-bottom: 15px;">✅ Resueltas (Últimas 10)</h3>';
            container.appendChild(section);
            
            resolvedRequests.slice(0, 10).forEach(req => {
                section.appendChild(createEmergencyCard(req, false));
            });
        }
        
        if (requests.length === 0) {
            container.innerHTML = '<p class="text-center">No hay solicitudes de emergencia</p>';
        }
    } catch (error) {
        console.error('Error cargando emergencias:', error);
    }
}

function createEmergencyCard(req, isPending) {
    const date = new Date(req.created_at);
    const card = document.createElement('div');
    card.className = `emergency-card ${req.status}`;
    card.id = `emergency-card-${req.id}`;
    
    let statusBadge = '';
    if (req.status === 'pending') {
        statusBadge = '<span class="status-badge pending">Pendiente</span>';
    } else if (req.status === 'in_progress') {
        statusBadge = '<span class="status-badge in-progress">En Camino</span>';
    } else {
        statusBadge = '<span class="status-badge resolved">Resuelto</span>';
    }
    
    let buttonsHTML = '';
    if (req.status === 'pending') {
        buttonsHTML = `
            <button class="btn btn-warning" onclick="setEmergencyStatus(${req.id}, 'in_progress')">
                🚗 En Camino
            </button>
            <button class="btn btn-success" onclick="showResolveEmergencyModal(${req.id})">
                ✅ Marcar como Resuelto
            </button>
        `;
    } else if (req.status === 'in_progress') {
        buttonsHTML = `
            <button class="btn btn-success" onclick="showResolveEmergencyModal(${req.id})">
                ✅ Marcar como Resuelto
            </button>
        `;
    }
    
    let resolutionHTML = '';
    if (req.status === 'resolved' && req.resolution_notes) {
        const resolvedDate = req.resolved_at ? new Date(req.resolved_at) : null;
        resolutionHTML = `
            <div class="resolution-section" style="margin-top: 15px; padding: 10px; background: #e8f5e9; border-radius: 5px; border-left: 3px solid #4caf50;">
                <strong>Resolución:</strong>
                <p>${req.resolution_notes}</p>
                ${resolvedDate ? `<small>Resuelto el: ${resolvedDate.toLocaleString()}</small>` : ''}
            </div>
        `;
    }
    
    card.innerHTML = `
        <div class="emergency-card-header">
            <h3>🚨 ${req.teacher_name}</h3>
            ${statusBadge}
        </div>
        <p><strong>Grado:</strong> ${req.grade_number}° ${req.section}</p>
        <p><strong>Mensaje:</strong> ${req.message || 'Solicitud de asistencia urgente'}</p>
        <p class="emergency-time">Solicitado: ${date.toLocaleString()}</p>
        ${resolutionHTML}
        <div class="emergency-card-actions" style="margin-top: 15px; display: flex; gap: 10px;">
            ${buttonsHTML}
        </div>
    `;
    
    return card;
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
                    console.log('Enviando solicitud de emergencia:', data);
                    const response = await fetch('/api/emergency', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify(data)
                    });
                    
                    const result = await response.json();
                    console.log('Respuesta del servidor:', result);
                    
                    if (result.success) {
                        showNotification('✅ Solicitud de emergencia enviada correctamente', 'success');
                        closeModal();
                    } else {
                        showNotification(result.error || 'Error al enviar solicitud', 'error');
                        console.error('Error en respuesta:', result);
                    }
                } catch (error) {
                    console.error('Error enviando emergencia:', error);
                    showNotification('Error de conexión al enviar solicitud', 'error');
                }
            });
        });
}

// Funciones globales para emergencias
window.setEmergencyStatus = async function(requestId, status) {
    try {
        const response = await fetch(`/api/emergency/${requestId}/status`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ status: status })
        });
        
        const result = await response.json();
        
        if (result.success) {
            const statusText = status === 'in_progress' ? 'marcada como "En Camino"' : 'actualizada';
            showNotification(`Emergencia ${statusText}`, 'success');
            
            // Cerrar notificación persistente si existe
            if (typeof dismissEmergencyNotification === 'function') {
                dismissEmergencyNotification(requestId);
            }
            
            loadEmergencyRequests();
            if (typeof loadDashboardStats === 'function') {
                loadDashboardStats();
            }
        } else {
            showNotification(result.error || 'Error al actualizar emergencia', 'error');
        }
    } catch (error) {
        console.error('Error actualizando emergencia:', error);
        showNotification('Error de conexión', 'error');
    }
}

window.showResolveEmergencyModal = function(requestId) {
    const html = `
        <h2>Resolver Emergencia</h2>
        <form id="resolveEmergencyForm">
            <div class="form-group">
                <label>Notas de Resolución</label>
                <textarea id="resolutionNotes" class="form-control" rows="4" placeholder="Describa cómo se resolvió la emergencia..."></textarea>
            </div>
            <button type="submit" class="btn btn-success">Marcar como Resuelto</button>
            <button type="button" class="btn btn-secondary" onclick="closeModal()" style="margin-left: 10px;">Cancelar</button>
        </form>
    `;
    
    showModal(html);
    
    const form = document.getElementById('resolveEmergencyForm');
    if (form) {
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const resolutionNotes = document.getElementById('resolutionNotes').value.trim();
            
            try {
                const response = await fetch(`/api/emergency/${requestId}/status`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ 
                        status: 'resolved',
                        resolution_notes: resolutionNotes
                    })
                });
                
                const result = await response.json();
                
                if (result.success) {
                    showNotification('Emergencia resuelta exitosamente', 'success');
                    closeModal();
                    
                    // Cerrar notificación persistente
                    if (typeof dismissEmergencyNotification === 'function') {
                        dismissEmergencyNotification(requestId);
                    }
                    
                    loadEmergencyRequests();
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
        });
    }
}

window.resolveEmergency = async function(requestId) {
    showResolveEmergencyModal(requestId);
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

// Función para agregar estudiante a un grado específico
window.showAddStudentToGradeModal = function(gradeId, gradeName) {
    const html = `
        <h2>Agregar Estudiante a ${gradeName}</h2>
        <form id="addStudentToGradeForm">
            <div class="form-group">
                <label>ID de Estudiante</label>
                <input type="text" id="studentIdToGrade" class="form-control" required placeholder="Ej: 2024001">
            </div>
            <div class="form-group">
                <label>Nombre Completo</label>
                <input type="text" id="studentFullNameToGrade" class="form-control" required placeholder="Ej: Juan Pérez">
            </div>
            <button type="submit" class="btn btn-primary">Agregar Estudiante</button>
        </form>
    `;
    
    showModal(html);
    
    const form = document.getElementById('addStudentToGradeForm');
    if (form) {
        const newForm = form.cloneNode(true);
        form.parentNode.replaceChild(newForm, form);
        
        newForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const data = {
                student_id: document.getElementById('studentIdToGrade').value.trim(),
                full_name: document.getElementById('studentFullNameToGrade').value.trim(),
                grade_id: gradeId
            };
            
            if (!data.student_id || !data.full_name) {
                showNotification('Por favor complete todos los campos', 'error');
                return;
            }
            
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
                    loadGradesList(); // Recargar lista de grados para actualizar conteo
                } else {
                    showNotification(result.error || 'Error al agregar estudiante', 'error');
                }
            } catch (error) {
                console.error('Error agregando estudiante:', error);
                showNotification('Error de conexión', 'error');
            }
        });
    }
}

// Función para importar estudiantes a un grado específico
window.showImportStudentsToGradeModal = function(gradeId, gradeName) {
    const html = `
        <h2>Importar Estudiantes a ${gradeName}</h2>
        <form id="importStudentsToGradeForm">
            <div class="form-group">
                <label>Seleccionar archivo (Excel o CSV)</label>
                <input type="file" id="importFileToGrade" accept=".xlsx,.xls,.csv" class="form-control" required>
                <small style="display: block; margin-top: 5px; color: #666;">
                    El archivo debe contener columnas: student_id (o id), full_name (o nombre)
                </small>
            </div>
            <button type="submit" class="btn btn-primary">Importar Estudiantes</button>
        </form>
    `;
    
    showModal(html);
    
    const form = document.getElementById('importStudentsToGradeForm');
    if (form) {
        const newForm = form.cloneNode(true);
        form.parentNode.replaceChild(newForm, form);
        
        newForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const fileInput = document.getElementById('importFileToGrade');
            if (!fileInput.files.length) {
                showNotification('Seleccione un archivo', 'error');
                return;
            }
            
            const formData = new FormData();
            formData.append('file', fileInput.files[0]);
            formData.append('grade_id', gradeId);
            
            try {
                const response = await fetch('/api/students/import', {
                    method: 'POST',
                    body: formData
                });
                
                const result = await response.json();
                
                if (result.success) {
                    let message = `${result.imported} estudiantes importados exitosamente a ${gradeName}`;
                    if (result.errors && result.errors.length > 0) {
                        message += `. ${result.errors.length} errores encontrados.`;
                        console.warn('Errores de importación:', result.errors);
                    }
                    showNotification(message, 'success');
                    closeModal();
                    loadGradesList(); // Recargar lista de grados para actualizar conteo
                } else {
                    showNotification(result.error || 'Error al importar estudiantes', 'error');
                }
            } catch (error) {
                console.error('Error importando estudiantes:', error);
                showNotification('Error de conexión', 'error');
            }
        });
    }
}

// Hacer la función disponible globalmente
window.showAddStudentModal = function() {
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
            if (form) {
                // Remover listeners anteriores si existen
                const newForm = form.cloneNode(true);
                form.parentNode.replaceChild(newForm, form);
                
                newForm.addEventListener('submit', async (e) => {
                    e.preventDefault();
                    
                    const data = {
                        student_id: document.getElementById('studentId').value.trim(),
                        full_name: document.getElementById('studentFullName').value.trim(),
                        grade_id: parseInt(document.getElementById('studentGrade').value)
                    };
                    
                    // Validación
                    if (!data.student_id || !data.full_name || !data.grade_id) {
                        showNotification('Por favor complete todos los campos', 'error');
                        return;
                    }
                    
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
                            // Recargar lista de estudiantes si estamos en esa página
                            const studentGradeFilter = document.getElementById('studentGradeFilter');
                            if (studentGradeFilter && studentGradeFilter.value) {
                                loadStudentsList(studentGradeFilter.value);
                            }
                        } else {
                            showNotification(result.error || 'Error al agregar estudiante', 'error');
                        }
                    } catch (error) {
                        console.error('Error agregando estudiante:', error);
                        showNotification('Error de conexión. Verifique su conexión a internet.', 'error');
                    }
                });
            }
        })
        .catch(error => {
            console.error('Error cargando grados:', error);
            showNotification('Error al cargar grados', 'error');
        });
}


