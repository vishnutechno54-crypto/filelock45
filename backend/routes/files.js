const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const { GridFSBucket } = require('mongodb');
const File = require('../models/File');
const Activity = require('../models/Activity');
const User = require('../models/User');
const { protect } = require('../middleware/auth');
const upload = require('../middleware/upload');

const getFileExtension = (filename = '') => {
  const parts = (filename || '').split('.');
  return parts.length > 1 ? parts[parts.length - 1].toLowerCase() : '';
};

const getCategory = (mimetype = '', filename = '') => {
  const type = (mimetype || '').toLowerCase();
  const extension = getFileExtension(filename);

  if (type.startsWith('image/') || ['png', 'jpg', 'jpeg', 'gif', 'webp', 'bmp', 'svg', 'tif', 'tiff'].includes(extension)) return 'image';
  if (type.startsWith('video/') || ['mp4', 'mov', 'avi', 'mkv', 'webm', 'mpeg', 'mpg'].includes(extension)) return 'video';
  if (type.startsWith('audio/') || ['mp3', 'wav', 'ogg', 'flac', 'aac', 'm4a'].includes(extension)) return 'audio';
  if (type.includes('zip') || type.includes('rar') || type.includes('tar') || type.includes('gzip') || type.includes('7z') || ['zip', 'rar', '7z', 'tar', 'gz', 'bz2', 'xz'].includes(extension)) return 'archive';
  if (
    type.includes('javascript') || type.includes('html') || type.includes('css') || type.includes('json') || type.includes('xml') || type.startsWith('text/') ||
    ['js', 'ts', 'jsx', 'tsx', 'py', 'java', 'c', 'cpp', 'cs', 'php', 'rb', 'go', 'rs', 'sql', 'sh', 'md', 'txt', 'json', 'xml', 'html', 'css', 'yaml', 'yml'].includes(extension)
  ) return 'code';
  if (type.includes('pdf') || type.includes('word') || type.includes('excel') || type.includes('powerpoint') || type.includes('document') || type.includes('sheet') || type.includes('presentation') || ['pdf', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx'].includes(extension)) return 'document';
  return 'other';
};

// @route POST /api/files/upload
router.post('/upload', protect, upload.single('file'), async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No file uploaded.' });
    }

    const { folder, description, tags } = req.body;
    const category = getCategory(req.file.mimetype, req.file.originalname);

    const file = await File.create({
      name: req.file.originalname,
      originalName: req.file.originalname,
      mimetype: req.file.mimetype,
      size: req.file.size,
      gridfsId: req.file.id,
      owner: req.user._id,
      folder: folder || null,
      category,
      description: description || '',
      tags: tags ? tags.split(',').map((t) => t.trim()).filter(Boolean) : [],
    });

    // Update user storage
    await User.findByIdAndUpdate(req.user._id, { $inc: { storageUsed: req.file.size } });

    await Activity.create({
      user: req.user._id,
      action: 'upload',
      target: req.file.originalname,
      targetId: file._id,
      targetType: 'file',
      details: `Uploaded file: ${req.file.originalname} (${(req.file.size / 1024).toFixed(1)} KB)`,
    });

    res.status(201).json({ success: true, file });
  } catch (error) {
    next(error);
  }
});

// @route GET /api/files
router.get('/', protect, async (req, res, next) => {
  try {
    const { folder, category, search, starred, page = 1, limit = 50 } = req.query;
    const query = { owner: req.user._id };

    if (folder === 'root') {
      query.folder = null;
    } else if (folder) {
      query.folder = folder;
    }
    if (category && category !== 'all') query.category = category;
    if (starred === 'true') query.isStarred = true;
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { tags: { $in: [new RegExp(search, 'i')] } },
      ];
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const [files, total] = await Promise.all([
      File.find(query).populate('folder', 'name').sort({ createdAt: -1 }).skip(skip).limit(parseInt(limit)),
      File.countDocuments(query),
    ]);

    res.json({ success: true, files, total, page: parseInt(page), pages: Math.ceil(total / parseInt(limit)) });
  } catch (error) {
    next(error);
  }
});

// @route GET /api/files/:id/download
router.get('/:id/download', protect, async (req, res, next) => {
  try {
    const file = await File.findOne({ _id: req.params.id, owner: req.user._id });
    if (!file) {
      return res.status(404).json({ success: false, message: 'File not found.' });
    }

    if (!mongoose.connection.readyState || mongoose.connection.readyState !== 1) {
      return res.status(503).json({ success: false, message: 'Database is temporarily unavailable. Please try again shortly.' });
    }

    const db = mongoose.connection.db;
    if (!db) {
      return res.status(503).json({ success: false, message: 'File storage is unavailable right now.' });
    }

    const bucket = new GridFSBucket(db, { bucketName: 'filelocker_uploads' });

    file.downloadCount += 1;
    file.lastAccessed = new Date();
    await file.save();

    await Activity.create({
      user: req.user._id,
      action: 'download',
      target: file.name,
      targetId: file._id,
      targetType: 'file',
    });

    res.set('Content-Type', file.mimetype);
    res.set('Content-Disposition', `attachment; filename="${encodeURIComponent(file.originalName)}"`);
    res.set('Content-Length', file.size);

    const downloadStream = bucket.openDownloadStream(file.gridfsId);
    downloadStream.on('error', () => {
      res.status(404).json({ success: false, message: 'File data not found in storage.' });
    });
    downloadStream.pipe(res);
  } catch (error) {
    next(error);
  }
});

// @route GET /api/files/:id/preview
router.get('/:id/preview', protect, async (req, res, next) => {
  try {
    const file = await File.findOne({ _id: req.params.id, owner: req.user._id });
    if (!file) {
      return res.status(404).json({ success: false, message: 'File not found.' });
    }

    if (!mongoose.connection.readyState || mongoose.connection.readyState !== 1) {
      return res.status(503).json({ success: false, message: 'Database is temporarily unavailable. Please try again shortly.' });
    }

    const db = mongoose.connection.db;
    if (!db) {
      return res.status(503).json({ success: false, message: 'File storage is unavailable right now.' });
    }

    const bucket = new GridFSBucket(db, { bucketName: 'filelocker_uploads' });

    res.set('Content-Type', file.mimetype);
    res.set('Content-Disposition', `inline; filename="${encodeURIComponent(file.originalName)}"`);

    const downloadStream = bucket.openDownloadStream(file.gridfsId);
    downloadStream.on('error', () => {
      res.status(404).json({ success: false, message: 'File data not found.' });
    });
    downloadStream.pipe(res);
  } catch (error) {
    next(error);
  }
});

// @route PATCH /api/files/:id/star
router.patch('/:id/star', protect, async (req, res, next) => {
  try {
    const file = await File.findOne({ _id: req.params.id, owner: req.user._id });
    if (!file) return res.status(404).json({ success: false, message: 'File not found.' });

    file.isStarred = !file.isStarred;
    await file.save();

    res.json({ success: true, isStarred: file.isStarred });
  } catch (error) {
    next(error);
  }
});

// @route PATCH /api/files/:id
router.patch('/:id', protect, async (req, res, next) => {
  try {
    const { name, description, tags, folder } = req.body;
    const file = await File.findOne({ _id: req.params.id, owner: req.user._id });
    if (!file) return res.status(404).json({ success: false, message: 'File not found.' });

    if (name) file.name = name;
    if (description !== undefined) file.description = description;
    if (tags !== undefined) file.tags = Array.isArray(tags) ? tags : tags.split(',').map((t) => t.trim()).filter(Boolean);
    if (folder !== undefined) file.folder = folder || null;

    await file.save();
    res.json({ success: true, file });
  } catch (error) {
    next(error);
  }
});

// @route DELETE /api/files/:id
router.delete('/:id', protect, async (req, res, next) => {
  try {
    const file = await File.findOne({ _id: req.params.id, owner: req.user._id });
    if (!file) return res.status(404).json({ success: false, message: 'File not found.' });

    if (!mongoose.connection.readyState || mongoose.connection.readyState !== 1) {
      return res.status(503).json({ success: false, message: 'Database is temporarily unavailable. Please try again shortly.' });
    }

    const db = mongoose.connection.db;
    if (!db) {
      return res.status(503).json({ success: false, message: 'File storage is unavailable right now.' });
    }

    const bucket = new GridFSBucket(db, { bucketName: 'filelocker_uploads' });

    try {
      await bucket.delete(file.gridfsId);
    } catch (e) {
      console.warn('GridFS delete warning:', e.message);
    }

    await User.findByIdAndUpdate(req.user._id, { $inc: { storageUsed: -file.size } });
    await file.deleteOne();

    await Activity.create({
      user: req.user._id,
      action: 'delete',
      target: file.name,
      targetType: 'file',
      details: `Deleted file: ${file.name}`,
    });

    res.json({ success: true, message: 'File deleted successfully.' });
  } catch (error) {
    next(error);
  }
});

// @route GET /api/files/stats/summary
router.get('/stats/summary', protect, async (req, res, next) => {
  try {
    const userId = req.user._id;
    const [total, byCategory, user] = await Promise.all([
      File.countDocuments({ owner: userId }),
      File.aggregate([
        { $match: { owner: userId } },
        { $group: { _id: '$category', count: { $sum: 1 }, size: { $sum: '$size' } } },
      ]),
      User.findById(userId),
    ]);

    res.json({
      success: true,
      stats: {
        totalFiles: total,
        storageUsed: user.storageUsed,
        storageLimit: user.storageLimit,
        byCategory,
      },
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
