// backend/src/middleware/auth.middleware.js

const jwt = require('jsonwebtoken');

const protect = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Not authorized, token missing' });
  }

  try {
    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your_default_secret_key');

    req.user = decoded;
    next();
    
  } catch (error) {
    console.error('Erreur d\'authentification:', error.message);
    return res.status(401).json({ message: 'Not authorized, no token' });
  }
};

module.exports = { protect };