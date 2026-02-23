const Banner = require('../models/Banner');

// Public: get active banners
exports.getActiveBanners = async (req, res) => {
  try {
    const banners = await Banner.find({ isActive: true })
      .sort('position createdAt')
      .lean();
    res.json({ banners });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

// Admin: list all banners
exports.listBanners = async (req, res) => {
  try {
    const banners = await Banner.find().sort('position -createdAt').lean();
    res.json({ banners });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

// Admin: create banner
exports.createBanner = async (req, res) => {
  try {
    const { title, subtitle, linkUrl, position, isActive, style, gradient } = req.body;

    if (!title) return res.status(400).json({ message: 'title is required' });
    if (!req.file) return res.status(400).json({ message: 'Image is required' });

    const imageUrl = `/uploads/banners/${req.file.filename}`;

    const banner = await Banner.create({
      title,
      subtitle: subtitle || '',
      imageUrl,
      linkUrl: linkUrl || '',
      position: position != null ? Number(position) : 0,
      isActive: isActive !== 'false',
      style: style || 'full-width',
      gradient: gradient || '',
    });

    res.status(201).json({ banner });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

// Admin: update banner
exports.updateBanner = async (req, res) => {
  try {
    const banner = await Banner.findById(req.params.id);
    if (!banner) return res.status(404).json({ message: 'Banner not found' });

    const { title, subtitle, linkUrl, position, isActive, style, gradient } = req.body;
    if (title !== undefined) banner.title = title;
    if (subtitle !== undefined) banner.subtitle = subtitle;
    if (linkUrl !== undefined) banner.linkUrl = linkUrl;
    if (position != null) banner.position = Number(position);
    if (isActive !== undefined) banner.isActive = isActive === true || isActive === 'true';
    if (style) banner.style = style;
    if (gradient !== undefined) banner.gradient = gradient;
    if (req.file) banner.imageUrl = `/uploads/banners/${req.file.filename}`;

    await banner.save();
    res.json({ banner });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

// Admin: delete banner
exports.deleteBanner = async (req, res) => {
  try {
    const banner = await Banner.findByIdAndDelete(req.params.id);
    if (!banner) return res.status(404).json({ message: 'Banner not found' });
    res.json({ message: 'Banner deleted' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

// Admin: toggle active
exports.toggleBanner = async (req, res) => {
  try {
    const banner = await Banner.findById(req.params.id);
    if (!banner) return res.status(404).json({ message: 'Banner not found' });
    banner.isActive = !banner.isActive;
    await banner.save();
    res.json({ banner });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};
