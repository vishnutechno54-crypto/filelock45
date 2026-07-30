const express = require('express');
const router = express.Router();
const Folder = require('../models/Folder');
const File = require('../models/File');
const Activity = require('../models/Activity');
const { protect } = require('../middleware/auth');

// @route GET /api/folders
router.get('/', protect, async (req, res, next) => {
  try {
    const { parent } = req.query;
    const query = { owner: req.user._id };

    if (parent === 'root') {
      query.parent = null;
    } else if (parent) {
      query.parent = parent;
    }

    const folders = await Folder.find(query).populate('parent', 'name').sort({ name: 1 });
    res.json({ success: true, folders });
  } catch (error) {
    next(error);
  }
});

// @route POST /api/folders
router.post('/', protect, async (req, res, next) => {
  try {
    const { name, description, parent, color, icon, category, tags } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ success: false, message: 'Folder name is required.' });
    }

    const existing = await Folder.findOne({
      owner: req.user._id,
      name: name.trim(),
      parent: parent || null,
    });

    if (existing) {
      return res.status(400).json({ success: false, message: 'A folder with this name already exists here.' });
    }

    const folder = await Folder.create({
      name: name.trim(),
      description,
      owner: req.user._id,
      parent: parent || null,
      color: color || '#6366f1',
      icon: icon || 'folder',
      category: category || 'general',
      tags: tags || [],
    });

    await Activity.create({
      user: req.user._id,
      action: 'create_folder',
      target: name,
      targetId: folder._id,
      targetType: 'folder',
    });

    res.status(201).json({ success: true, folder });
  } catch (error) {
    next(error);
  }
});

// @route GET /api/folders/:id
router.get('/:id', protect, async (req, res, next) => {
  try {
    const folder = await Folder.findOne({ _id: req.params.id, owner: req.user._id }).populate('parent', 'name');
    if (!folder) return res.status(404).json({ success: false, message: 'Folder not found.' });
    res.json({ success: true, folder });
  } catch (error) {
    next(error);
  }
});

// @route PATCH /api/folders/:id
router.patch('/:id', protect, async (req, res, next) => {
  try {
    const { name, description, color, icon, tags } = req.body;
    const folder = await Folder.findOne({ _id: req.params.id, owner: req.user._id });
    if (!folder) return res.status(404).json({ success: false, message: 'Folder not found.' });

    if (name) folder.name = name.trim();
    if (description !== undefined) folder.description = description;
    if (color) folder.color = color;
    if (icon) folder.icon = icon;
    if (tags !== undefined) folder.tags = tags;

    await folder.save();

    await Activity.create({
      user: req.user._id,
      action: 'rename',
      target: folder.name,
      targetId: folder._id,
      targetType: 'folder',
    });

    res.json({ success: true, folder });
  } catch (error) {
    next(error);
  }
});

// @route DELETE /api/folders/:id
router.delete('/:id', protect, async (req, res, next) => {
  try {
    const folder = await Folder.findOne({ _id: req.params.id, owner: req.user._id });
    if (!folder) return res.status(404).json({ success: false, message: 'Folder not found.' });

    // Check if folder has files
    const fileCount = await File.countDocuments({ folder: folder._id, owner: req.user._id });
    const subFolderCount = await Folder.countDocuments({ parent: folder._id, owner: req.user._id });

    if (fileCount > 0 || subFolderCount > 0) {
      return res.status(400).json({
        success: false,
        message: `Cannot delete folder. It contains ${fileCount} file(s) and ${subFolderCount} subfolder(s). Move or delete them first.`,
      });
    }

    await folder.deleteOne();

    await Activity.create({
      user: req.user._id,
      action: 'delete_folder',
      target: folder.name,
      targetType: 'folder',
    });

    res.json({ success: true, message: 'Folder deleted successfully.' });
  } catch (error) {
    next(error);
  }
});

// @route GET /api/folders/:id/breadcrumb
router.get('/:id/breadcrumb', protect, async (req, res, next) => {
  try {
    const breadcrumb = [];
    let currentId = req.params.id;

    while (currentId) {
      const folder = await Folder.findOne({ _id: currentId, owner: req.user._id });
      if (!folder) break;
      breadcrumb.unshift({ _id: folder._id, name: folder.name });
      currentId = folder.parent;
    }

    res.json({ success: true, breadcrumb });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
