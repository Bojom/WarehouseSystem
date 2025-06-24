const path = require('path');
// Go up two levels from /scripts/ to the project root, then to the config
const sequelize = require(path.join(__dirname, '..', '/config/db.config.js'));
const User = require(path.join(__dirname, '..', '/models/user.model.js'));
const bcrypt = require('bcryptjs');

const seedAdmin = async () => {
  try {
    await sequelize.authenticate();
    console.log('Database connection established.');

    const adminUsername = 'admin';
    const adminPassword = 'admin123';

    // Check if the admin user already exists
    const existingAdmin = await User.findOne({
      where: { user_name: adminUsername },
    });

    if (existingAdmin) {
      console.log(`User "${adminUsername}" already exists.`);
      return;
    }

    // Hash the password
    const salt = await bcrypt.genSalt(10);
    const password_hash = await bcrypt.hash(adminPassword, salt);

    // Create the new admin user
    await User.create({
      user_name: adminUsername,
      password_hash: password_hash,
      user_role: 'admin',
      status: 'active', // Ensure the account is active
    });

    console.log('-----------------------------------------');
    console.log('Admin user created successfully!');
    console.log(`Username: ${adminUsername}`);
    console.log(`Password: ${adminPassword}`);
    console.log('-----------------------------------------');
  } catch (error) {
    console.error('Failed to seed admin user:', error);
  } finally {
    await sequelize.close();
    console.log('Database connection closed.');
  }
};

seedAdmin();
