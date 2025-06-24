// backend/src/models/transaction.model.js
const { DataTypes } = require('sequelize');
const sequelize = require('../config/db.config');
const User = require('./user.model');
const Part = require('./part.model');

const Transaction = sequelize.define(
  'Transaction',
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    trans_type: {
      type: DataTypes.ENUM('IN', 'OUT', 'ANOMALY'),
      allowNull: false,
      field: 'trans_type',
    },
    quantity: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: {
        min: 1,
      },
    },
    remarks: {
      type: DataTypes.TEXT,
    },
    trans_time: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
      field: 'trans_time',
    },
    // user_id and part_id will be added automatically through associations
  },
  {
    tableName: 'transactions',
    timestamps: false,
  }
);

// --- define associations ---
// one Transaction belongs To one User
Transaction.belongsTo(User, { foreignKey: 'user_id' });
User.hasMany(Transaction, { foreignKey: 'user_id' });

// one Transaction belongs To one Part
Transaction.belongsTo(Part, { foreignKey: 'part_id' });
Part.hasMany(Transaction, { foreignKey: 'part_id' });

module.exports = Transaction;
