const { getDb, dbGet } = require('./database');
const bcrypt = require('bcryptjs');

async function verifyPassword(email, password) {
  try {
    const user = await dbGet('SELECT * FROM users WHERE email = ? AND active = 1', [email]);
    
    if (user && bcrypt.compareSync(password, user.password)) {
      return {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
        full_name: user.full_name
      };
    }
    return null;
  } catch (error) {
    console.error('Error verificando password:', error);
    return null;
  }
}

async function getCurrentUser(req) {
  if (!req.session || !req.session.userId) {
    return null;
  }
  
  try {
    const user = await dbGet('SELECT * FROM users WHERE id = ? AND active = 1', [req.session.userId]);
    
    if (user) {
      return {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
        full_name: user.full_name
      };
    }
    return null;
  } catch (error) {
    console.error('Error obteniendo usuario:', error);
    return null;
  }
}

function requireAuth(req, res, next) {
  if (!req.session || !req.session.userId) {
    return res.status(401).json({ error: 'No autenticado' });
  }
  next();
}

function requireRole(...roles) {
  return async (req, res, next) => {
    const user = await getCurrentUser(req);
    if (!user || !roles.includes(user.role)) {
      return res.status(403).json({ error: 'Acceso denegado' });
    }
    next();
  };
}

module.exports = { verifyPassword, getCurrentUser, requireAuth, requireRole };
