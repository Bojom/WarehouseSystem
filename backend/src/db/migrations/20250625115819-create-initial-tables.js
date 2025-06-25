'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    // Create suppliers table
    await queryInterface.createTable('suppliers', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false
      },
      supplier_name: {
        type: Sequelize.STRING,
        unique: true,
        allowNull: false
      },
      contact: {
        type: Sequelize.TEXT
      }
    });

    // Create users table
    await queryInterface.createTable('users', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false
      },
      user_name: {
        type: Sequelize.STRING(100),
        unique: true,
        allowNull: false
      },
      password_hash: {
        type: Sequelize.STRING,
        allowNull: false
      },
      user_role: {
        type: Sequelize.STRING(50),
        allowNull: false
      },
      creation_time: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      }
    });

    // Create parts table
    await queryInterface.createTable('parts', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false
      },
      part_number: {
        type: Sequelize.STRING(100),
        unique: true,
        allowNull: false
      },
      part_name: {
        type: Sequelize.STRING,
        allowNull: false
      },
      spec: {
        type: Sequelize.STRING
      },
      unit: {
        type: Sequelize.STRING(50),
        allowNull: false
      },
      stock: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0
      },
      stock_min: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0
      },
      stock_max: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 100
      },
      supplier_id: {
        type: Sequelize.INTEGER,
        references: {
          model: 'suppliers', // table name
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      },
      creation_time: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      },
      updated_time: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      }
    });

    // Create transactions table
    await queryInterface.createTable('transactions', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false
      },
      part_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'parts', // table name
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      user_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'users', // table name
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT'
      },
      trans_type: {
        type: Sequelize.STRING(10),
        allowNull: false
      },
      quantity: {
        type: Sequelize.INTEGER,
        allowNull: false
      },
      trans_time: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      },
      remarks: {
        type: Sequelize.TEXT
      }
    });
  },

  async down(queryInterface, Sequelize) {
    // Drop tables in reverse order of creation to handle foreign key constraints
    await queryInterface.dropTable('transactions');
    await queryInterface.dropTable('parts');
    await queryInterface.dropTable('users');
    await queryInterface.dropTable('suppliers');
  }
};