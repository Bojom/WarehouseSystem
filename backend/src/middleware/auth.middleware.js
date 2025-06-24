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
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || 'your_default_secret_key'
    );

    // Attach the decoded payload directly to the request object.
    // The payload already contains the necessary id, username, and role.
    req.user = decoded;

    // We can remove the DB call here for efficiency.
    // If we needed to check if the user still exists in the DB on every request,
    // we would do it here, but for this application, trusting the token is sufficient.

    next();
  } catch (error) {
    // This will catch errors from jwt.verify (e.g., invalid signature, expired token)
    // and any potential errors from the database lookup.
    return res.status(401).json({ message: 'Not authorized, token failed' });
  }
};

module.exports = { protect };
