// backend/src/routes/parts.routes.js

const express = require('express');
const router = express.Router();

// 1. 引入我们刚刚创建的“保安”中间件
const { protect } = require('../middleware/auth.middleware.js');

// 2. 创建一个受保护的测试路由
// 注意中间的 'protect'，它就是我们安插的保安
router.get('/test-protected', protect, (req, res) => {
  // 如果能执行到这里，说明'protect'中间件已经成功验证了token并调用了next()

  // 3. 我们可以安全地访问 req.user，因为它是'protect'中间件附加的
  res.json({
    message: '恭喜！你已成功访问受保护的资源！',
    userInfoFromToken: req.user 
  });
});

// 你也可以有一个不受保护的路由作为对比
router.get('/public-info', (req, res) => {
    res.send("这是一个公开信息，任何人都可以访问。");
});


module.exports = router;