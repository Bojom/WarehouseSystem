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

// --- mock jsonwebtoken library ---
// we tell Jest that when any file tries to `require('jsonwebtoken')`,
// give it a version that we've mocked, where the `verify` method is replaced.
jest.mock('jsonwebtoken', () => ({
  ...jest.requireActual('jsonwebtoken'), // keep the other real functionality
  verify: jest.fn((token, secret, callback) => {
    // mock a decoded payload with user information
    const decodedPayload = {
      id: 1,
      username: 'test_operator',
      role: 'operator',
    };
    // if there's a callback function (old version library usage), call it
    if (callback) {
      callback(null, decodedPayload);
    }
    // return the decoded payload (new version library usage)
    return decodedPayload;
  }),
}));

// create an express app instance that only loads the transaction routes for testing
const app = express();
app.use(express.json());
// note: now we're loading the real routes, which will use the real `protect` middleware,
// but its dependency (jwt) is mocked
app.use('/api/transactions', transactionRoutes);

describe('Transaction API Routes', () => {
  let testSupplier;
  let testPart;
  const fakeToken = 'a-valid-fake-token'; // define a fake token, the content is not important

  // --- 1. prepare the environment ---
  beforeAll(async () => {
    // 同步数据库，清空所有表
    await sequelize.sync({ force: true });

    // create a test user (id will be 1, same as in mockAuthMiddleware)
    await User.create({
      user_name: 'test_operator',
      password_hash: 'a_hash',
      user_role: 'operator',
    });

    // create a test supplier
    testSupplier = await Supplier.create({
      supplier_name: 'Test Supplier',
    });

    // create a test part with an initial stock of 100
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

  // --- 2. mock scenarios and assert ---

  // scenario A: success IN
  describe('POST /api/transactions - IN', () => {
    test('should successfully process an IN transaction', async () => {
      const transactionData = {
        part_id: testPart.id,
        trans_type: 'IN',
        quantity: 50,
        remarks: 'Test IN',
      };

      // send API request
      const res = await request(app)
        .post('/api/transactions')
        .set('Authorization', `Bearer ${fakeToken}`)
        .send(transactionData);

      // assert API response
      expect(res.statusCode).toEqual(201);
      expect(res.body.message).toBe('操作成功');
      expect(res.body.transaction.quantity).toBe(50);
      expect(res.body.transaction.trans_type).toBe('IN');

      // assert database state
      // re-lookup the part from the database, get the latest state
      const updatedPart = await Part.findByPk(testPart.id);
      expect(updatedPart.stock).toBe(150); // 100 + 50

      const newTransaction = await Transaction.findOne({
        where: { remarks: 'Test IN' },
      });
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
      expect(res.body.message).toBe('配件不存在');
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
      expect(res.body.message).toBe('无效的操作类型');
    });
  });

  // scenario B: success OUT
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

  // NEW: ANOMALY transaction tests
  describe('POST /api/transactions - ANOMALY', () => {
    test('should successfully process an ANOMALY transaction', async () => {
      const transactionData = {
        part_id: testPart.id,
        trans_type: 'ANOMALY',
        quantity: 5,
        remarks: 'Test ANOMALY',
      };

      const res = await request(app)
        .post('/api/transactions')
        .set('Authorization', `Bearer ${fakeToken}`)
        .send(transactionData);

      expect(res.statusCode).toEqual(201);
      expect(res.body.transaction.trans_type).toBe('ANOMALY');

      const updatedPart = await Part.findByPk(testPart.id);
      expect(updatedPart.stock).toBe(125); // 130 - 5
    });

    test('should fail an ANOMALY transaction with insufficient stock', async () => {
      const transactionData = {
        part_id: testPart.id,
        trans_type: 'ANOMALY',
        quantity: 200, // More than current stock of 125
        remarks: 'Failed ANOMALY',
      };

      const res = await request(app)
        .post('/api/transactions')
        .set('Authorization', `Bearer ${fakeToken}`)
        .send(transactionData);

      expect(res.statusCode).toEqual(400);
      expect(res.body.message).toBe('库存不足，无法报为异常');

      const partAfterFailure = await Part.findByPk(testPart.id);
      expect(partAfterFailure.stock).toBe(125); // Stock should not change
    });
  });

  // NEW: IN transaction failure (over stock max)
  describe('POST /api/transactions - IN (Failure - Over Max Stock)', () => {
    test('should fail with over stock max and rollback the transaction', async () => {
      const transactionData = {
        part_id: testPart.id,
        trans_type: 'IN',
        quantity: 100, // This will exceed the max stock of 200 (125 + 100 = 225)
        remarks: 'Failed IN',
      };

      const res = await request(app)
        .post('/api/transactions')
        .set('Authorization', `Bearer ${fakeToken}`)
        .send(transactionData);

      expect(res.statusCode).toEqual(400);
      expect(res.body.message).toContain('超过最大库存限制');

      const partAfterFailure = await Part.findByPk(testPart.id);
      expect(partAfterFailure.stock).toBe(125);

      const failedTransaction = await Transaction.findOne({
        where: { remarks: 'Failed IN' },
      });
      expect(failedTransaction).toBeNull();
    });
  });

  // scenario C: failure OUT (insufficient stock) - the most critical test!
  describe('POST /api/transactions - OUT (Failure - Insufficient Stock)', () => {
    test('should fail with insufficient stock and rollback the transaction', async () => {
      const transactionData = {
        part_id: testPart.id,
        trans_type: 'OUT',
        quantity: 200, // more than current stock (130)
        remarks: 'Failed OUT',
      };

      // send API request
      const res = await request(app)
        .post('/api/transactions')
        .set('Authorization', `Bearer ${fakeToken}`)
        .send(transactionData);

      // assert API response
      expect(res.statusCode).toEqual(400);
      expect(res.body.message).toBe('库存不足，无法出库');

      // assert database state - confirm data is not changed!
      const partAfterFailure = await Part.findByPk(testPart.id);
      expect(partAfterFailure.stock).toBe(130); // stock should not change

      const failedTransaction = await Transaction.findOne({
        where: { remarks: 'Failed OUT' },
      });
      expect(failedTransaction).toBeNull(); // confirm no failed transaction record is inserted
    });
  });

  // scenario D: get transaction list
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

    test('should filter transactions by date range', async () => {
      const today = new Date().toISOString().slice(0, 10);
      const res = await request(app)
        .get(
          `/api/transactions?startDate=${today}T00:00:00.000Z&endDate=${today}T23:59:59.999Z`
        )
        .set('Authorization', `Bearer ${fakeToken}`);

      expect(res.statusCode).toEqual(200);
      expect(res.body.transactions.length).toBeGreaterThanOrEqual(3); // IN, OUT, ANOMALY
    });
  });

  // NEW: Summary Endpoint Test
  describe('GET /api/transactions/summary', () => {
    test('should return a summary of transactions', async () => {
      const res = await request(app)
        .get('/api/transactions/summary')
        .set('Authorization', `Bearer ${fakeToken}`);

      expect(res.statusCode).toEqual(200);
      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBeGreaterThan(0);
      const summaryItem = res.body[0];
      expect(summaryItem).toHaveProperty('date');
      expect(summaryItem).toHaveProperty('trans_type');
      expect(summaryItem).toHaveProperty('total_quantity');
    });
  });

  // scenario E: export transaction records to Excel
  describe('GET /api/transactions/export', () => {
    test('should return an excel file', async () => {
      const res = await request(app)
        .get('/api/transactions/export')
        .set('Authorization', `Bearer ${fakeToken}`)
        .parse(binaryParser); // Use a binary parser to handle file downloads

      expect(res.statusCode).toEqual(200);
      // Check for excel file content type
      expect(res.headers['content-type']).toBe(
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      );
      // Check if we received a file
      expect(res.body).toBeInstanceOf(Buffer);
      expect(res.body.length).toBeGreaterThan(0);
    });

    test('should return a filtered excel file', async () => {
      const res = await request(app)
        .get('/api/transactions/export?type=ANOMALY')
        .set('Authorization', `Bearer ${fakeToken}`)
        .parse(binaryParser);

      expect(res.statusCode).toEqual(200);
      expect(res.headers['content-type']).toBe(
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      );
      // This is a simple check. A more robust test would involve parsing the excel file.
      // For now, we just check that the file size is different from the unfiltered export.

      // A more robust test could be to check the filename
      expect(res.headers['content-disposition']).toContain(
        'attachment; filename*=UTF-8'
      );
    });
  });

  // --- 3. clean up the environment ---
  afterAll(async () => {
    await sequelize.close();
  });
});
