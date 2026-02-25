const multer = require('multer');
const cloudinary = require('../config/cloudinary');

const fileFilter = (req, file, cb) => {
  if (!file.mimetype || !file.mimetype.startsWith('image/')) {
    const err = new Error('Only image files are allowed');
    err.status = 400;
    return cb(err);
  }
  cb(null, true);
};

// Use memory storage — file buffer is uploaded to Cloudinary in a middleware step
const memoryStorage = multer.memoryStorage();

const uploadPackageImage = multer({
  storage: memoryStorage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter,
});

const uploadBannerImage = multer({
  storage: memoryStorage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter,
});

/**
 * Middleware that uploads the multer file buffer to Cloudinary.
 * After this runs, req.file.path is set to the Cloudinary secure URL.
 */
function cloudinaryUpload(folder, transformation) {
  return (req, res, next) => {
    if (!req.file) return next();

    const stream = cloudinary.uploader.upload_stream(
      {
        folder,
        transformation,
        resource_type: 'image',
      },
      (error, result) => {
        if (error) return next(error);
        // Make req.file.path the Cloudinary URL (same interface as multer-storage-cloudinary)
        req.file.path = result.secure_url;
        req.file.filename = result.public_id;
        next();
      }
    );

    stream.end(req.file.buffer);
  };
}

const uploadPackageToCloudinary = cloudinaryUpload('travely/packages', [
  { width: 1200, height: 800, crop: 'limit', quality: 'auto' },
]);

const uploadBannerToCloudinary = cloudinaryUpload('travely/banners', [
  { width: 1920, height: 600, crop: 'limit', quality: 'auto' },
]);

module.exports = {
  uploadPackageImage,
  uploadBannerImage,
  uploadPackageToCloudinary,
  uploadBannerToCloudinary,
};
