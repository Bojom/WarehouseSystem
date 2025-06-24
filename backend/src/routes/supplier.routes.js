// backend/src/routes/supplier.routes.js
const express = require('express');
const router = express.Router();
const { Op } = require('sequelize');
const Supplier = require('../models/supplier.model');
const { protect } = require('../middleware/auth.middleware');
const { isAdmin } = require('../middleware/isAdmin.middleware');

// Apply protection to all routes
router.use(protect);

// --- Create ---
// POST /api/suppliers
router.post('/', isAdmin, async (req, res) => {
  try {
    const newSupplier = await Supplier.create(req.body);
    res.status(201).json(newSupplier);
  } catch (error) {
    res.status(400).json({
      message: 'Erreur lors de la création du fournisseur',
      error: error.message,
    });
  }
});

// --- Lecture (Read) ---
// GET /api/suppliers
router.get('/', async (req, res) => {
  try {
    const { search, page = 1, pageSize = 10 } = req.query;

    let whereCondition = {};
    if (search) {
      whereCondition = {
        supplier_name: { [Op.iLike]: `%${search}%` },
      };
    }

    const limit = parseInt(pageSize, 10);
    const offset = (parseInt(page, 10) - 1) * limit;

    const { count, rows } = await Supplier.findAndCountAll({
      where: whereCondition,
      limit,
      offset,
      order: [['supplier_name', 'ASC']],
    });

    res.json({
      totalItems: count,
      totalPages: Math.ceil(count / limit),
      currentPage: parseInt(page, 10),
      suppliers: rows,
    });
  } catch (error) {
    res.status(500).json({
      message: 'Erreur lors de la récupération des fournisseurs',
      error: error.message,
    });
  }
});

// GET /api/suppliers/:id
router.get('/:id', async (req, res) => {
  try {
    const supplier = await Supplier.findByPk(req.params.id);
    if (supplier) {
      res.json(supplier);
    } else {
      res.status(404).json({ message: 'Fournisseur non trouvé' });
    }
  } catch (error) {
    res.status(500).json({
      message: 'Erreur lors de la récupération du fournisseur',
      error: error.message,
    });
  }
});

// --- Update ---
// PUT /api/suppliers/:id
router.put('/:id', isAdmin, async (req, res) => {
  try {
    const [updated] = await Supplier.update(req.body, {
      where: { id: req.params.id },
    });
    if (updated) {
      const updatedSupplier = await Supplier.findByPk(req.params.id);
      res.json(updatedSupplier);
    } else {
      res.status(404).json({ message: 'Fournisseur non trouvé' });
    }
  } catch (error) {
    res.status(400).json({
      message: 'Erreur lors de la mise à jour du fournisseur',
      error: error.message,
    });
  }
});

// --- Delete ---
// DELETE /api/suppliers/:id
router.delete('/:id', isAdmin, async (req, res) => {
  try {
    const deleted = await Supplier.destroy({
      where: { id: req.params.id },
    });
    if (deleted) {
      res.status(204).send(); // No content
    } else {
      res.status(404).json({ message: 'Fournisseur non trouvé' });
    }
  } catch (error) {
    res.status(500).json({
      message: 'Erreur lors de la suppression du fournisseur',
      error: error.message,
    });
  }
});

module.exports = router;
