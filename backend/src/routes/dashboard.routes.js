const express = require('express');
const router = express.Router();
const { Op, col } = require('sequelize');
const sequelize = require('../config/db.config');
const Part = require('../models/part.model');
const Transaction = require('../models/transaction.model');
const { protect } = require('../middleware/auth.middleware');
const Supplier = require('../models/supplier.model');

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

// GET /api/transactions/trends - 重构后的趋势数据端点
router.get('/trends', protect, async (req, res) => {
  try {
    const days = parseInt(req.query.days || 30, 10);

    // This powerful SQL query uses a Common Table Expression (CTE) to generate
    // a date series for the last N days. It then LEFT JOINs the transactions
    // and uses conditional aggregation (the FILTER clause) to correctly count
    // IN and OUT types without cross-multiplication.
    const query = `
      WITH date_series AS (
        SELECT generate_series(
          (CURRENT_DATE - make_interval(days => :days - 1)),
          CURRENT_DATE,
          '1 day'
        )::date AS report_date
      )
      SELECT
        ds.report_date::text,
        COUNT(t.id) FILTER (WHERE t.trans_type = 'IN') AS inbound_count,
        COUNT(t.id) FILTER (WHERE t.trans_type = 'OUT') AS outbound_count
      FROM
        date_series ds
      LEFT JOIN
        transactions t ON ds.report_date = t.trans_time::date
      GROUP BY
        ds.report_date
      ORDER BY
        ds.report_date;
    `;

    const results = await sequelize.query(query, {
      replacements: { days },
      type: sequelize.QueryTypes.SELECT
    });

    // The data is already perfectly formatted. We just extract it into the arrays for ECharts.
    const dates = results.map(row => row.report_date);
    const inboundData = results.map(row => parseInt(row.inbound_count, 10));
    const outboundData = results.map(row => parseInt(row.outbound_count, 10));

    res.json({ dates, inboundData, outboundData });

  } catch (error) {
    console.error('Failed to fetch trends data:', error);
    res.status(500).json({ message: 'Error fetching trends data' });
  }
});

// GET /api/transactions - 获取出入库记录列表（带筛选和分页）
router.get('/', protect, async (req, res) => {
  try {
    // ... existing code ...
  } catch (error) {
    console.error('Failed to fetch transactions:', error);
    res.status(500).json({ message: 'Error fetching transactions', error: error.message });
  }
});

router.get('/stock-composition', protect, async (req, res) => {
  try {
    const stockComposition = await Part.findAll({
      attributes: [
        // 使用 sequelize.fn 来调用数据库的聚合函数 SUM
        [sequelize.fn('SUM', sequelize.col('stock')), 'total_stock'] 
      ],
      include: [{
        model: Supplier,
        attributes: ['supplier_name'], // We need to group by supplier name
        required: true // Ensure we only return parts that have a supplier
      }],
      group: ['Supplier.id', 'Supplier.supplier_name'], // Group by supplier ID and name
      raw: true // Get raw data for easier processing
    });
    
    // Format the result for the ECharts pie chart
    const formattedData = stockComposition.map(item => ({
      value: parseInt(item.total_stock, 10),
      name: item['Supplier.supplier_name']
    }));

    res.json(formattedData);
  } catch (error) {
    console.error('Failed to fetch stock composition data:', error);
    res.status(500).json({ message: 'Error fetching stock composition data' });
  }
});

// GET /api/dashboard/stock-status-summary - 获取库存状态统计
router.get('/stock-status-summary', protect, async (req, res) => {
  try {
    // 使用 sequelize.fn 和 group 来高效地进行分类计数
    const statusCounts = await Part.findAll({
      attributes: [
        [
          sequelize.literal(`
            CASE
              WHEN stock < stock_min THEN 'low_stock'
              WHEN stock > stock_max THEN 'over_stock'
              ELSE 'normal'
            END
          `),
          'status'
        ],
        [sequelize.fn('COUNT', sequelize.col('id')), 'count']
      ],
      group: ['status'],
      raw: true
    });

    // 将结果格式化为 { low: ..., normal: ..., over: ... }
    const result = {
      low_stock: 0,
      normal: 0,
      over_stock: 0,
    };

    statusCounts.forEach(item => {
      if (result.hasOwnProperty(item.status)) {
        result[item.status] = parseInt(item.count, 10);
      }
    });
    
    res.json(result);
  } catch (error) {
    console.error('Failed to fetch stock status summary:', error);
    res.status(500).json({ message: 'Error fetching stock status summary' });
  }
});

module.exports = router; 