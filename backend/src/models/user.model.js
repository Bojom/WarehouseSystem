// backend/src/models/user.model.js

const { DataTypes } = require('sequelize');
const sequelize = require('../config/db.config.js'); // 引入我们统一的数据库连接实例

const User = sequelize.define('User', {
  // 模型属性是根据你的数据库表字段定义的
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  user_name: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true // 确保用户名是唯一的
  },
  password_hash: {
    type: DataTypes.STRING,
    allowNull: false
  },
  user_role: {
    type: DataTypes.ENUM('admin', 'operator'), // 角色只能是'admin'或'operator'
    allowNull: false
  },
  creation_time: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  }
}, {
  // 模型选项
  tableName: 'users', // 明确指定表名
  timestamps: false // 我们手动管理了created_at，所以关闭Sequelize的自动时间戳
});

module.exports = User;