// middleware/auth.js - Support both headers
const jwt = require('jsonwebtoken');

const auth = (req, res, next) => {
  // Try to get token from Authorization header (Bearer)
  let token = null;
  const authHeader = req.header('Authorization');
  
  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.replace('Bearer ', '');
  } else {
    // Fallback: try x-auth-token header
    token = req.header('x-auth-token');
  }

  if (!token) {
    return res.status(401).json({
      success: false,
      error: 'Access denied. No token provided.',
    });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded.user;
    next();
  } catch (error) {
    console.error(error);
    res.status(401).json({
      success: false,
      error: 'Invalid token. Please log in again.',
    });
  }
};

module.exports = auth;