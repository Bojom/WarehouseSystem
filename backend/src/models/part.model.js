// backend/src/models/part.model.js
const { DataTypes } = require('sequelize');
const sequelize = require('../config/db.config.js');
const Supplier = require('./supplier.model.js');

const Part = sequelize.define(
  'Part',
  {
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
        key: 'id',
      },
    },
  },
  {
    tableName: 'parts',
    timestamps: true,
    createdAt: 'creation_time',
    updatedAt: 'updated_time',
  }
);

// match Supplier hasMany Part
Supplier.hasMany(Part, { foreignKey: 'supplier_id' });
// one Part belongs To one Supplier
Part.belongsTo(Supplier, { foreignKey: 'supplier_id' });

module.exports = Part;
