const multer = require('multer');
const mongoose = require('mongoose');
const { GridFSBucket } = require('mongodb');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

// Custom multer storage engine that streams the upload directly into
// GridFS as it arrives, instead of buffering the whole file in memory
// or on disk first. This avoids the abandoned `multer-gridfs-storage`
// package (whose peer dependency conflicts with modern multer versions
// and breaks `npm install`) and keeps memory usage flat even for
// multi-hundred-MB / 1.5GB uploads.
class GridFsStorageEngine {
  _handleFile(req, file, cb) {
    if (!req.user) {
      return cb(new Error('Authentication is required before uploading.'));
    }

    const db = mongoose.connection.db;
    const bucket = new GridFSBucket(db, { bucketName: 'filelocker_uploads' });
    const filename = `${uuidv4()}${path.extname(file.originalname)}`;

    const uploadStream = bucket.openUploadStream(filename, {
      metadata: {
        owner: req.user._id,
        originalName: file.originalname,
      },
    });

    file.stream.pipe(uploadStream);

    file.stream.on('error', (err) => {
      uploadStream.abort().catch(() => {});
      cb(err);
    });

    uploadStream.on('error', (err) => cb(err));

    uploadStream.on('finish', () => {
      cb(null, {
        id: uploadStream.id,
        filename,
        bucketName: 'filelocker_uploads',
        size: uploadStream.length,
      });
    });
  }

  _removeFile(req, file, cb) {
    try {
      const db = mongoose.connection.db;
      const bucket = new GridFSBucket(db, { bucketName: 'filelocker_uploads' });
      bucket.delete(file.id, () => cb(null));
    } catch (err) {
      cb(err);
    }
  }
}

const fileFilter = (req, file, cb) => {
  if (!file || !file.originalname) {
    return cb(new Error('Invalid file upload.'), false);
  }

  // Accept any file type so the app can handle general uploads.
  cb(null, true);
};

const upload = multer({
  storage: new GridFsStorageEngine(),
  limits: { fileSize: 2 * 1024 * 1024 * 1024 }, // 2GB
  fileFilter,
});

module.exports = upload;
