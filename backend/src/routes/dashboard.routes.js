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

// --- Defective Parts by Supplier ---
// GET /api/dashboard/defective-summary
router.get('/defective-summary', async (req, res) => {
  try {
    const defectSummary = await Transaction.findAll({
      where: { trans_type: 'DEFECT' },
      attributes: [
        [sequelize.fn('SUM', sequelize.col('quantity')), 'total_defects'],
      ],
      include: [{
        model: Part,
        attributes: ['id', 'part_name'],
        include: [{
          model: Supplier,
          attributes: ['id', 'supplier_name'],
        }]
      }],
      group: ['Part.id', 'Part->Supplier.id'],
      order: [[sequelize.fn('SUM', sequelize.col('quantity')), 'DESC']],
      raw: true, // Get plain JSON results
    });

    // Remap results for a cleaner structure
    const results = defectSummary.map(item => ({
      supplier_id: item['Part.Supplier.id'],
      supplier_name: item['Part.Supplier.supplier_name'],
      total_defects: parseInt(item.total_defects, 10),
    }));

    // Aggregate results by supplier
    const finalSummary = results.reduce((acc, current) => {
      const existing = acc.find(item => item.supplier_id === current.supplier_id);
      if (existing) {
        existing.total_defects += current.total_defects;
      } else {
        acc.push({ ...current });
      }
      return acc;
    }, []);
    
    // Sort final summary
    finalSummary.sort((a, b) => b.total_defects - a.total_defects);

    res.json(finalSummary);
  } catch (error) {
    console.error('Error fetching defective summary:', error);
    res.status(500).json({ message: 'Error fetching defective summary', error: error.message });
  }
});

module.exports = router; 