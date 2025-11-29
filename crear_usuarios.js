// Script para crear usuarios si no existen
const { initDb, dbGet, dbRun } = require('./database');
const bcrypt = require('bcryptjs');

async function crearUsuarios() {
  try {
    console.log('Inicializando base de datos...');
    await initDb();
    
    console.log('Verificando usuarios...');
    
    // Verificar y crear admin
    let admin = await dbGet('SELECT * FROM users WHERE email = ?', ['admin@interamericana.edu']);
    if (!admin) {
      const adminPassword = bcrypt.hashSync('admin123', 10);
      await dbRun(`
        INSERT INTO users (username, email, password, role, full_name)
        VALUES (?, ?, ?, ?, ?)
      `, ['admin', 'admin@interamericana.edu', adminPassword, 'admin', 'Administrador Principal']);
      console.log('✓ Usuario admin creado');
    } else {
      console.log('✓ Usuario admin ya existe');
    }
    
    // Verificar y crear coordinador
    let coord = await dbGet('SELECT * FROM users WHERE email = ?', ['coord@interamericana.edu']);
    if (!coord) {
      const coordPassword = bcrypt.hashSync('coord123', 10);
      await dbRun(`
        INSERT INTO users (username, email, password, role, full_name)
        VALUES (?, ?, ?, ?, ?)
      `, ['coord', 'coord@interamericana.edu', coordPassword, 'coordinator', 'Coordinador Principal']);
      console.log('✓ Usuario coordinador creado');
    } else {
      console.log('✓ Usuario coordinador ya existe');
    }
    
    // Verificar y crear maestro
    let maestro = await dbGet('SELECT * FROM users WHERE email = ?', ['maestro@interamericana.edu']);
    if (!maestro) {
      const teacherPassword = bcrypt.hashSync('maestro123', 10);
      await dbRun(`
        INSERT INTO users (username, email, password, role, full_name)
        VALUES (?, ?, ?, ?, ?)
      `, ['maestro', 'maestro@interamericana.edu', teacherPassword, 'teacher', 'Maestro Principal']);
      console.log('✓ Usuario maestro creado');
    } else {
      console.log('✓ Usuario maestro ya existe');
    }
    
    console.log('\n========================================');
    console.log('USUARIOS LISTOS PARA USAR:');
    console.log('========================================');
    console.log('Administrador:');
    console.log('  Email: admin@interamericana.edu');
    console.log('  Password: admin123');
    console.log('\nCoordinador:');
    console.log('  Email: coord@interamericana.edu');
    console.log('  Password: coord123');
    console.log('\nMaestro:');
    console.log('  Email: maestro@interamericana.edu');
    console.log('  Password: maestro123');
    console.log('========================================\n');
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

crearUsuarios();

