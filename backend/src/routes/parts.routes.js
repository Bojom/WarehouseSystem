// backend/src/routes/parts.routes.js

const express = require('express');

// --- ESPION INTERNE AU ROUTEUR ---
console.log('✅ ROUTER [parts.routes.js] loading...');
// ---------------------------------

const router = express.Router();
const { Op } = require('sequelize'); // 引入 Sequelize 的操作符，用于 LIKE 查询
const Part = require('../models/part.model');
const Supplier = require('../models/supplier.model'); // 引入Supplier以便包含其信息
const { protect } = require('../middleware/auth.middleware');

// Définir un middleware de vérification des permissions d'administrateur
const isAdmin = (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    next();
  } else {
    res.status(403).json({ message: 'Forbidden: Admins only' });
  }
};

// --- Appliquer la protection à toutes les routes des fournisseurs
router.use(protect);

// --- Création (Create) ---
// POST /api/parts
router.post('/', isAdmin, async (req, res) => {
  try {
    const newPart = await Part.create(req.body);
    res.status(201).json(newPart);
  } catch (error) {
    if (error.name === 'SequelizeUniqueConstraintError') {
      // 检查是哪个字段冲突
      const field = error.errors[0].path;
      const value = error.errors[0].value;
      return res.status(409).json({ 
        message: `创建失败：${field} "${value}" 已经存在。`,
        error: 'Unique constraint violation' 
      });
    }
    // 对于其他类型的错误，返回通用错误
    res.status(500).json({ message: '服务器内部错误 (Internal Server Error)', error: error.message });
  }
});

// --- 读取 (Read) ---
// GET /api/parts - 获取配件列表（带搜索和分页）
router.get('/', async (req, res) => {
  try {
    const { search, page = 1, pageSize = 10 } = req.query;
    
    let whereCondition = {};
    if (search) {
      whereCondition = {
        [Op.or]: [
          { part_name: { [Op.iLike]: `%${search}%` } }, // iLike 不区分大小写
          { part_number: { [Op.iLike]: `%${search}%` } }
        ]
      };
    }

    const limit = parseInt(pageSize, 10);
    const offset = (parseInt(page, 10) - 1) * limit;

    const { count, rows } = await Part.findAndCountAll({
      where: whereCondition,
      include: [{ // 关键：包含关联的供应商信息
        model: Supplier,
        attributes: ['id', 'name'] // 只选择需要的供应商字段
      }],
      limit,
      offset,
      order: [['part_name', 'ASC']]
    });

    res.json({
      totalItems: count,
      totalPages: Math.ceil(count / limit),
      currentPage: parseInt(page, 10),
      parts: rows
    });

  } catch (error) {
    res.status(500).json({ message: 'Error fetching parts', error: error.message });
  }
});

// GET /api/parts/:id - 获取单个配件详情
router.get('/:id', async (req, res) => {
  try {
    const part = await Part.findByPk(req.params.id, {
      include: [Supplier] // 包含完整的供应商信息
    });
    if (part) {
      res.json(part);
    } else {
      res.status(404).json({ message: 'Part not found' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Error fetching part', error: error.message });
  }
});

// --- 更新 (Update) ---
// PUT /api/parts/:id
router.put('/:id', isAdmin, async (req, res) => {
  try {
    const [updated] = await Part.update(req.body, {
      where: { id: req.params.id }
    });
    if (updated) {
      const updatedPart = await Part.findByPk(req.params.id);
      res.json(updatedPart);
    } else {
      res.status(404).json({ message: 'Part not found' });
    }
  } catch (error) {
    res.status(400).json({ message: 'Error updating part', error: error.message });
  }
});

// --- 删除 (Delete) ---
// DELETE /api/parts/:id
router.delete('/:id', isAdmin, async (req, res) => {
  try {
    const deleted = await Part.destroy({
      where: { id: req.params.id }
    });
    if (deleted) {
      res.status(204).send(); // 204 No Content
    } else {
      res.status(404).json({ message: 'Part not found' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Error deleting part', error: error.message });
  }
});


module.exports = router;