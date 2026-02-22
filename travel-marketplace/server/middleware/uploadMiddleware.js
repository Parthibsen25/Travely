const fs = require('fs');
const path = require('path');
const multer = require('multer');

const packageUploadDir = path.join(__dirname, '..', 'uploads', 'packages');
fs.mkdirSync(packageUploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, packageUploadDir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname || '').toLowerCase();
    const baseName = path
      .basename(file.originalname || 'image', ext)
      .replace(/[^a-zA-Z0-9_-]/g, '-')
      .slice(0, 48);
    const safeName = baseName || 'image';
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    cb(null, `${uniqueSuffix}-${safeName}${ext}`);
  }
});

const fileFilter = (req, file, cb) => {
  if (!file.mimetype || !file.mimetype.startsWith('image/')) {
    const err = new Error('Only image files are allowed');
    err.status = 400;
    return cb(err);
  }
  cb(null, true);
};

const uploadPackageImage = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024
  },
  fileFilter
});

module.exports = {
  uploadPackageImage
};
