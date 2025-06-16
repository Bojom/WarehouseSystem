// backend/src/middleware/auth.middleware.js

const jwt = require('jsonwebtoken');

const protect = (req, res, next) => {
  let token;

  // 检查请求头中是否存在 Authorization 字段，并且以 'Bearer' 开头
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    try {
      // 1. 获取 token (去掉 'Bearer ' 前缀)
      token = req.headers.authorization.split(' ')[1];

      // 2. 验证 token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // 3. 将解码后的用户信息附加到 req 对象上，以便后续的路由处理器使用
      req.user = decoded; // decoded 将包含 { id, username, role }

      next(); // 验证通过，放行到下一个中间件或路由处理器
    } catch (error) {
      console.error(error);
      res.status(401).json({ message: 'Not authorized, token failed' });
    }
  }

  if (!token) {
    res.status(401).json({ message: 'Not authorized, no token' });
  }
};

module.exports = { protect };