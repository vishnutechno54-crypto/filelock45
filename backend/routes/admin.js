const express = require('express');
const router = express.Router();
const User = require('../models/User');
const File = require('../models/File');
const Folder = require('../models/Folder');
const Activity = require('../models/Activity');
const { protect, adminOnly } = require('../middleware/auth');
const { body, validationResult } = require('express-validator');

// All admin routes require authentication + admin role
router.use(protect, adminOnly);

// @route GET /api/admin/dashboard
router.get('/dashboard', async (req, res, next) => {
  try {
    const [totalUsers, totalFiles, totalFolders, recentActivity, userStats] = await Promise.all([
      User.countDocuments(),
      File.countDocuments(),
      Folder.countDocuments(),
      Activity.find().populate('user', 'name email').sort({ createdAt: -1 }).limit(20),
      User.aggregate([
        {
          $group: {
            _id: null,
            totalStorage: { $sum: '$storageUsed' },
            avgStorage: { $avg: '$storageUsed' },
          },
        },
      ]),
    ]);

    const fileStats = await File.aggregate([
      { $group: { _id: '$category', count: { $sum: 1 }, size: { $sum: '$size' } } },
    ]);

    res.json({
      success: true,
      dashboard: {
        totalUsers,
        totalFiles,
        totalFolders,
        recentActivity,
        storageStats: userStats[0] || { totalStorage: 0, avgStorage: 0 },
        fileStats,
      },
    });
  } catch (error) {
    next(error);
  }
});

// @route GET /api/admin/users
router.get('/users', async (req, res, next) => {
  try {
    const { page = 1, limit = 20, search } = req.query;
    const query = {};
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
      ];
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const [users, total] = await Promise.all([
      User.find(query).sort({ createdAt: -1 }).skip(skip).limit(parseInt(limit)),
      User.countDocuments(query),
    ]);

    res.json({ success: true, users, total });
  } catch (error) {
    next(error);
  }
});

// @route POST /api/admin/users
router.post(
  '/users',
  [
    body('name').notEmpty().trim().withMessage('Name required'),
    body('email').isEmail().normalizeEmail().withMessage('Valid email required'),
    body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters'),
    body('role').optional().isIn(['admin', 'user']),
  ],
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ success: false, message: errors.array()[0].msg });
      }

      const { name, email, password, role } = req.body;
      const existing = await User.findOne({ email });
      if (existing) {
        return res.status(400).json({ success: false, message: 'Email already in use.' });
      }

      const user = await User.create({ name, email, password, role: role || 'user' });
      res.status(201).json({ success: true, user });
    } catch (error) {
      next(error);
    }
  }
);

// @route PATCH /api/admin/users/:id
router.patch('/users/:id', async (req, res, next) => {
  try {
    const { name, email, role, isActive, storageLimit } = req.body;
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found.' });

    if (name) user.name = name;
    if (email) user.email = email;
    if (role) user.role = role;
    if (isActive !== undefined) user.isActive = isActive;
    if (storageLimit) user.storageLimit = storageLimit;

    await user.save({ validateBeforeSave: false });
    res.json({ success: true, user });
  } catch (error) {
    next(error);
  }
});

// @route DELETE /api/admin/users/:id
router.delete('/users/:id', async (req, res, next) => {
  try {
    if (req.params.id === req.user._id.toString()) {
      return res.status(400).json({ success: false, message: 'Cannot delete your own account.' });
    }

    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found.' });

    res.json({ success: true, message: 'User deleted.' });
  } catch (error) {
    next(error);
  }
});

// @route GET /api/admin/activity
router.get('/activity', async (req, res, next) => {
  try {
    const { page = 1, limit = 50 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [activity, total] = await Promise.all([
      Activity.find().populate('user', 'name email').sort({ createdAt: -1 }).skip(skip).limit(parseInt(limit)),
      Activity.countDocuments(),
    ]);

    res.json({ success: true, activity, total });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
