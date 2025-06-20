// backend/src/models/part.model.js
const { DataTypes } = require('sequelize');
const sequelize = require('../config/db.config.js');
const Supplier = require('./supplier.model.js'); // 引入供应商模型

const Part = sequelize.define('Part', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  part_number: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
  },
  part_name: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  spec: {
    type: DataTypes.STRING,
  },
  unit: {
    type: DataTypes.STRING(50),
    allowNull: false,
    defaultValue: 'pcs',
  },
  stock: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0,
  },
  stock_min: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0,
  },
  stock_max: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 100,
  },
  supplier_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: Supplier,
      key: 'id'
    }
  },
}, {
  tableName: 'parts',
  timestamps: true,
  createdAt: 'creation_time',
  updatedAt: 'updated_time',
});

// 关键一步: 定义关联关系
// 一个供应商 (Supplier) 有多个 (hasMany) 配件 (Part)
Supplier.hasMany(Part, { foreignKey: 'supplier_id' });
// 一个配件 (Part) 属于 (belongsTo) 一个供应商 (Supplier)
Part.belongsTo(Supplier, { foreignKey: 'supplier_id' });

module.exports = Part;