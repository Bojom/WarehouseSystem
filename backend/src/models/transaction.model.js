// backend/src/models/transaction.model.js
const { DataTypes } = require('sequelize');
const sequelize = require('../config/db.config');
const User = require('./user.model');
const Part = require('./part.model');

const Transaction = sequelize.define('Transaction', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  trans_type: {
    type: DataTypes.ENUM('IN', 'OUT'),
    allowNull: false,
    field: 'trans_type'
  },
  quantity: {
    type: DataTypes.INTEGER,
    allowNull: false,
    validate: {
      min: 1
    }
  },
  remarks: {
    type: DataTypes.TEXT,
  },
  trans_time: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
    field: 'trans_time'
  }
  // user_id 和 part_id 将通过关联自动添加
}, {
  tableName: 'transactions',
  timestamps: false
});

// --- 定义关联关系 ---
// 一个 Transaction 属于一个 User
Transaction.belongsTo(User, { foreignKey: 'user_id' });
User.hasMany(Transaction, { foreignKey: 'user_id' });

// 一个 Transaction 属于一个 Part
Transaction.belongsTo(Part, { foreignKey: 'part_id' });
Part.hasMany(Transaction, { foreignKey: 'part_id' });


module.exports = Transaction;