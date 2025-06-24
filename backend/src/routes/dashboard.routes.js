const express = require('express');
const router = express.Router();
const { Op, col } = require('sequelize');
const sequelize = require('../config/db.config');
const Part = require('../models/part.model');
const Transaction = require('../models/transaction.model');
const { protect } = require('../middleware/auth.middleware');
const Supplier = require('../models/supplier.model');

// GET /api/dashboard
router.get('/', protect, async (req, res) => {
  try {
    // 1. part variety count
    const partVarietyCount = await Part.count();

    // 2. today inbound and outbound count
    const today = new Date();
    today.setHours(0, 0, 0, 0); // start of the day
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1); // start of the next day

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

    // 3. stock warning: find parts with stock less than the minimum stock
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
    res
      .status(500)
      .json({ message: 'Error fetching dashboard data', error: error.message });
  }
});

// GET /api/transactions/trends
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
      type: sequelize.QueryTypes.SELECT,
    });

    // We just extract the data into the arrays for ECharts.
    const dates = results.map((row) => row.report_date);
    const inboundData = results.map((row) => parseInt(row.inbound_count, 10));
    const outboundData = results.map((row) => parseInt(row.outbound_count, 10));

    res.json({ dates, inboundData, outboundData });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching trends data' });
  }
});

// GET /api/dashboard/stock-status
router.get('/stock-status', protect, async (req, res) => {
  try {
    const lowStock = await Part.count({
      where: {
        stock: { [Op.lt]: col('stock_min') },
      },
    });

    const overStock = await Part.count({
      where: {
        stock_max: { [Op.ne]: null },
        stock: { [Op.gt]: col('stock_max') },
      },
    });

    const totalParts = await Part.count();
    const normalStock = totalParts - lowStock - overStock;

    res.json({ lowStock, normalStock, overStock });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching stock status data' });
  }
});

// GET /api/transactions
router.get('/', protect, async (req, res) => {
  try {
  } catch (error) {
    console.error('Failed to fetch transactions:', error);
    res
      .status(500)
      .json({ message: 'Error fetching transactions', error: error.message });
  }
});

// GET /api/dashboard/top-anomaly-suppliers
router.get('/top-anomaly-suppliers', protect, async (req, res) => {
  try {
    const topN = req.query.limit || 10;

    const results = await Transaction.findAll({
      where: { trans_type: 'ANOMALY' },
      attributes: [
        [sequelize.fn('SUM', sequelize.col('quantity')), 'anomalyScore'],
      ],
      include: [
        {
          model: Part,
          attributes: ['part_name'],
          required: true,
          include: [
            {
              model: Supplier,
              attributes: ['supplier_name'],
              required: true,
            },
          ],
        },
      ],
      group: ['Part->Supplier.id', 'Part->Supplier.supplier_name'],
      order: [[sequelize.literal('"anomalyScore"'), 'DESC']],
      limit: topN,
      raw: true,
      subQuery: false,
    });

    const supplierNames = results.map(
      (item) => item['Part.Supplier.supplier_name']
    );
    const anomalyScores = results.map((item) =>
      parseInt(item.anomalyScore, 10)
    );

    res.json({ supplierNames, anomalyScores });
  } catch (error) {
    res.status(500).json({
      message: 'Error fetching top anomaly suppliers',
      error: error.message,
    });
  }
});

module.exports = router;
