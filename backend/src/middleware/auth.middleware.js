// backend/src/middleware/auth.middleware.js

const jwt = require('jsonwebtoken');
const User = require('../models/user.model.js'); // 引入User模型

const protect = async (req, res, next) => {
  let token;
  const authHeader = req.headers.authorization;

  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.split(' ')[1];
  } else if (req.query.token) {
    token = req.query.token;
  }

  if (!token) {
    return res.status(401).json({ message: 'Not authorized, no token' });
  }

  try {
    // Verify the token
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your_default_secret_key');

    // Find the user in the database
    req.user = await User.findByPk(decoded.id, {
      attributes: { exclude: ['password_hash'] }
    });
    
    // If user not found after decoding token, it's an invalid token situation
    if (!req.user) {
       return res.status(401).json({ message: 'Not authorized, user not found' });
    }

    next();
  } catch (error) {
    // This will catch errors from jwt.verify (e.g., invalid signature, expired token)
    // and any potential errors from the database lookup.
    console.error('Authentication error:', error);
    return res.status(401).json({ message: 'Not authorized, token failed' });
  }
};

module.exports = { protect };