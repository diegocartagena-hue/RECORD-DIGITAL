const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcryptjs');
const path = require('path');
const fs = require('fs');

const dbPath = path.join(__dirname, 'database', 'records.db');
let db = null;

function initDb() {
  return new Promise((resolve, reject) => {
    // Crear directorio si no existe
    const dbDir = path.dirname(dbPath);
    if (!fs.existsSync(dbDir)) {
      fs.mkdirSync(dbDir, { recursive: true });
    }
    
    // Crear conexión
    db = new sqlite3.Database(dbPath, (err) => {
      if (err) {
        console.error('Error al abrir la base de datos:', err);
        reject(err);
        return;
      }
      
      // Habilitar foreign keys
      db.run('PRAGMA foreign_keys = ON');
      
      // Crear tablas
      db.serialize(() => {
        db.run(`
          CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT UNIQUE NOT NULL,
            email TEXT UNIQUE NOT NULL,
            password TEXT NOT NULL,
            role TEXT NOT NULL,
            full_name TEXT NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            active INTEGER DEFAULT 1
          )
        `);
        
        db.run(`
          CREATE TABLE IF NOT EXISTS grades (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            grade_number INTEGER NOT NULL,
            section TEXT NOT NULL,
            year INTEGER NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            UNIQUE(grade_number, section, year)
          )
        `);
        
        db.run(`
          CREATE TABLE IF NOT EXISTS students (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            student_id TEXT UNIQUE NOT NULL,
            full_name TEXT NOT NULL,
            grade_id INTEGER NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (grade_id) REFERENCES grades(id)
          )
        `);
        
        db.run(`
          CREATE TABLE IF NOT EXISTS annotations (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            student_id INTEGER NOT NULL,
            teacher_id INTEGER NOT NULL,
            annotation_type TEXT NOT NULL,
            points INTEGER NOT NULL,
            description TEXT,
            date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (student_id) REFERENCES students(id),
            FOREIGN KEY (teacher_id) REFERENCES users(id)
          )
        `);
        
        db.run(`
          CREATE TABLE IF NOT EXISTS emergency_requests (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            teacher_id INTEGER NOT NULL,
            grade_id INTEGER NOT NULL,
            message TEXT,
            status TEXT DEFAULT 'pending',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            resolved_at TIMESTAMP,
            resolution_notes TEXT,
            FOREIGN KEY (teacher_id) REFERENCES users(id),
            FOREIGN KEY (grade_id) REFERENCES grades(id)
          )
        `, () => {
          // Agregar columna resolution_notes si no existe (para bases de datos existentes)
          db.run(`ALTER TABLE emergency_requests ADD COLUMN resolution_notes TEXT`, (err) => {
            // Ignorar error si la columna ya existe
          });
          // Crear usuarios por defecto
          createDefaultUsers().then(() => {
            console.log('Base de datos inicializada correctamente');
            resolve();
          }).catch(reject);
        });
      });
    });
  });
}

function createDefaultUsers() {
  return new Promise((resolve, reject) => {
    // Verificar si ya existen usuarios
    db.get('SELECT COUNT(*) as count FROM users', (err, row) => {
      if (err) {
        reject(err);
        return;
      }
      
      if (row.count > 0) {
        resolve();
        return;
      }
      
      // Crear administrador
      const adminPassword = bcrypt.hashSync('admin123', 10);
      db.run(`
        INSERT INTO users (username, email, password, role, full_name)
        VALUES (?, ?, ?, ?, ?)
      `, ['admin', 'admin@interamericana.edu', adminPassword, 'admin', 'Administrador Principal'], (err) => {
        if (err && !err.message.includes('UNIQUE constraint')) {
          console.error('Error creando admin:', err);
        }
      });
      
      // Crear coordinador
      const coordPassword = bcrypt.hashSync('coord123', 10);
      db.run(`
        INSERT INTO users (username, email, password, role, full_name)
        VALUES (?, ?, ?, ?, ?)
      `, ['coord', 'coord@interamericana.edu', coordPassword, 'coordinator', 'Coordinador Principal'], (err) => {
        if (err && !err.message.includes('UNIQUE constraint')) {
          console.error('Error creando coordinador:', err);
        }
      });
      
      // Crear maestro
      const teacherPassword = bcrypt.hashSync('maestro123', 10);
      db.run(`
        INSERT INTO users (username, email, password, role, full_name)
        VALUES (?, ?, ?, ?, ?)
      `, ['maestro', 'maestro@interamericana.edu', teacherPassword, 'teacher', 'Maestro Principal'], (err) => {
        if (err && !err.message.includes('UNIQUE constraint')) {
          console.error('Error creando maestro:', err);
        }
        console.log('Usuarios por defecto creados');
        resolve();
      });
    });
  });
}

function getDb() {
  if (!db) {
    throw new Error('Base de datos no inicializada. Llama a initDb() primero.');
  }
  return db;
}

// Funciones helper para hacer las consultas más fáciles
function dbGet(query, params = []) {
  return new Promise((resolve, reject) => {
    db.get(query, params, (err, row) => {
      if (err) reject(err);
      else resolve(row);
    });
  });
}

function dbAll(query, params = []) {
  return new Promise((resolve, reject) => {
    db.all(query, params, (err, rows) => {
      if (err) reject(err);
      else resolve(rows);
    });
  });
}

function dbRun(query, params = []) {
  return new Promise((resolve, reject) => {
    db.run(query, params, function(err) {
      if (err) reject(err);
      else resolve({ lastID: this.lastID, changes: this.changes });
    });
  });
}

module.exports = { initDb, getDb, dbGet, dbAll, dbRun };
