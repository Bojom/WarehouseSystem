// backend/src/routes/inventory.routes.js
const express = require('express');
const router = express.Router();
const { Op, Sequelize } = require('sequelize');
const Part = require('../models/part.model');
const Supplier = require('../models/supplier.model'); // 可能也需要包含供应商信息
const { protect } = require('../middleware/auth.middleware');
const { sequelize } = require('sequelize');

// Apply authentication middleware to all routes in this file
router.use(protect);

// GET /api/inventory/status - 获取所有配件的库存状态
router.get('/status', async (req, res) => {
  try {
    const totalParts = await Part.count();
    
    const totalStock = await Part.sum('stock');

    const lowStockParts = await Part.count({
      where: {
        stock: {
          [Op.lt]: Sequelize.col('stock_min')
        }
      }
    });

    const outOfStockParts = await Part.count({
      where: {
        stock: 0
      }
    });

    res.json({
      totalParts,
      totalStock: totalStock || 0, // Ensure it's not null if there are no parts
      lowStockParts,
      outOfStockParts
    });

  } catch (error) {
    console.error('Error fetching inventory status:', error);
    res.status(500).json({ message: 'Error fetching inventory status', error: error.message });
  }
});

// GET /api/inventory/details - Get a detailed list of all parts with their status
router.get('/details', async (req, res) => {
  try {
    const parts = await Part.findAll({
      include: [{
        model: Supplier,
        attributes: ['supplier_name']
      }],
      order: [['part_name', 'ASC']]
    });

    // Manually calculate the status for each part
    const partsWithStatus = parts.map(part => {
      const partJson = part.toJSON();
      let status = 'normal';
      
      if (partJson.stock === 0) {
        status = 'out_of_stock'; // Add a specific status for 0
      } else if (partJson.stock < partJson.stock_min) {
        status = 'low_stock';
      } else if (partJson.stock > partJson.stock_max && partJson.stock_max > 0) {
        // Only consider overstock if max is defined
        status = 'over_stock';
      }
      
      return { ...partJson, status };
    });

    res.json(partsWithStatus);

  } catch (error) {
    console.error('Error fetching inventory details:', error);
    res.status(500).json({ message: 'Error fetching inventory details', error: error.message });
  }
});

module.exports = router;