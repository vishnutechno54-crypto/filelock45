const mongoose = require('mongoose');

const fileSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'File name is required'],
      trim: true,
    },
    originalName: {
      type: String,
      required: true,
    },
    mimetype: {
      type: String,
      required: true,
    },
    size: {
      type: Number,
      required: true,
    },
    gridfsId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
    },
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    folder: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Folder',
      default: null,
    },
    category: {
      type: String,
      enum: ['image', 'video', 'audio', 'document', 'archive', 'code', 'other'],
      default: 'other',
    },
    description: {
      type: String,
      trim: true,
      maxlength: [500, 'Description cannot exceed 500 characters'],
    },
    tags: [{ type: String, trim: true }],
    isStarred: {
      type: Boolean,
      default: false,
    },
    downloadCount: {
      type: Number,
      default: 0,
    },
    lastAccessed: {
      type: Date,
    },
    checksum: {
      type: String,
    },
  },
  { timestamps: true }
);

fileSchema.index({ owner: 1, folder: 1 });
fileSchema.index({ owner: 1, category: 1 });
fileSchema.index({ owner: 1, isStarred: 1 });
fileSchema.index({ name: 'text', tags: 'text' });

module.exports = mongoose.model('File', fileSchema);
