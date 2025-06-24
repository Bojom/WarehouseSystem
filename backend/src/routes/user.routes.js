// backend/src/routes/user.routes.js

const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/user.model.js');

const { protect } = require('../middleware/auth.middleware.js');
const { isAdmin } = require('../middleware/isAdmin.middleware.js');

const router = express.Router();

// to parse the JSON data in the request body, we need to add the middleware
router.use(express.json());

// POST /api/users/register
// This route is now protected and for admins only again.
router.post('/register', protect, isAdmin, async (req, res) => {
  try {
    const { user_name, password, user_role } = req.body;

    // Admin must specify a valid role
    if (!['admin', 'operator'].includes(user_role)) {
      return res.status(400).json({ message: 'Invalid user role specified.' });
    }

    // 1. hash the password
    const salt = await bcrypt.genSalt(10);
    const password_hash = await bcrypt.hash(password, salt);

    // 2. create a new user. Status will default to 'active' for admin-created users
    // if we update the model default. Let's set it explicitly to be safe.
    const newUser = await User.create({
      user_name,
      password_hash,
      user_role,
      status: 'active', // Accounts created by admin are active immediately
    });

    res.status(201).json({
      message: 'User registered successfully.',
      userId: newUser.id,
    });
  } catch (error) {
    // Handle potential unique constraint error
    if (error.name === 'SequelizeUniqueConstraintError') {
      return res.status(409).json({ message: 'Username already exists.' });
    }
    res
      .status(500)
      .json({ message: 'Error registering user', error: error.message });
  }
});

// POST /api/users/login
router.post('/login', async (req, res) => {
  try {
    const { user_name, password } = req.body;

    // 1. find the user
    const user = await User.findOne({ where: { user_name } });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // NEW: Check if the user's account is active
    if (user.status !== 'active') {
      return res.status(403).json({
        message: 'Account is not active. Please contact an administrator.',
      });
    }

    // 2. compare the password
    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // 3. password matches, generate JWT
    const payload = {
      id: user.id,
      username: user.user_name,
      role: user.user_role,
    };

    const token = jwt.sign(
      payload,
      process.env.JWT_SECRET, // use the secret key from the environment variable
      { expiresIn: '1h' } // token expires in 1 hour
    );

    res.json({
      message: 'Logged in successfully',
      token: token,
    });
  } catch (error) {
    res.status(500).json({ message: 'Error logging in', error: error.message });
  }
});

// GET /api/users/profile
router.get('/profile', protect, async (req, res) => {
  // 'req.user' is added to the request object by the protect middleware from the token
  const userId = req.user.id;

  try {
    // to be safe, we don't return req.user (which may contain iat/exp info)
    // instead, we re-lookup the user by ID and only return the necessary fields
    const user = await User.findByPk(userId, {
      attributes: ['id', 'user_name', 'user_role'], // only select these fields
    });

    if (user) {
      const userProfile = {
        id: user.id,
        username: user.user_name,
        role: user.user_role,
      };
      res.json({ userProfile });
    } else {
      res.status(404).json({ message: 'User not found' });
    }
  } catch (error) {
    res
      .status(500)
      .json({ message: 'Error fetching profile', error: error.message });
  }
});

// GET /api/users
router.get('/', protect, isAdmin, async (req, res) => {
  try {
    const users = await User.findAll({
      attributes: ['id', 'user_name', 'user_role', 'status', 'creation_time'],
    });
    res.json(users);
  } catch (error) {
    res
      .status(500)
      .json({ message: 'Failed to retrieve users.', error: error.message });
  }
});

// PUT /api/users/:id/role
router.put('/:id/role', protect, isAdmin, async (req, res) => {
  try {
    const { role } = req.body;
    if (!['admin', 'operator'].includes(role)) {
      return res.status(400).json({ message: 'Invalid role specified.' });
    }
    const [updated] = await User.update(
      { user_role: role },
      { where: { id: req.params.id } }
    );
    if (updated) {
      res.status(200).json({ message: 'User role updated successfully.' });
    } else {
      res.status(404).json({ message: 'User not found.' });
    }
  } catch (error) {
    res
      .status(500)
      .json({ message: 'Failed to update user role.', error: error.message });
  }
});

// PUT /api/users/:id/status
router.put('/:id/status', protect, isAdmin, async (req, res) => {
  try {
    const { status } = req.body;
    if (!['active', 'pending', 'paused'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status specified.' });
    }
    const [updated] = await User.update(
      { status: status },
      { where: { id: req.params.id } }
    );
    if (updated) {
      res.status(200).json({ message: 'User status updated successfully.' });
    } else {
      res.status(404).json({ message: 'User not found.' });
    }
  } catch (error) {
    res
      .status(500)
      .json({ message: 'Failed to update user status.', error: error.message });
  }
});

module.exports = router;
