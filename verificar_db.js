// Script para verificar la base de datos
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

const dbPath = path.join(__dirname, 'database', 'records.db');

if (!fs.existsSync(dbPath)) {
  console.log('ERROR: La base de datos no existe en:', dbPath);
  process.exit(1);
}

const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Error al abrir la base de datos:', err);
    process.exit(1);
  }
  
  console.log('Base de datos encontrada');
  
  // Verificar usuarios
  db.all('SELECT id, username, email, role FROM users', (err, rows) => {
    if (err) {
      console.error('Error al consultar usuarios:', err);
      db.close();
      process.exit(1);
    }
    
    console.log('\nUsuarios en la base de datos:');
    if (rows.length === 0) {
      console.log('  NO HAY USUARIOS - La base de datos está vacía');
    } else {
      rows.forEach(user => {
        console.log(`  - ${user.email} (${user.role}) - Usuario: ${user.username}`);
      });
    }
    
    db.close();
  });
});

