const express = require('express');
const router = express.Router();
const { Op, col } = require('sequelize');
const Part = require('../models/part.model');
const Transaction = require('../models/transaction.model');
const { protect } = require('../middleware/auth.middleware');

// GET /api/dashboard - 获取仪表盘聚合数据
router.get('/', protect, async (req, res) => {
  try {
    // 1. 配件种类总数
    const partVarietyCount = await Part.count();

    // 2. 今日出入库次数
    const today = new Date();
    today.setHours(0, 0, 0, 0); // 当天开始时间
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1); // 第二天开始时间

    const todayInCount = await Transaction.count({
      where: {
        trans_type: 'IN',
        trans_time: {
          [Op.gte]: today,
          [Op.lt]: tomorrow,
        },
      },
    });

    const todayOutCount = await Transaction.count({
      where: {
        trans_type: 'OUT',
        trans_time: {
          [Op.gte]: today,
          [Op.lt]: tomorrow,
        },
      },
    });

    // 3. 库存预警: 查找库存量小于最小库存量的配件
    const lowStockItems = await Part.findAll({
      where: {
        stock: {
          [Op.lt]: col('stock_min'),
        },
      },
      order: [['stock', 'ASC']],
    });

    res.json({
      partVarietyCount,
      todayInCount,
      todayOutCount,
      lowStockItems,
    });
  } catch (error) {
    console.error('Failed to fetch dashboard data:', error);
    res.status(500).json({ message: 'Error fetching dashboard data', error: error.message });
  }
});

module.exports = router; 