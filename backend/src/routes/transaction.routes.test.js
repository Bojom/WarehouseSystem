// backend/src/routes/transaction.routes.test.js

const request = require('supertest');
const express = require('express');
const sequelize = require('../config/db.config');
const jwt = require('jsonwebtoken');
const transactionRoutes = require('./transaction.routes');
const User = require('../models/user.model');
const Part = require('../models/part.model');
const Supplier = require('../models/supplier.model');
const Transaction = require('../models/transaction.model');

const binaryParser = (res, callback) => {
  res.data = [];
  res.on('data', (chunk) => {
    res.data.push(chunk);
  });
  res.on('end', () => {
    callback(null, Buffer.concat(res.data));
  });
};

// --- 关键：模拟jsonwebtoken库 ---
// 我们告诉Jest，当任何文件尝试 `require('jsonwebtoken')` 时，
// 给它一个我们伪造的版本，其中 `verify` 方法被替换了。
jest.mock('jsonwebtoken', () => ({
  ...jest.requireActual('jsonwebtoken'), // 保留库中的其他真实功能
  verify: jest.fn((token, secret, callback) => {
    // 模拟一个解码后的、包含用户信息的 payload
    const decodedPayload = { id: 1, username: 'test_operator', role: 'operator' };
    // 如果有回调函数（旧版库用法），就调用它
    if (callback) {
      callback(null, decodedPayload);
    }
    // 直接返回解码后的 payload (新版库用法)
    return decodedPayload;
  }),
}));

// 创建一个只加载事务路由的 express 应用实例用于测试
const app = express();
app.use(express.json());
// 注意：现在我们加载的是真实的路由，它会使用真实的、但其依赖(jwt)被模拟了的`protect`中间件
app.use('/api/transactions', transactionRoutes);


describe('Transaction API Routes', () => {
  let testSupplier;
  let testPart;
  const fakeToken = 'a-valid-fake-token'; // 定义一个假的token，内容不重要

  // --- 1. 准备环境 ---
  beforeAll(async () => {
    // 同步数据库，清空所有表
    await sequelize.sync({ force: true });

    // 创建一个测试用户 (id将为1，与mockAuthMiddleware中一致)
    await User.create({
      user_name: 'test_operator',
      password_hash: 'a_hash',
      user_role: 'operator',
    });

    // 创建一个测试供应商
    testSupplier = await Supplier.create({
      supplier_name: 'Test Supplier',
    });

    // 创建一个初始库存为100的测试配件
    testPart = await Part.create({
      part_number: 'TEST-001',
      part_name: 'Test Part',
      unit: 'pcs',
      stock: 100,
      stock_min: 10,
      stock_max: 200,
      supplier_id: testSupplier.id,
    });
  });

  // --- 2. 模拟场景并进行断言 ---

  // 场景A: 成功入库
  describe('POST /api/transactions - IN', () => {
    test('should successfully process an IN transaction', async () => {
      const transactionData = {
        part_id: testPart.id,
        trans_type: 'IN',
        quantity: 50,
        remarks: 'Test IN',
      };

      // 发送API请求
      const res = await request(app)
        .post('/api/transactions')
        .set('Authorization', `Bearer ${fakeToken}`)
        .send(transactionData);

      // 断言API响应
      expect(res.statusCode).toEqual(201);
      expect(res.body.message).toBe('操作成功');
      expect(res.body.transaction.quantity).toBe(50);
      expect(res.body.transaction.trans_type).toBe('IN');

      // 断言数据库状态
      // 重新从数据库查找配件，获取最新状态
      const updatedPart = await Part.findByPk(testPart.id);
      expect(updatedPart.stock).toBe(150); // 100 + 50

      const newTransaction = await Transaction.findOne({ where: { remarks: 'Test IN' } });
      expect(newTransaction).not.toBeNull();
    });

    test('should return 400 if part_id does not exist', async () => {
      const transactionData = {
        part_id: 999, // Non-existent part_id
        trans_type: 'IN',
        quantity: 10,
        remarks: 'Test non-existent part',
      };

      const res = await request(app)
        .post('/api/transactions')
        .set('Authorization', `Bearer ${fakeToken}`)
        .send(transactionData);

      expect(res.statusCode).toEqual(400);
      expect(res.body.error).toBe('配件不存在');
    });

    test('should return 400 for an invalid transaction type', async () => {
      const transactionData = {
        part_id: testPart.id,
        trans_type: 'INVALID_TYPE',
        quantity: 10,
        remarks: 'Test invalid type',
      };

      const res = await request(app)
        .post('/api/transactions')
        .set('Authorization', `Bearer ${fakeToken}`)
        .send(transactionData);

      expect(res.statusCode).toEqual(400);
      expect(res.body.error).toBe('无效的操作类型');
    });
  });

  // 场景B: 成功出库
  describe('POST /api/transactions - OUT (Success)', () => {
    test('should successfully process an OUT transaction', async () => {
      const transactionData = {
        part_id: testPart.id,
        trans_type: 'OUT',
        quantity: 20,
        remarks: 'Test OUT',
      };

      const res = await request(app)
        .post('/api/transactions')
        .set('Authorization', `Bearer ${fakeToken}`)
        .send(transactionData);
        
      expect(res.statusCode).toEqual(201);
      
      const updatedPart = await Part.findByPk(testPart.id);
      expect(updatedPart.stock).toBe(130); // 150 - 20
    });
  });

  // 场景C: 失败出库 (库存不足) - 最关键的测试！
  describe('POST /api/transactions - OUT (Failure - Insufficient Stock)', () => {
    test('should fail with insufficient stock and rollback the transaction', async () => {
      const transactionData = {
        part_id: testPart.id,
        trans_type: 'OUT',
        quantity: 200, // 数量大于当前库存 (130)
        remarks: 'Failed OUT',
      };

      // 发送API请求
      const res = await request(app)
        .post('/api/transactions')
        .set('Authorization', `Bearer ${fakeToken}`)
        .send(transactionData);
        
      // 断言API响应
      expect(res.statusCode).toEqual(400);
      expect(res.body.error).toBe('库存不足，无法出库');

      // 断言数据库状态 - 确认数据没有被改变！
      const partAfterFailure = await Part.findByPk(testPart.id);
      expect(partAfterFailure.stock).toBe(130); // 库存应该保持不变

      const failedTransaction = await Transaction.findOne({ where: { remarks: 'Failed OUT' } });
      expect(failedTransaction).toBeNull(); // 确认没有插入失败的事务记录
    });
  });

  // 场景D: 获取交易列表
  describe('GET /api/transactions', () => {
    test('should return a list of transactions', async () => {
      const res = await request(app)
        .get('/api/transactions')
        .set('Authorization', `Bearer ${fakeToken}`);
      
      expect(res.statusCode).toEqual(200);
      expect(res.body).toHaveProperty('totalItems');
      expect(res.body).toHaveProperty('transactions');
      expect(res.body.transactions.length).toBeGreaterThan(0);
      // Check for the aliased fields
      expect(res.body.transactions[0]).toHaveProperty('type');
      expect(res.body.transactions[0]).toHaveProperty('transaction_time');
    });

    test('should filter transactions by type', async () => {
      // We know there's at least one 'IN' and one 'OUT' transaction
      const res = await request(app)
        .get('/api/transactions?type=IN')
        .set('Authorization', `Bearer ${fakeToken}`);

      expect(res.statusCode).toEqual(200);
      expect(res.body.transactions.length).toBe(1);
      expect(res.body.transactions[0].trans_type).toBe('IN');
    });
  });

  // 场景E: 导出交易记录为Excel
  describe('GET /api/transactions/export', () => {
    test('should return an excel file', async () => {
      const res = await request(app)
        .get('/api/transactions/export')
        .set('Authorization', `Bearer ${fakeToken}`)
        .parse(binaryParser); // Use a binary parser to handle file downloads

      expect(res.statusCode).toEqual(200);
      // Check for excel file content type
      expect(res.headers['content-type']).toBe('application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      // Check if we received a file
      expect(res.body).toBeInstanceOf(Buffer);
      expect(res.body.length).toBeGreaterThan(0);
    });
  });

  // --- 3. 清理环境 ---
  afterAll(async () => {
    await sequelize.close();
  });
});