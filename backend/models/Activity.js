const mongoose = require('mongoose');

const activitySchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    action: {
      type: String,
      enum: ['upload', 'download', 'delete', 'create_folder', 'delete_folder', 'rename', 'move', 'star', 'login', 'logout'],
      required: true,
    },
    target: {
      type: String,
    },
    targetId: {
      type: mongoose.Schema.Types.ObjectId,
    },
    targetType: {
      type: String,
      enum: ['file', 'folder'],
    },
    ipAddress: {
      type: String,
    },
    details: {
      type: String,
    },
  },
  { timestamps: true }
);

activitySchema.index({ user: 1, createdAt: -1 });

module.exports = mongoose.model('Activity', activitySchema);
