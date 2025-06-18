// backend/src/routes/transaction.routes.js
const express = require('express');
const router = express.Router();
const sequelize = require('../config/db.config');
const Transaction = require('../models/transaction.model');
const Part = require('../models/part.model');
const { protect } = require('../middleware/auth.middleware');

// POST /api/transactions - 创建一个新的出入库事务
router.post('/', protect, async (req, res) => {
  // 从请求体中获取数据
  const { part_id, trans_type, quantity, remarks } = req.body;
  // 从 protect 中间件中获取用户ID
  const user_id = req.user.id;

  console.log(`[TRANSACTION START] User ${user_id}: ${trans_type} ${quantity} of part ${part_id}`);

  // --- 关键：启动数据库事务 ---
  try {
    const result = await sequelize.transaction(async (t) => {
      console.log('  [DB-TX] Inside transaction callback');
      // 1. 查找配件，并使用悲观锁锁定该行，防止并发问题
      const part = await Part.findByPk(part_id, {
        lock: t.LOCK.UPDATE, // 锁定行直到事务结束
        transaction: t       // 确保此查询在事务内
      });

      if (!part) {
        console.error('  [DB-TX] Error: Part not found.');
        throw new Error('配件不存在');
      }
      console.log(`  [DB-TX] Found part ${part.id}, current stock: ${part.stock}`);

      let newQuantity;
      // 2. 逻辑校验与库存计算
      if (trans_type === 'OUT') {
        if (part.stock < quantity) {
          console.error(`  [DB-TX] Error: Insufficient stock. Have ${part.stock}, need ${quantity}`);
          // 库存不足，手动抛出错误，事务将回滚
          throw new Error('库存不足，无法出库');
        }
        newQuantity = part.stock - quantity;
      } else if (trans_type === 'IN') {
        newQuantity = part.stock + quantity;
      } else {
        throw new Error('无效的操作类型');
      }
      
      // 3. 更新配件表中的库存
      console.log(`  [DB-TX] Updating stock for part ${part.id} to ${newQuantity}`);
      await part.update({ stock: newQuantity }, { transaction: t });

      // 4. 在 transactions 表中创建一条新记录
      console.log('  [DB-TX] Creating transaction record...');
      const newTransaction = await Transaction.create({
        part_id,
        user_id,
        trans_type,
        quantity,
        remarks
      }, { transaction: t });
      
      console.log('  [DB-TX] Transaction record created in memory. Returning to commit.');
      return newTransaction; // 事务成功，返回新创建的记录
    });

    // 如果事务成功提交，这里的代码才会被执行
    console.log('[TRANSACTION SUCCESS] Transaction committed successfully.');
    res.status(201).json({ message: '操作成功', transaction: result });

  } catch (error) {
    // 如果事务中任何地方抛出错误，或者发生数据库错误，都会被这里捕获
    console.error('[TRANSACTION FAILED] Error caught, rolling back.', error);
    res.status(400).json({ message: '操作失败', error: error.message });
  }
});

module.exports = router;