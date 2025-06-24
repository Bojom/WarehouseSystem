// backend/src/models/user.model.js

const { DataTypes } = require('sequelize');
const sequelize = require('../config/db.config.js');

const User = sequelize.define(
  'User',
  {
    // model attributes are defined based on the database table fields
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    user_name: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true, // ensure the user_name is unique
    },
    password_hash: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    user_role: {
      type: DataTypes.ENUM('admin', 'operator'),
      allowNull: false,
      defaultValue: 'operator', // New users default to operator
    },
    status: {
      type: DataTypes.ENUM('active', 'pending', 'paused'),
      allowNull: false,
      defaultValue: 'pending', // New users must be approved by an admin
    },
    creation_time: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    // model options
    tableName: 'users', // explicitly specify the table name
    timestamps: false, // we manually manage the creation_time, so disable Sequelize's automatic timestamp
  }
);

module.exports = User;
