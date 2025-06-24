// backend/src/routes/user.routes.test.js
const request = require('supertest');
const express = require('express');
const userRoutes = require('./user.routes');
const sequelize = require('../config/db.config');
const User = require('../models/user.model');
const bcrypt = require('bcryptjs');

//  create an express app instance that only loads the user routes for testing
const app = express();
app.use(express.json()); // ensure the test app can also parse JSON
app.use('/api/users', userRoutes);

describe('User API Routes', () => {
  let adminToken;
  let operatorToken;
  let pendingUserId;

  beforeAll(async () => {
    await sequelize.sync({ force: true });

    const salt = await bcrypt.genSalt(10);
    const password_hash = await bcrypt.hash('password123', salt);

    const users = await User.bulkCreate([
      {
        user_name: 'test_admin',
        password_hash,
        user_role: 'admin',
        status: 'active',
      },
      {
        user_name: 'test_operator',
        password_hash,
        user_role: 'operator',
        status: 'active',
      },
      {
        user_name: 'test_pending',
        password_hash,
        user_role: 'operator',
        status: 'pending',
      },
    ]);
    pendingUserId = users.find((u) => u.user_name === 'test_pending').id;

    const adminLogin = await request(app)
      .post('/api/users/login')
      .send({ user_name: 'test_admin', password: 'password123' });
    adminToken = adminLogin.body.token;

    const operatorLogin = await request(app)
      .post('/api/users/login')
      .send({ user_name: 'test_operator', password: 'password123' });
    operatorToken = operatorLogin.body.token;
  });

  describe('POST /api/users/register', () => {
    test('should allow an ADMIN to register a new user', async () => {
      const res = await request(app)
        .post('/api/users/register')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          user_name: 'new_by_admin',
          password: 'password123',
          user_role: 'operator',
        });

      expect(res.statusCode).toEqual(201);
      expect(res.body.message).toBe('User registered successfully.');

      const newUser = await User.findOne({
        where: { user_name: 'new_by_admin' },
      });
      expect(newUser).not.toBeNull();
      expect(newUser.status).toBe('active');
    });

    test('should NOT allow a non-admin to register a user', async () => {
      const res = await request(app)
        .post('/api/users/register')
        .set('Authorization', `Bearer ${operatorToken}`)
        .send({
          user_name: 'fail_by_operator',
          password: 'password123',
          user_role: 'operator',
        });

      expect(res.statusCode).toEqual(403);
    });

    test('should return 409 for a duplicate username', async () => {
      const res = await request(app)
        .post('/api/users/register')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          user_name: 'test_admin',
          password: 'password123',
          user_role: 'admin',
        }); // already exists
      expect(res.statusCode).toEqual(409);
      expect(res.body.message).toBe('Username already exists.');
    });

    test('should return 400 for an invalid role', async () => {
      const res = await request(app)
        .post('/api/users/register')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          user_name: 'invalid_role_user',
          password: 'password123',
          user_role: 'guest',
        }); // invalid role
      expect(res.statusCode).toEqual(400);
      expect(res.body.message).toBe('Invalid user role specified.');
    });
  });

  describe('POST /api/users/login', () => {
    test('should login an active user successfully', async () => {
      const res = await request(app)
        .post('/api/users/login')
        .send({ user_name: 'test_admin', password: 'password123' });
      expect(res.statusCode).toEqual(200);
      expect(res.body).toHaveProperty('token');
    });

    test('should NOT login a user with pending status', async () => {
      const res = await request(app)
        .post('/api/users/login')
        .send({ user_name: 'test_pending', password: 'password123' });
      expect(res.statusCode).toEqual(403);
      expect(res.body.message).toBe(
        'Account is not active. Please contact an administrator.'
      );
    });

    // You can add a similar test for 'paused' status if needed
  });

  describe('Admin User Management', () => {
    describe('GET /api/users', () => {
      test('should allow an admin to get a list of all users', async () => {
        const res = await request(app)
          .get('/api/users')
          .set('Authorization', `Bearer ${adminToken}`);
        expect(res.statusCode).toEqual(200);
        expect(Array.isArray(res.body)).toBe(true);
        expect(res.body.length).toBeGreaterThanOrEqual(3);
      });

      test('should NOT allow a non-admin to get a list of users', async () => {
        const res = await request(app)
          .get('/api/users')
          .set('Authorization', `Bearer ${operatorToken}`);
        expect(res.statusCode).toEqual(403);
      });
    });

    describe('PUT /api/users/:id/status', () => {
      test('should allow an admin to update a user status', async () => {
        const res = await request(app)
          .put(`/api/users/${pendingUserId}/status`)
          .set('Authorization', `Bearer ${adminToken}`)
          .send({ status: 'active' });
        expect(res.statusCode).toEqual(200);

        const updatedUser = await User.findByPk(pendingUserId);
        expect(updatedUser.status).toBe('active');
      });

      test('should return 404 when trying to update a non-existent user status', async () => {
        const nonExistentUserId = 9999;
        const res = await request(app)
          .put(`/api/users/${nonExistentUserId}/status`)
          .set('Authorization', `Bearer ${adminToken}`)
          .send({ status: 'active' });
        expect(res.statusCode).toEqual(404);
        expect(res.body.message).toBe('User not found.');
      });
    });

    describe('PUT /api/users/:id/role', () => {
      test('should allow an admin to update a user role', async () => {
        const res = await request(app)
          .put(`/api/users/${pendingUserId}/role`)
          .set('Authorization', `Bearer ${adminToken}`)
          .send({ role: 'admin' });
        expect(res.statusCode).toEqual(200);

        const updatedUser = await User.findByPk(pendingUserId);
        expect(updatedUser.user_role).toBe('admin');
      });

      test('should return 400 for an invalid role update', async () => {
        const res = await request(app)
          .put(`/api/users/${pendingUserId}/role`)
          .set('Authorization', `Bearer ${adminToken}`)
          .send({ role: 'super-admin' }); // Invalid role
        expect(res.statusCode).toEqual(400);
        expect(res.body.message).toBe('Invalid role specified.');
      });
    });
  });

  // GET /api/users/profile tests remain largely the same
  describe('GET /api/users/profile', () => {
    test('should return admin profile with a valid admin token', async () => {
      const res = await request(app)
        .get('/api/users/profile')
        .set('Authorization', `Bearer ${adminToken}`);
      expect(res.statusCode).toEqual(200);
      expect(res.body.userProfile.username).toBe('test_admin');
      expect(res.body.userProfile.role).toBe('admin');
    });

    test('should return operator profile with a valid operator token', async () => {
      const res = await request(app)
        .get('/api/users/profile')
        .set('Authorization', `Bearer ${operatorToken}`);
      expect(res.statusCode).toEqual(200);
      expect(res.body.userProfile.username).toBe('test_operator');
      expect(res.body.userProfile.role).toBe('operator');
    });

    test('should return 401 without a token', async () => {
      const res = await request(app).get('/api/users/profile');

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

  // --- new: test error handling scenarios ---
  describe('Error Handling', () => {
    // after each test, restore all mocked functions
    afterEach(() => {
      jest.restoreAllMocks();
    });

    test('should return 500 if database fails during registration', async () => {
      // 模拟 User.create 在被调用时抛出错误
      jest.spyOn(User, 'create').mockRejectedValue(new Error('DB Error'));

      const res = await request(app)
        .post('/api/users/register')
        .set('Authorization', `Bearer ${adminToken}`) // Admin token is required
        .send({
          user_name: 'fail_user',
          password: 'password',
          user_role: 'operator',
        });

      expect(res.statusCode).toEqual(500);
      expect(res.body.message).toBe('Error registering user');
    });

    test('should return 500 if database fails during login', async () => {
      // mock User.findOne to throw an error when it's called
      jest.spyOn(User, 'findOne').mockRejectedValue(new Error('DB Error'));

      const res = await request(app)
        .post('/api/users/login')
        .send({ user_name: 'any_user', password: 'any_password' });

      expect(res.statusCode).toEqual(500);
      expect(res.body.message).toBe('Error logging in');
    });

    test('should return 401 from profile if user is not found in DB', async () => {
      // We can use an existing valid token for this test
      // Now, mock findByPk to return null, simulating a deleted user
      jest.spyOn(User, 'findByPk').mockResolvedValue(null);

      const res = await request(app)
        .get('/api/users/profile')
        .set('Authorization', `Bearer ${adminToken}`);

      // The middleware should now catch this and return a 401
      expect(res.statusCode).toEqual(401);
      expect(res.body.message).toBe('Not authorized, user not found');
    });

    test('should return 401 from profile if DB fails during user lookup in middleware', async () => {
      // Mock findByPk to throw an error
      jest.spyOn(User, 'findByPk').mockRejectedValue(new Error('DB Error'));

      const res = await request(app)
        .get('/api/users/profile')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.statusCode).toEqual(401);
      expect(res.body.message).toBe('Not authorized, token failed');
    });

    test('should return 500 from profile if DB fails during user lookup in route handler', async () => {
      const tempUser = { id: 1, user_name: 'test_admin', user_role: 'admin' };
      // First lookup in middleware succeeds
      const findByPkMock = jest
        .spyOn(User, 'findByPk')
        .mockResolvedValueOnce(tempUser) // For protect middleware
        .mockRejectedValueOnce(new Error('DB Error in route')); // For route handler

      const res = await request(app)
        .get('/api/users/profile')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.statusCode).toEqual(500);
      expect(res.body.message).toBe('Error fetching profile');

      findByPkMock.mockRestore();
    });
  });

  afterAll(async () => {
    await sequelize.close();
  });
});
