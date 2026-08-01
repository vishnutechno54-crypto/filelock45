const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const User = require('../models/User');
const Activity = require('../models/Activity');
const { protect } = require('../middleware/auth');

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRE || '7d' });
};

const isDatabaseUnavailable = (error) => {
  return error?.name === 'MongoServerSelectionError' || error?.name === 'MongooseServerSelectionError' || error?.name === 'MongoNetworkError' || error?.message?.includes('buffering timed out') || error?.message?.includes('serverSelectionTimeoutMS') || error?.code === 'ECONNREFUSED' || error?.code === 'ENOTFOUND';
};

// @route POST /api/auth/register
router.post(
  '/register',
  [
    body('name').trim().notEmpty().withMessage('Name is required').isLength({ max: 50 }).withMessage('Name cannot exceed 50 characters'),
    body('email').isEmail().normalizeEmail().withMessage('Valid email required'),
    body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters'),
  ],
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ success: false, message: errors.array()[0].msg });
      }

      const { name, email, password } = req.body;

      const existing = await User.findOne({ email });
      if (existing) {
        return res.status(400).json({ success: false, message: 'An account with this email already exists.' });
      }

      // Public signups are always created as regular users, never admins.
      const user = await User.create({ name, email, password, role: 'user' });

      await Activity.create({
        user: user._id,
        action: 'login',
        ipAddress: req.ip,
        details: 'Account created via public registration',
      });

      const token = generateToken(user._id);

      res.status(201).json({
        success: true,
        token,
        user: {
          _id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          storageUsed: user.storageUsed,
          storageLimit: user.storageLimit,
        },
      });
    } catch (error) {
      if (isDatabaseUnavailable(error)) {
        return res.status(503).json({ success: false, message: 'Database is temporarily unavailable. Please try again shortly.' });
      }
      next(error);
    }
  }
);

// @route POST /api/auth/login
router.post(
  '/login',
  [
    body('email').isEmail().normalizeEmail().withMessage('Valid email required'),
    body('password').notEmpty().withMessage('Password required'),
  ],
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ success: false, message: errors.array()[0].msg });
      }

      const { email, password } = req.body;
      const user = await User.findOne({ email }).select('+password');

      if (!user || !(await user.matchPassword(password))) {
        return res.status(401).json({ success: false, message: 'Invalid email or password.' });
      }

      if (!user.isActive) {
        return res.status(401).json({ success: false, message: 'Account has been deactivated.' });
      }

      user.lastLogin = new Date();
      await user.save({ validateBeforeSave: false });

      await Activity.create({
        user: user._id,
        action: 'login',
        ipAddress: req.ip,
        details: `Logged in from ${req.headers['user-agent'] || 'unknown device'}`,
      });

      const token = generateToken(user._id);

      res.json({
        success: true,
        token,
        user: {
          _id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          storageUsed: user.storageUsed,
          storageLimit: user.storageLimit,
        },
      });
    } catch (error) {
      if (isDatabaseUnavailable(error)) {
        return res.status(503).json({ success: false, message: 'Database is temporarily unavailable. Please try again shortly.' });
      }
      next(error);
    }
  }
);

// @route GET /api/auth/me
router.get('/me', protect, async (req, res) => {
  res.json({ success: true, user: req.user });
});

// @route POST /api/auth/logout
router.post('/logout', protect, async (req, res, next) => {
  try {
    await Activity.create({
      user: req.user._id,
      action: 'logout',
      ipAddress: req.ip,
    });
    res.json({ success: true, message: 'Logged out successfully.' });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
