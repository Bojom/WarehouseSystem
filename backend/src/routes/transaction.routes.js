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

// POST /api/transactions
router.post('/', protect, async (req, res) => {
  const { part_id, trans_type, quantity, remarks } = req.body;
  const user_id = req.user.id;

  try {
    const result = await sequelize.transaction(async (t) => {
      const part = await Part.findByPk(part_id, {
        lock: t.LOCK.UPDATE,
        transaction: t,
      });

      if (!part) {
        throw new Error('配件不存在');
      }

      if (trans_type === 'IN') {
        if (part.stock_max !== null && part.stock + quantity > part.stock_max) {
          throw new Error(
            `入库失败：数量 ${quantity} 将导致库存 ${part.stock + quantity} 超过最大库存限制 ${part.stock_max}`
          );
        }
        part.stock += quantity;
      } else if (trans_type === 'OUT' || trans_type === 'ANOMALY') {
        if (part.stock < quantity) {
          const message =
            trans_type === 'OUT'
              ? '库存不足，无法出库'
              : '库存不足，无法报为异常';
          throw new Error(message);
        }
        part.stock -= quantity;
      } else {
        throw new Error('无效的操作类型');
      }

      await part.update({ stock: part.stock }, { transaction: t });

      const newTransaction = await Transaction.create(
        {
          part_id,
          user_id,
          trans_type: trans_type,
          quantity,
          remarks,
        },
        { transaction: t }
      );

      return newTransaction;
    });

    res.status(201).json({ message: '操作成功', transaction: result });
  } catch (error) {
    if (
      error.message.includes('库存不足') ||
      error.message.includes('无效的操作类型') ||
      error.message.includes('入库失败')
    ) {
      return res.status(400).json({ message: error.message });
    }
    res.status(500).json({ message: '操作失败', error: error.message });
  }
});

// GET /api/transactions
router.get('/', protect, async (req, res) => {
  try {
    const {
      page = 1,
      pageSize = 10,
      partId,
      userId,
      type,
      startDate,
      endDate,
    } = req.query;
    const trans_type = type;

    const whereCondition = {};
    if (partId) whereCondition.part_id = partId;
    if (userId) whereCondition.user_id = userId;
    if (trans_type) whereCondition.trans_type = trans_type;
    if (startDate && endDate) {
      whereCondition.trans_time = {
        [Op.between]: [new Date(startDate), new Date(endDate)],
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
          attributes: ['part_number', 'part_name', 'spec'],
        },
        {
          model: User,
          attributes: [['user_name', 'username']],
        },
      ],
      limit,
      offset,
      order: [['trans_time', 'DESC']],
    });

    const formattedRows = rows.map((row) => {
      const plainRow = row.get({ plain: true });
      return {
        ...plainRow,
        type: plainRow.trans_type,
        transaction_time: plainRow.trans_time,
      };
    });

    res.json({
      totalItems: count,
      totalPages: Math.ceil(count / limit),
      currentPage: parseInt(page, 10),
      transactions: formattedRows,
    });
  } catch (error) {
    res.status(500).json({ message: '获取记录失败', error: error.message });
  }
});

// GET /api/transactions/summary
router.get('/summary', protect, async (req, res) => {
  try {
    const summary = await Transaction.findAll({
      attributes: [
        [
          sequelize.fn('DATE_TRUNC', 'day', sequelize.col('trans_time')),
          'date',
        ],
        'trans_type',
        [sequelize.fn('SUM', sequelize.col('quantity')), 'total_quantity'],
      ],
      group: ['date', 'trans_type'],
      order: [['date', 'ASC']],
      raw: true,
    });
    res.json(summary);
  } catch (error) {
    res.status(500).json({ message: 'Failed to get transaction summary' });
  }
});

// GET /api/transactions/export
router.get('/export', protect, async (req, res) => {
  try {
    const { partId, userId, type, startDate, endDate } = req.query;
    const trans_type = type;

    const whereCondition = {};
    if (partId) {
      const partIds = partId.split(',');
      whereCondition.part_id = { [Op.in]: partIds };
    }
    if (userId) whereCondition.user_id = userId;
    if (trans_type) whereCondition.trans_type = trans_type;
    if (startDate && endDate) {
      whereCondition.trans_time = {
        [Op.between]: [new Date(startDate), new Date(endDate)],
      };
    }

    const transactions = await Transaction.findAll({
      where: whereCondition,
      include: [
        { model: Part, attributes: ['part_number', 'part_name'] },
        { model: User, attributes: [['user_name', 'username']] },
      ],
      order: [['trans_time', 'ASC']],
    });

    const getTypeText = (type) => {
      if (type === 'IN') return '入库';
      if (type === 'OUT') return '出库';
      if (type === 'ANOMALY') return '异常';
      return '未知';
    };

    let fileName = '出入库记录';

    if (partId) {
      const partIds = partId.split(',');
      const parts = await Part.findAll({
        where: { id: { [Op.in]: partIds } },
        attributes: ['part_name'],
      });
      const partNames = parts.map((p) => p.part_name).join('-');
      if (partNames) {
        fileName += `-${partNames}`;
      }
    }

    if (startDate && endDate) {
      const formattedStartDate = new Date(startDate)
        .toISOString()
        .split('T')[0];
      const formattedEndDate = new Date(endDate).toISOString().split('T')[0];
      fileName += `-${formattedStartDate}_to_${formattedEndDate}`;
    }

    fileName += '.xlsx';

    const workbook = new excel.Workbook();
    const worksheet = workbook.addWorksheet('出入库记录');

    worksheet.columns = [
      { header: '操作时间', key: 'time', width: 25 },
      { header: '配件编号', key: 'p_num', width: 20 },
      { header: '配件名称', key: 'p_name', width: 30 },
      { header: '类型', key: 'type', width: 10 },
      { header: '数量', key: 'qty', width: 10 },
      { header: '经手人', key: 'user', width: 15 },
      { header: '备注', key: 'remarks', width: 40 },
    ];

    transactions.forEach((t_instance) => {
      const t = t_instance.get({ plain: true });
      worksheet.addRow({
        time: t.trans_time,
        p_num: t.Part?.part_number,
        p_name: t.Part?.part_name,
        type: getTypeText(t.trans_type),
        qty: t.quantity,
        user: t.User?.username,
        remarks: t.remarks,
      });
    });

    const encodedFileName = encodeURIComponent(fileName);
    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    );
    res.setHeader(
      'Content-Disposition',
      `attachment; filename*=UTF-8''${encodedFileName}`
    );

    await workbook.xlsx.write(res);
  } catch (error) {
    res.status(500).json({ message: 'Error exporting transactions' });
  }
});

module.exports = router;
