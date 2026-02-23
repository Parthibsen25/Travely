const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const { authorizeRoles } = require('../middleware/roleMiddleware');
const { uploadPackageImage: packageImageUpload } = require('../middleware/uploadMiddleware');
const {
  createPackage,
  uploadPackageImage,
  getMyPackages,
  updatePackage,
  deletePackage,
  getPackageById,
  listPackages,
  getPackagesByDuration,
  getPackagesBySeason,
  getPackagesByTheme
} = require('../controllers/packageController');

// Public routes
router.get('/', listPackages);
router.get('/by-duration', getPackagesByDuration);
router.get('/by-season', getPackagesBySeason);
router.get('/by-theme', getPackagesByTheme);

// Agency-only routes
router.get('/my', protect, authorizeRoles('AGENCY'), getMyPackages);
router.post('/upload-image', protect, authorizeRoles('AGENCY'), packageImageUpload.single('image'), uploadPackageImage);
router.post('/', protect, authorizeRoles('AGENCY'), createPackage);
router.put('/:id', protect, authorizeRoles('AGENCY'), updatePackage);
router.delete('/:id', protect, authorizeRoles('AGENCY'), deletePackage);

// Keep this last so it does not shadow /my.
router.get('/:id', getPackageById);

module.exports = router;
