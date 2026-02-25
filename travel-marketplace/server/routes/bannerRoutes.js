const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const { authorizeRoles } = require('../middleware/roleMiddleware');
const { uploadBannerImage, uploadBannerToCloudinary } = require('../middleware/uploadMiddleware');
const banner = require('../controllers/bannerController');

// Public: active banners
router.get('/active', banner.getActiveBanners);

// Admin: CRUD
router.get('/', protect, authorizeRoles('ADMIN'), banner.listBanners);
router.post('/', protect, authorizeRoles('ADMIN'), uploadBannerImage.single('image'), uploadBannerToCloudinary, banner.createBanner);
router.put('/:id', protect, authorizeRoles('ADMIN'), uploadBannerImage.single('image'), uploadBannerToCloudinary, banner.updateBanner);
router.post('/:id/toggle', protect, authorizeRoles('ADMIN'), banner.toggleBanner);
router.delete('/:id', protect, authorizeRoles('ADMIN'), banner.deleteBanner);

module.exports = router;
