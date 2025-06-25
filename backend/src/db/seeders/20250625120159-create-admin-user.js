'use strict';
const bcrypt = require('bcryptjs');
// Correctly locate the .env file from the backend/src/db/seeders directory
require('dotenv').config({ path: require('path').resolve(__dirname, '../../../.env') });

module.exports = {
  async up(queryInterface, Sequelize) {
    const adminUsername = process.env.ADMIN_USER || 'admin';
    const adminPassword = process.env.ADMIN_PASSWORD;

    if (!adminPassword) {
      console.error('Error: ADMIN_PASSWORD environment variable is not set. Cannot seed admin user.');
      // In a seeder, we might not want to throw an error that stops the whole process,
      // but we should log it clearly.
      return;
    }

    // Hash the password
    const salt = await bcrypt.genSalt(10);
    const password_hash = await bcrypt.hash(adminPassword, salt);

    // Check if the admin user already exists
    const users = await queryInterface.sequelize.query(
      `SELECT * FROM "users" WHERE "user_name" = :user_name`,
      {
        replacements: { user_name: adminUsername },
        type: queryInterface.sequelize.QueryTypes.SELECT
      }
    );

    if (users.length === 0) {
      // Insert the admin user if it doesn't exist
      await queryInterface.bulkInsert('users', [{
        user_name: adminUsername,
        password_hash: password_hash,
        user_role: 'admin',
        creation_time: new Date()
      }], {});
      console.log(`Admin user "${adminUsername}" created successfully.`);
    } else {
      console.log(`Admin user "${adminUsername}" already exists. Seeder skipped.`);
    }
  },

  async down(queryInterface, Sequelize) {
    const adminUsername = process.env.ADMIN_USER || 'admin';
    // Remove the admin user
    await queryInterface.bulkDelete('users', { user_name: adminUsername }, {});
    console.log(`Admin user "${adminUsername}" removed.`);
  }
};