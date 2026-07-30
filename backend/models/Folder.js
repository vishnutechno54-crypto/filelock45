const mongoose = require('mongoose');

const folderSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Folder name is required'],
      trim: true,
      maxlength: [100, 'Folder name cannot exceed 100 characters'],
    },
    description: {
      type: String,
      trim: true,
      maxlength: [500, 'Description cannot exceed 500 characters'],
    },
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    parent: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Folder',
      default: null,
    },
    color: {
      type: String,
      default: '#6366f1',
    },
    icon: {
      type: String,
      default: 'folder',
    },
    category: {
      type: String,
      enum: ['general', 'images', 'videos', 'documents', 'audio', 'projects', 'websites', 'archives', 'other'],
      default: 'general',
    },
    isShared: {
      type: Boolean,
      default: false,
    },
    path: {
      type: String,
      default: '/',
    },
    tags: [{ type: String, trim: true }],
  },
  { timestamps: true }
);

folderSchema.index({ owner: 1, parent: 1 });
folderSchema.index({ owner: 1, name: 1 });

module.exports = mongoose.model('Folder', folderSchema);
