// backend/src/routes/user.routes.test.js
const request = require('supertest');
const express = require('express');
const userRoutes = require('./user.routes');
const sequelize = require('../config/db.config');
const User = require('../models/user.model');

// 创建一个只加载用户路由的 express 应用实例用于测试
const app = express();
app.use(express.json()); // 确保测试应用也能解析JSON
app.use('/api/users', userRoutes);

describe('User API Routes', () => {
  let testToken; // 用于存储登录后获取的token

  // 同样，在测试前清空数据库
  beforeAll(async () => {
    await sequelize.sync({ force: true });
    
    // 先注册一个用户，以便后续测试登录和受保护路由
    await request(app)
      .post('/api/users/register')
      .send({
        user_name: 'api_test_user',
        password: 'password123',
        user_role: 'admin'
      });
  });

  // 测试 POST /api/users/login
  describe('POST /api/users/login', () => {
    test('should login successfully with correct credentials and return a token', async () => {
      const res = await request(app)
        .post('/api/users/login')
        .send({
          user_name: 'api_test_user',
          password: 'password123'
        });

      expect(res.statusCode).toEqual(200);
      expect(res.body).toHaveProperty('token'); // 断言响应体中有 token 属性
      testToken = res.body.token; // 保存 token 用于后续测试
    });

    test('should fail with incorrect credentials', async () => {
      const res = await request(app)
        .post('/api/users/login')
        .send({
          user_name: 'api_test_user',
          password: 'wrong_password'
        });
      
      expect(res.statusCode).toEqual(401); // 401 Unauthorized
    });

    test('should fail with a non-existent username', async () => {
      const res = await request(app)
        .post('/api/users/login')
        .send({
          user_name: 'nonexistentuser',
          password: 'password123'
        });
      
      expect(res.statusCode).toEqual(404);
      expect(res.body.message).toBe('User not found');
    });
  });

  // 测试 GET /api/users/profile (受保护的路由)
  describe('GET /api/users/profile', () => {
    test('should return user profile with a valid token', async () => {
      const res = await request(app)
        .get('/api/users/profile')
        .set('Authorization', `Bearer ${testToken}`); // 设置请求头

      expect(res.statusCode).toEqual(200);
      expect(res.body.userProfile.username).toBe('api_test_user');
    });

    test('should return 401 without a token', async () => {
      const res = await request(app)
        .get('/api/users/profile');

      expect(res.statusCode).toEqual(401);
    });

    test('should return 401 with an invalid/expired token', async () => {
      const res = await request(app)
        .get('/api/users/profile')
        .set('Authorization', `Bearer an_invalid_or_expired_token`);

      expect(res.statusCode).toEqual(401);
      expect(res.body.message).toBe('Not authorized, token failed');
    });
  });

  // --- 新增：测试错误处理场景 ---
  describe('Error Handling', () => {
    // 在每个测试后，恢复所有被模拟的函数
    afterEach(() => {
      jest.restoreAllMocks();
    });

    test('should return 500 if database fails during registration', async () => {
      // 模拟 User.create 在被调用时抛出错误
      jest.spyOn(User, 'create').mockRejectedValue(new Error('DB Error'));

      const res = await request(app)
        .post('/api/users/register')
        .send({ user_name: 'fail_user', password: 'password' });

      expect(res.statusCode).toEqual(500);
      expect(res.body.message).toBe('Error registering user');
    });

    test('should return 500 if database fails during login', async () => {
      // 模拟 User.findOne 在被调用时抛出错误
      jest.spyOn(User, 'findOne').mockRejectedValue(new Error('DB Error'));
      
      const res = await request(app)
        .post('/api/users/login')
        .send({ user_name: 'any_user', password: 'any_password' });

      expect(res.statusCode).toEqual(500);
      expect(res.body.message).toBe('Error logging in');
    });

    test('should return 401 from profile if user is not found in DB', async () => {
        // First, login to get a valid token.
        const loginRes = await request(app)
          .post('/api/users/login')
          .send({ user_name: 'api_test_user', password: 'password123' });
        const token = loginRes.body.token;

        // Now, mock findByPk to return null, simulating a deleted user
        jest.spyOn(User, 'findByPk').mockResolvedValue(null);

        const res = await request(app)
            .get('/api/users/profile')
            .set('Authorization', `Bearer ${token}`);
        
        // The middleware should now catch this and return a 401
        expect(res.statusCode).toEqual(401);
        expect(res.body.message).toBe('Not authorized, user not found');
    });

    test('should return 401 from profile if DB fails during user lookup', async () => {
        const loginRes = await request(app)
          .post('/api/users/login')
          .send({ user_name: 'api_test_user', password: 'password123' });
        const token = loginRes.body.token;

        // Mock findByPk to throw an error
        jest.spyOn(User, 'findByPk').mockRejectedValue(new Error('DB Error'));

        const res = await request(app)
            .get('/api/users/profile')
            .set('Authorization', `Bearer ${token}`);
        
        // The middleware's catch block will handle this and return a 401
        expect(res.statusCode).toEqual(401);
        expect(res.body.message).toBe('Not authorized, token failed');
    });
  });

  afterAll(async () => {
    await sequelize.close();
  });
});