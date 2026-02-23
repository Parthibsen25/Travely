const Cart = require('../models/Cart');
const mongoose = require('mongoose');

// GET /api/cart — fetch current user's cart with populated package data
exports.getCart = async (req, res) => {
  try {
    const userId = req.user.id;
    let cart = await Cart.findOne({ userId })
      .populate({
        path: 'items.packageId',
        select: 'title destination price duration nightCount imageUrl category hotelStarRating inclusions offers rating reviewCount agencyId cities',
        populate: { path: 'agencyId', select: 'businessName verificationStatus' },
      })
      .lean();

    if (!cart) {
      return res.json({ items: [] });
    }

    // Filter out items whose package was deleted
    const items = cart.items
      .filter((i) => i.packageId)
      .map((i) => ({ ...i.packageId, addedAt: i.addedAt }));

    res.json({ items });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

// POST /api/cart — add a package to the cart
exports.addToCart = async (req, res) => {
  try {
    const userId = req.user.id;
    const { packageId } = req.body;

    if (!packageId || !mongoose.Types.ObjectId.isValid(packageId)) {
      return res.status(400).json({ message: 'Invalid package id' });
    }

    let cart = await Cart.findOne({ userId });

    if (!cart) {
      cart = await Cart.create({ userId, items: [{ packageId }] });
    } else {
      const exists = cart.items.some(
        (i) => i.packageId.toString() === packageId
      );
      if (exists) {
        return res.status(409).json({ message: 'Already in cart' });
      }
      cart.items.push({ packageId });
      await cart.save();
    }

    res.status(201).json({ message: 'Added to cart', count: cart.items.length });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

// DELETE /api/cart/:packageId — remove a package from the cart
exports.removeFromCart = async (req, res) => {
  try {
    const userId = req.user.id;
    const { packageId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(packageId)) {
      return res.status(400).json({ message: 'Invalid package id' });
    }

    const cart = await Cart.findOne({ userId });
    if (!cart) return res.json({ message: 'Cart is empty' });

    cart.items = cart.items.filter((i) => i.packageId.toString() !== packageId);
    await cart.save();

    res.json({ message: 'Removed from cart', count: cart.items.length });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

// DELETE /api/cart — clear the entire cart
exports.clearCart = async (req, res) => {
  try {
    const userId = req.user.id;
    await Cart.findOneAndUpdate({ userId }, { items: [] });
    res.json({ message: 'Cart cleared' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

// GET /api/cart/count — just the count (for navbar badge)
exports.getCartCount = async (req, res) => {
  try {
    const userId = req.user.id;
    const cart = await Cart.findOne({ userId }).lean();
    res.json({ count: cart ? cart.items.length : 0 });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};
