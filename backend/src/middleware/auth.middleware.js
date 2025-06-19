// backend/src/middleware/auth.middleware.js

const jwt = require('jsonwebtoken');

const protect = (req, res, next) => {
  let token;

  // 1. 优先从请求头 (Header) 中获取 token
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    try {
      // 获取 'Bearer ' 后面的 token 部分
      token = req.headers.authorization.split(' ')[1];
    } catch (error) {
        return res.status(401).json({ message: 'Not authorized, token format is invalid' });
    }
  } 
  // 2. 如果请求头中没有，就尝试从 URL 查询参数中获取 token
  else if (req.query.token) {
    token = req.query.token;
  }

  // 3. 如果最终还是没有找到 token，则拒绝访问
  if (!token) {
    return res.status(401).json({ message: 'Not authorized, no token' });
  }

  // 4. 如果找到了 token，就验证它
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your_default_secret_key');
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ message: 'Not authorized, token failed' });
  }
};

module.exports = { protect };