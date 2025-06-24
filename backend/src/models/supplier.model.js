// backend/src/models/supplier.model.js
const { DataTypes } = require('sequelize');
const sequelize = require('../config/db.config.js');

const Supplier = sequelize.define(
  'Supplier',
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    supplier_name: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
    },
    contact: {
      type: DataTypes.STRING,
      allowNull: true,
    },
  },
  {
    tableName: 'suppliers',
    timestamps: false,
  }
);

module.exports = Supplier;
