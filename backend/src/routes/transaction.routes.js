// backend/src/routes/transaction.routes.js
const express = require('express');
const router = express.Router();
const sequelize = require('../config/db.config');
const Transaction = require('../models/transaction.model');
const Part = require('../models/part.model');
const User = require('../models/user.model');
const { protect } = require('../middleware/auth.middleware');
const { Op } = require('sequelize');
const excel = require('exceljs');

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
        trans_type: trans_type,
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

// GET /api/transactions - 获取出入库记录列表（带筛选和分页）
router.get('/', protect, async (req, res) => {
  try {
    const { page = 1, pageSize = 10, partId, userId, type, startDate, endDate } = req.query;
    const trans_type = type; // Allow 'type' as an alias for 'trans_type'

    const whereCondition = {};
    if (partId) whereCondition.part_id = partId;
    if (userId) whereCondition.user_id = userId;
    if (trans_type) whereCondition.trans_type = trans_type;
    if (startDate && endDate) {
      whereCondition.trans_time = {
        [Op.between]: [new Date(startDate), new Date(endDate)]
      };
    } else if (startDate) {
      whereCondition.trans_time = { [Op.gte]: new Date(startDate) };
    } else if (endDate) {
      whereCondition.trans_time = { [Op.lte]: new Date(endDate) };
    }

    const limit = parseInt(pageSize, 10);
    const offset = (parseInt(page, 10) - 1) * limit;

    const { count, rows } = await Transaction.findAndCountAll({
      where: whereCondition,
      include: [
        {
          model: Part,
          attributes: ['part_number', 'part_name', 'spec']
        },
        {
          model: User,
          attributes: [
            ['user_name', 'username'] // 将 user_name 别名为 username
          ]
        }
      ],
      // Sequelize 在 include 中无法直接为父模型的字段创建别名
      // 我们需要在返回数据之前手动处理
      limit,
      offset,
      order: [['trans_time', 'DESC']]
    });

    // 手动处理 `trans_time` 的别名
    const formattedRows = rows.map(row => {
      const plainRow = row.get({ plain: true });
      return {
        ...plainRow,
        type: plainRow.trans_type, // 添加 type 字段给前端使用
        transaction_time: plainRow.trans_time // 添加 transaction_time 字段
      };
    });
    
    res.json({
      totalItems: count,
      totalPages: Math.ceil(count / limit),
      currentPage: parseInt(page, 10),
      transactions: formattedRows // 返回格式化后的数据
    });

  } catch (error) {
    res.status(500).json({ message: 'Error fetching transactions', error: error.message });
  }
});

// GET /api/transactions/export - 导出交易记录为Excel
router.get('/export', protect, async (req, res) => {
  try {
    // 1. 复用和查询API完全一样的筛选逻辑
    const { partId, userId, type, startDate, endDate } = req.query; // Allow 'type'
    const trans_type = type; // Create alias

    const whereCondition = {};
    // 支持单个或多个 partId (逗号分隔)
    if (partId) {
      const partIds = partId.split(',');
      whereCondition.part_id = { [Op.in]: partIds };
    }
    if (userId) whereCondition.user_id = userId;
    if (trans_type) whereCondition.trans_type = trans_type; // Use alias
    if (startDate && endDate) {
        whereCondition.trans_time = { // Corrected: transaction_time -> trans_time
            [Op.between]: [new Date(startDate), new Date(endDate)]
        };
    }

    // 2. 查询所有符合条件的记录，不分页
    const transactions = await Transaction.findAll({
      where: whereCondition,
      include: [
        { model: Part, attributes: ['part_number', 'part_name'] },
        { model: User, attributes: ['user_name'] } // Corrected: username -> user_name
      ],
      order: [['trans_time', 'ASC']] // Corrected: transaction_time -> trans_time
    });

    // 3. 动态生成文件名
    let fileName = '出入库记录';

    if (partId) {
      const partIds = partId.split(',');
      const parts = await Part.findAll({
        where: { id: { [Op.in]: partIds } },
        attributes: ['part_name']
      });
      const partNames = parts.map(p => p.part_name).join('-');
      if (partNames) {
        fileName += `-${partNames}`;
      }
    }

    if (startDate && endDate) {
      const formattedStartDate = new Date(startDate).toISOString().split('T')[0];
      const formattedEndDate = new Date(endDate).toISOString().split('T')[0];
      fileName += `-${formattedStartDate}_to_${formattedEndDate}`;
    }

    fileName += '.xlsx'; // 添加扩展名

    // 4. 使用 exceljs 创建Excel文件
    const workbook = new excel.Workbook();
    const worksheet = workbook.addWorksheet('出入库记录');

    worksheet.columns = [
      { header: '操作时间', key: 'time', width: 25 },
      { header: '配件编号', key: 'p_num', width: 20 },
      { header: '配件名称', key: 'p_name', width: 30 },
      { header: '类型', key: 'type', width: 10 },
      { header: '数量', key: 'qty', width: 10 },
      { header: '经手人', key: 'user', width: 15 },
      { header: '备注', key: 'remarks', width: 40 }
    ];

    // 5. 填充数据
    transactions.forEach(t => {
      worksheet.addRow({
        time: t.trans_time, // Corrected: transaction_time -> trans_time
        p_num: t.Part?.part_number,
        p_name: t.Part?.part_name,
        type: t.trans_type === 'IN' ? '入库' : '出库', // Corrected: type -> trans_type
        qty: t.quantity,
        user: t.User?.user_name, // Corrected: username -> user_name
        remarks: t.remarks
      });
    });

    // 6. 设置响应头，并发送文件
    const encodedFileName = encodeURIComponent(fileName);
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename*=UTF-8''${encodedFileName}`);

    await workbook.xlsx.write(res);
    res.end();

  } catch (error) {
    console.error('Export failed:', error);
    res.status(500).json({ message: 'Error exporting transactions' });
  }
});

module.exports = router;