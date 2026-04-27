const jwt = require('jsonwebtoken');
require('dotenv').config();

const JWT_SECRET = process.env.JWT_SECRET || 'your_super_secret_jwt_key';

/**
 * Middleware to protect routes and verify JWT
 */
const protect = (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return res.status(401).json({ error: 'Not authorized to access this route' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded; // Contains id, role, permissions
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
};

/**
 * Middleware to check for specific permissions
 * @param {string} module - e.g. 'invoices'
 * @param {string} action - e.g. 'create'
 */
const checkPermission = (module, action) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    // Admin has bypass
    if (req.user.role === 'Admin') {
      return next();
    }

    const requiredPermission = `${module}:${action}`;
    const hasPermission = req.user.permissions && req.user.permissions.includes(requiredPermission);

    if (!hasPermission) {
      return res.status(403).json({ 
        error: `Access Denied: You do not have permission to ${action} in ${module}` 
      });
    }

    next();
  };
};

module.exports = { protect, checkPermission };
