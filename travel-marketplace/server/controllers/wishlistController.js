const Wishlist = require('../models/Wishlist');
const mongoose = require('mongoose');

exports.addToWishlist = async (req, res) => {
  try {
    const userId = req.user.id;
    const { packageId } = req.body;

    if (!mongoose.Types.ObjectId.isValid(packageId)) {
      return res.status(400).json({ message: 'Invalid package id' });
    }

    const existing = await Wishlist.findOne({ userId, packageId });
    if (existing) {
      return res.status(409).json({ message: 'Already in wishlist' });
    }

    const wishlist = await Wishlist.create({ userId, packageId });
    res.status(201).json({ wishlist });
  } catch (err) {
    if (err.code === 11000) {
      return res.status(409).json({ message: 'Already in wishlist' });
    }
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.removeFromWishlist = async (req, res) => {
  try {
    const userId = req.user.id;
    const packageId = req.params.packageId;

    if (!mongoose.Types.ObjectId.isValid(packageId)) {
      return res.status(400).json({ message: 'Invalid package id' });
    }

    await Wishlist.findOneAndDelete({ userId, packageId });
    res.json({ message: 'Removed from wishlist' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.getMyWishlist = async (req, res) => {
  try {
    const userId = req.user.id;
    const wishlist = await Wishlist.find({ userId })
      .populate('packageId')
      .sort('-createdAt')
      .lean();

    res.json({ wishlist: wishlist.map((w) => w.packageId).filter(Boolean) });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.checkWishlist = async (req, res) => {
  try {
    const userId = req.user.id;
    const packageIds = Array.isArray(req.query.packageIds) 
      ? req.query.packageIds 
      : req.query.packageIds?.split(',') || [];

    if (packageIds.length === 0) {
      return res.json({ wishlist: [] });
    }

    const wishlist = await Wishlist.find({
      userId,
      packageId: { $in: packageIds.map(id => new mongoose.Types.ObjectId(id)) }
    }).lean();

    res.json({ wishlist: wishlist.map((w) => String(w.packageId)) });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};
