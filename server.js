const express = require('express');
const session = require('express-session');
const cors = require('cors');
const http = require('http');
const socketIo = require('socket.io');
const path = require('path');
const { initDb, getDb, dbGet, dbAll, dbRun } = require('./database');
const { verifyPassword, getCurrentUser, requireAuth, requireRole } = require('./auth');
const multer = require('multer');
const XLSX = require('xlsx');
const fs = require('fs');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

// Configuración
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static('static'));
app.use(session({
  secret: 'escuela-interamericana-secret-key-2024',
  resave: false,
  saveUninitialized: false,
  cookie: { secure: false, maxAge: 24 * 60 * 60 * 1000 } // 24 horas
}));

// Configurar multer para archivos
const upload = multer({ dest: 'uploads/' });

// Inicializar base de datos
initDb().catch(err => {
  console.error('Error al inicializar base de datos:', err);
  process.exit(1);
});

// ==================== RUTAS PÚBLICAS ====================

app.get('/', (req, res) => {
  if (req.session.userId) {
    return res.sendFile(path.join(__dirname, 'templates', 'dashboard.html'));
  }
  res.sendFile(path.join(__dirname, 'templates', 'login.html'));
});

app.post('/api/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    const user = await verifyPassword(email, password);
    if (user) {
      req.session.userId = user.id;
      req.session.userRole = user.role;
      return res.json({
        success: true,
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          role: user.role,
          full_name: user.full_name
        }
      });
    }
    res.status(401).json({ success: false, error: 'Credenciales inválidas' });
  } catch (error) {
    console.error('Error en login:', error);
    res.status(500).json({ success: false, error: 'Error del servidor' });
  }
});

app.post('/api/logout', (req, res) => {
  req.session.destroy();
  res.json({ success: true });
});

app.get('/api/user/current', requireAuth, async (req, res) => {
  const user = await getCurrentUser(req);
  if (user) {
    return res.json({
      id: user.id,
      username: user.username,
      email: user.email,
      role: user.role,
      full_name: user.full_name
    });
  }
  res.status(404).json({ error: 'Usuario no encontrado' });
});

// ==================== RUTAS DE MAESTRO ====================

app.get('/api/grades', requireAuth, async (req, res) => {
  const year = req.query.year || new Date().getFullYear();
  try {
    const grades = await dbAll('SELECT * FROM grades WHERE year = ? ORDER BY grade_number, section', [year]);
    res.json(grades);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/students/:gradeId', requireAuth, async (req, res) => {
  try {
    const students = await dbAll('SELECT * FROM students WHERE grade_id = ? ORDER BY full_name', [req.params.gradeId]);
    res.json(students);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/annotations', requireAuth, async (req, res) => {
  try {
    const user = await getCurrentUser(req);
    const { student_id, annotation_type, points, description } = req.body;
    
    const result = await dbRun(`
      INSERT INTO annotations (student_id, teacher_id, annotation_type, points, description)
      VALUES (?, ?, ?, ?, ?)
    `, [student_id, user.id, annotation_type, points, description || '']);
    
    // Notificar a coordinadores
    io.to('coordinators').emit('new_annotation', {
      annotation_id: result.lastID,
      teacher: user.full_name
    });
    
    res.json({ success: true, annotation_id: result.lastID });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/students/:studentId/annotations', requireAuth, async (req, res) => {
  try {
    const annotations = await dbAll(`
      SELECT a.*, u.full_name as teacher_name
      FROM annotations a
      JOIN users u ON a.teacher_id = u.id
      WHERE a.student_id = ?
      ORDER BY a.date DESC
    `, [req.params.studentId]);
    res.json(annotations);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/annotations/:annotationId', requireAuth, requireRole('admin'), async (req, res) => {
  try {
    const { annotation_type, points, description } = req.body;
    
    if (!annotation_type || !points) {
      return res.status(400).json({ error: 'Se requieren annotation_type y points' });
    }
    
    await dbRun(`
      UPDATE annotations 
      SET annotation_type = ?, points = ?, description = ?
      WHERE id = ?
    `, [annotation_type, points, description || '', req.params.annotationId]);
    
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/statistics/top-students', requireAuth, async (req, res) => {
  try {
    const gradeId = req.query.grade_id;
    const limit = parseInt(req.query.limit) || 10;
    
    let query, params;
    if (gradeId) {
      query = `
        SELECT s.*, g.grade_number, g.section,
               COUNT(a.id) as total_annotations,
               COALESCE(SUM(a.points), 0) as total_points
        FROM students s
        JOIN grades g ON s.grade_id = g.id
        LEFT JOIN annotations a ON s.id = a.student_id
        WHERE s.grade_id = ?
        GROUP BY s.id
        ORDER BY total_annotations DESC, total_points DESC
        LIMIT ?
      `;
      params = [gradeId, limit];
    } else {
      query = `
        SELECT s.*, g.grade_number, g.section,
               COUNT(a.id) as total_annotations,
               COALESCE(SUM(a.points), 0) as total_points
        FROM students s
        JOIN grades g ON s.grade_id = g.id
        LEFT JOIN annotations a ON s.id = a.student_id
        GROUP BY s.id
        ORDER BY total_annotations DESC, total_points DESC
        LIMIT ?
      `;
      params = [limit];
    }
    
    const students = await dbAll(query, params);
    res.json(students);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/emergency', requireAuth, async (req, res) => {
  try {
    const user = await getCurrentUser(req);
    
    if (user.role !== 'teacher') {
      return res.status(403).json({ error: 'Solo maestros pueden crear emergencias' });
    }
    
    const { grade_id, message } = req.body;
    
    // Obtener información del grado
    const grade = await dbGet('SELECT grade_number, section FROM grades WHERE id = ?', [grade_id]);
    if (!grade) {
      return res.status(400).json({ error: 'Grado no encontrado' });
    }
    
    const result = await dbRun(`
      INSERT INTO emergency_requests (teacher_id, grade_id, message, status)
      VALUES (?, ?, ?, 'pending')
    `, [user.id, grade_id, message || 'Solicitud de asistencia urgente']);
    
    // Notificar a coordinadores en tiempo real
    const emergencyData = {
      request_id: result.lastID,
      teacher: user.full_name,
      grade_id: grade_id,
      grade_number: grade.grade_number,
      section: grade.section,
      message: message || 'Solicitud de asistencia urgente',
      created_at: new Date().toISOString()
    };
    
    console.log('Enviando alerta de emergencia a coordinadores y administradores:', emergencyData);
    
    // Notificar a coordinadores y administradores
    io.to('coordinators').emit('emergency_request', emergencyData);
    io.to('admins').emit('emergency_request', emergencyData);
    
    // También emitir a todos los sockets por si acaso (fallback)
    io.emit('emergency_request', emergencyData);
    
    res.json({ success: true, request_id: result.lastID });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ==================== RUTAS DE COORDINADOR ====================

app.get('/api/teachers', requireAuth, requireRole('coordinator', 'admin'), async (req, res) => {
  try {
    const teachers = await dbAll(`
      SELECT id, username, email, full_name, created_at 
      FROM users 
      WHERE role = 'teacher' AND active = 1
    `);
    res.json(teachers);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/teachers', requireAuth, requireRole('coordinator', 'admin'), async (req, res) => {
  try {
    const { username, email, password, full_name } = req.body;
    const bcrypt = require('bcryptjs');
    const passwordHash = bcrypt.hashSync(password, 10);
    
    const result = await dbRun(`
      INSERT INTO users (username, email, password, role, full_name)
      VALUES (?, ?, ?, 'teacher', ?)
    `, [username, email, passwordHash, full_name]);
    res.json({ success: true, teacher_id: result.lastID });
  } catch (error) {
    res.status(400).json({ error: 'Usuario o email ya existe' });
  }
});

app.delete('/api/teachers/:teacherId', requireAuth, requireRole('coordinator', 'admin'), async (req, res) => {
  try {
    await dbRun('UPDATE users SET active = 0 WHERE id = ? AND role = ?', [req.params.teacherId, 'teacher']);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/emergency/requests', requireAuth, requireRole('coordinator', 'admin'), async (req, res) => {
  try {
    const status = req.query.status || 'pending';
    let query = `
      SELECT er.*, u.full_name as teacher_name, g.grade_number, g.section
      FROM emergency_requests er
      JOIN users u ON er.teacher_id = u.id
      JOIN grades g ON er.grade_id = g.id
    `;
    
    if (status === 'all') {
      query += ` ORDER BY er.created_at DESC`;
    } else {
      query += ` WHERE er.status = ? ORDER BY er.created_at DESC`;
    }
    
    const requests = status === 'all' 
      ? await dbAll(query)
      : await dbAll(query, [status]);
    res.json(requests);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/emergency/:requestId/status', requireAuth, requireRole('coordinator', 'admin'), async (req, res) => {
  try {
    const { status, resolution_notes } = req.body;
    
    if (!['pending', 'in_progress', 'resolved'].includes(status)) {
      return res.status(400).json({ error: 'Estado inválido' });
    }
    
    let query = `UPDATE emergency_requests SET status = ?`;
    let params = [status, req.params.requestId];
    
    if (status === 'resolved') {
      query += `, resolved_at = datetime('now')`;
      if (resolution_notes) {
        query += `, resolution_notes = ?`;
        params.splice(1, 0, resolution_notes);
      }
    }
    
    query += ` WHERE id = ?`;
    
    await dbRun(query, params);
    
    // Notificar al maestro sobre el cambio de estado
    const request = await dbGet(`
      SELECT er.*, u.full_name as teacher_name, g.grade_number, g.section
      FROM emergency_requests er
      JOIN users u ON er.teacher_id = u.id
      JOIN grades g ON er.grade_id = g.id
      WHERE er.id = ?
    `, [req.params.requestId]);
    
    if (request) {
      io.emit('emergency_status_update', {
        request_id: req.params.requestId,
        status: status,
        teacher_name: request.teacher_name
      });
    }
    
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/emergency/:requestId/resolve', requireAuth, requireRole('coordinator', 'admin'), async (req, res) => {
  try {
    const { resolution_notes } = req.body;
    let query = `UPDATE emergency_requests SET status = 'resolved', resolved_at = datetime('now')`;
    let params = [req.params.requestId];
    
    if (resolution_notes) {
      query += `, resolution_notes = ?`;
      params.unshift(resolution_notes);
    }
    
    query += ` WHERE id = ?`;
    
    await dbRun(query, params);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ==================== RUTAS DE ADMINISTRADOR ====================

app.get('/api/coordinators', requireAuth, requireRole('admin'), async (req, res) => {
  try {
    const coordinators = await dbAll(`
      SELECT id, username, email, full_name, created_at 
      FROM users 
      WHERE role = 'coordinator' AND active = 1
    `);
    res.json(coordinators);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/coordinators', requireAuth, requireRole('admin'), async (req, res) => {
  try {
    const { username, email, password, full_name } = req.body;
    const bcrypt = require('bcryptjs');
    const passwordHash = bcrypt.hashSync(password, 10);
    
    const result = await dbRun(`
      INSERT INTO users (username, email, password, role, full_name)
      VALUES (?, ?, ?, 'coordinator', ?)
    `, [username, email, passwordHash, full_name]);
    res.json({ success: true, coordinator_id: result.lastID });
  } catch (error) {
    res.status(400).json({ error: 'Usuario o email ya existe' });
  }
});

app.post('/api/grades', requireAuth, requireRole('admin'), async (req, res) => {
  try {
    const { grade_number, section, year } = req.body;
    const gradeYear = year || new Date().getFullYear();
    
    const result = await dbRun(`
      INSERT INTO grades (grade_number, section, year)
      VALUES (?, ?, ?)
    `, [grade_number, section, gradeYear]);
    res.json({ success: true, grade_id: result.lastID });
  } catch (error) {
    res.status(400).json({ error: 'El grado ya existe para este año' });
  }
});

app.post('/api/students', requireAuth, requireRole('admin'), async (req, res) => {
  try {
    const { student_id, full_name, grade_id } = req.body;
    
    if (!student_id || !full_name || !grade_id) {
      return res.status(400).json({ error: 'Se requieren student_id, full_name y grade_id' });
    }
    
    const result = await dbRun(
      'INSERT INTO students (student_id, full_name, grade_id) VALUES (?, ?, ?)',
      [String(student_id), String(full_name), grade_id]
    );
    
    res.json({ success: true, student_id: result.lastID });
  } catch (error) {
    if (error.message.includes('UNIQUE constraint')) {
      res.status(400).json({ error: 'El ID de estudiante ya existe' });
    } else {
      res.status(500).json({ error: error.message });
    }
  }
});

app.post('/api/students/import', requireAuth, requireRole('admin'), upload.single('file'), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No se proporcionó archivo' });
  }
  
  const { grade_id } = req.body;
  if (!grade_id) {
    return res.status(400).json({ error: 'Se requiere grade_id' });
  }
  
  try {
    let data = [];
    const fileExt = path.extname(req.file.originalname).toLowerCase();
    
    // Procesar CSV o Excel
    if (fileExt === '.csv') {
      const csvContent = fs.readFileSync(req.file.path, 'utf-8');
      const lines = csvContent.split('\n').filter(line => line.trim());
      const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
      
      for (let i = 1; i < lines.length; i++) {
        const values = lines[i].split(',').map(v => v.trim());
        const row = {};
        headers.forEach((header, index) => {
          row[header] = values[index] || '';
        });
        data.push(row);
      }
    } else {
      // Procesar Excel
      const workbook = XLSX.readFile(req.file.path);
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      data = XLSX.utils.sheet_to_json(worksheet);
    }
    
    let imported = 0;
    let errors = [];
    
    for (const row of data) {
      // Buscar columnas con diferentes nombres posibles
      const studentId = row.student_id || row['student id'] || row.id || row['id estudiante'] || row['id_estudiante'];
      const fullName = row.full_name || row['full name'] || row.nombre || row.name || row['nombre completo'] || row['nombre_completo'];
      
      if (studentId && fullName) {
        try {
          await dbRun('INSERT OR IGNORE INTO students (student_id, full_name, grade_id) VALUES (?, ?, ?)', 
            [String(studentId), String(fullName), grade_id]);
          imported++;
        } catch (err) {
          errors.push(`Error con ${fullName}: ${err.message}`);
        }
      }
    }
    
    // Eliminar archivo temporal
    fs.unlinkSync(req.file.path);
    
    res.json({ success: true, imported, errors: errors.length > 0 ? errors : undefined });
  } catch (error) {
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    res.status(400).json({ error: error.message });
  }
});

app.get('/api/export/database', requireAuth, requireRole('admin'), (req, res) => {
  const year = req.query.year || new Date().getFullYear();
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
  const backupPath = `database/backup_${year}_${timestamp}.db`;
  
  const db = getDb();
  fs.copyFileSync('database/records.db', backupPath);
  
  res.download(backupPath, `backup_${year}_${timestamp}.db`, (err) => {
    if (err) {
      console.error('Error al descargar:', err);
    }
  });
});

app.post('/api/database/new-year', requireAuth, requireRole('admin'), async (req, res) => {
  try {
    const { year } = req.body;
    const newYear = year || new Date().getFullYear() + 1;
    
    // Hacer backup
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
    const backupPath = `database/backup_${new Date().getFullYear()}_${timestamp}.db`;
    fs.copyFileSync('database/records.db', backupPath);
    
    // Crear nuevos grados
    const oldGrades = await dbAll('SELECT grade_number, section FROM grades WHERE year = ?', [new Date().getFullYear()]);
    
    for (const grade of oldGrades) {
      try {
        await dbRun('INSERT OR IGNORE INTO grades (grade_number, section, year) VALUES (?, ?, ?)', 
          [grade.grade_number, grade.section, newYear]);
      } catch (err) {
        // Ignorar errores de duplicados
      }
    }
    
    res.json({ success: true, new_year: newYear, backup: backupPath });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ==================== WEBSOCKETS ====================

io.on('connection', (socket) => {
  console.log('Cliente conectado:', socket.id);
  
  socket.on('join_coordinator_room', async () => {
    try {
      socket.join('coordinators');
      console.log(`Cliente ${socket.id} unido a la sala de coordinadores`);
      socket.emit('joined_room', { room: 'coordinators' });
    } catch (error) {
      console.error('Error uniendo a sala de coordinadores:', error);
    }
  });
  
  socket.on('join_admin_room', async () => {
    try {
      socket.join('admins');
      console.log(`Cliente ${socket.id} unido a la sala de administradores`);
      socket.emit('joined_room', { room: 'admins' });
    } catch (error) {
      console.error('Error uniendo a sala de administradores:', error);
    }
  });
  
  socket.on('disconnect', () => {
    console.log('Cliente desconectado:', socket.id);
  });
});

// Iniciar servidor
const PORT = process.env.PORT || 5000;
server.listen(PORT, '127.0.0.1', () => {
  console.log('='.repeat(60));
  console.log('  SISTEMA DE REGISTRO DIGITAL');
  console.log('  Escuela Interamericana');
  console.log('='.repeat(60));
  console.log(`\n  Servidor iniciado en: http://localhost:${PORT}`);
  console.log(`  También disponible en: http://127.0.0.1:${PORT}`);
  console.log('\n  Presiona Ctrl+C para detener el servidor\n');
  console.log('='.repeat(60) + '\n');
});

