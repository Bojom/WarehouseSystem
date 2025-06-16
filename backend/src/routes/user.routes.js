// backend/src/routes/user.routes.js

const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/user.model.js');

const { protect } = require('../middleware/auth.middleware.js');

const router = express.Router();

// 为了能解析请求体中的JSON数据，需要添加中间件
router.use(express.json());

// --- 注册接口 (POST /api/users/register) ---
router.post('/register', async (req, res) => {
  try {
    const { user_name, password, user_role } = req.body;

    // 1. 对密码进行哈希加密
    const salt = await bcrypt.genSalt(10); // 生成盐，增加密码复杂度
    const password_hash = await bcrypt.hash(password, salt);

    // 2. 创建新用户
    const newUser = await User.create({
      user_name,
      password_hash,
      user_role
    });

    res.status(201).json({ message: 'User registered successfully', userId: newUser.id });

  } catch (error) {
    res.status(500).json({ message: 'Error registering user', error: error.message });
  }
});

// --- 登录接口 (POST /api/users/login) ---
router.post('/login', async (req, res) => {
  try {
    const { user_name, password } = req.body;

    // 1. 查找用户
    const user = await User.findOne({ where: { user_name } });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // 2. 对比密码
    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // 3. 密码匹配，生成JWT
    const payload = {
      id: user.id,
      username: user.user_name,
      role: user.user_role
    };

    const token = jwt.sign(
      payload,
      process.env.JWT_SECRET || 'your_default_secret_key', // 使用环境变量中的密钥
      { expiresIn: '1h' } // 令牌有效期1小时
    );

    res.json({
      message: 'Logged in successfully',
      token: token
    });

  } catch (error) {
    res.status(500).json({ message: 'Error logging in', error: error.message });
  }
});


// --- 新增：获取用户个人信息的受保护路由 ---
// GET /api/users/profile
router.get('/profile', protect, async (req, res) => {
  // 如果代码能执行到这里，说明 protect 中间件已经成功验证了 token
  console.log("---------- /profile route hit! ----------"); // <--- 添加日志 #1
  console.log("User from token (req.user):", req.user); // <--- 添加日志 #2

  // 'req.user' 是由 protect 中间件从 token 中解码并附加到请求对象上的
  const userId = req.user.id;

  try {
    // 为了安全，我们不直接返回 req.user (可能包含iat/exp等信息)
    // 而是根据ID从数据库重新查找一次，并只返回必要的字段
    const user = await User.findByPk(userId, {
      attributes: ['id', 'user_name', 'user_role'] // 只选择这几个字段
    });

    console.log("User found in DB:", user); // <--- 添加日志 #3

    if (user) {
      const userProfile = {
          id: user.id,
          username: user.user_name,
          role: user.user_role
      }
      console.log("Sending user profile to frontend:", userProfile); // <--- 添加日志 #4
      res.json({ userProfile });
    } else {
      res.status(404).json({ message: 'User not found' });
    }
  } catch (error) {
    console.error("Error in /profile route:", error);
    res.status(500).json({ message: 'Error fetching profile', error: error.message });
  }
});


module.exports = router;