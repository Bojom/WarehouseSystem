// backend/src/scripts/syncDb.js

// This script will create all defined tables in the database.
// It should only be run once, or when models are changed.

const sequelize = require('../config/db.config.js');

// Import all models so Sequelize knows about them
require('../models/user.model.js');
require('../models/part.model.js');
require('../models/supplier.model.js');
require('../models/transaction.model.js');

const syncDatabase = async () => {
  try {
    console.log('Starting database synchronization...');
    // The { alter: true } option is safer than { force: true } as it won't drop tables.
    // It will attempt to make non-destructive changes to match the models.
    await sequelize.sync({ alter: true });
    console.log('✅ Database synchronized successfully.');
  } catch (error) {
    console.error('❌ Unable to synchronize the database:', error);
  } finally {
    await sequelize.close();
  }
};

syncDatabase();
