const multer = require('multer');
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const cloudinary = require('../config/cloudinary');

const fileFilter = (req, file, cb) => {
  if (!file.mimetype || !file.mimetype.startsWith('image/')) {
    const err = new Error('Only image files are allowed');
    err.status = 400;
    return cb(err);
  }
  cb(null, true);
};

// Cloudinary storage for package images
const packageStorage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: 'travely/packages',
    allowed_formats: ['jpg', 'jpeg', 'png', 'webp', 'avif', 'gif'],
    transformation: [{ width: 1200, height: 800, crop: 'limit', quality: 'auto' }],
  },
});

// Cloudinary storage for banner images
const bannerStorage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: 'travely/banners',
    allowed_formats: ['jpg', 'jpeg', 'png', 'webp', 'avif', 'gif'],
    transformation: [{ width: 1920, height: 600, crop: 'limit', quality: 'auto' }],
  },
});

const uploadPackageImage = multer({
  storage: packageStorage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter,
});

const uploadBannerImage = multer({
  storage: bannerStorage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter,
});

module.exports = {
  uploadPackageImage,
  uploadBannerImage,
};
