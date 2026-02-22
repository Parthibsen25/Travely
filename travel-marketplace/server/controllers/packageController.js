const Package = require('../models/Package');
const Offer = require('../models/Offer');
const mongoose = require('mongoose');
const { computeFinalPrice } = require('../services/pricingService');

exports.listPackages = async (req, res) => {
  try {
    const { destination, category, q } = req.query;
    const filter = { status: 'ACTIVE' };

    if (destination) {
      filter.destination = { $regex: destination, $options: 'i' };
    }
    if (category) {
      filter.category = category;
    }
    if (q) {
      filter.$or = [
        { title: { $regex: q, $options: 'i' } },
        { description: { $regex: q, $options: 'i' } },
        { destination: { $regex: q, $options: 'i' } },
        { category: { $regex: q, $options: 'i' } }
      ];
    }

    const packages = await Package.find(filter)
      .sort('-createdAt')
      .populate('agencyId', 'businessName verificationStatus')
      .select('title description destination category price duration agencyId status imageUrl rating reviewCount createdAt')
      .lean();

    res.json({ packages });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.createPackage = async (req, res) => {
  try {
    const agencyId = req.user.id;
    const payload = { ...req.body, agencyId };
    const pkg = await Package.create(payload);
    res.status(201).json({ package: pkg });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.uploadPackageImage = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'Image file is required' });
    }

    const imagePath = `/uploads/packages/${req.file.filename}`;
    const imageUrl = `${req.protocol}://${req.get('host')}${imagePath}`;

    res.status(201).json({ imageUrl, imagePath });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.getMyPackages = async (req, res) => {
  try {
    const agencyId = req.user.id;
    const packages = await Package.find({ agencyId }).sort('-createdAt');
    res.json({ packages });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.updatePackage = async (req, res) => {
  try {
    const agencyId = req.user.id;
    const pkg = await Package.findById(req.params.id);
    if (!pkg) return res.status(404).json({ message: 'Package not found' });
    if (pkg.agencyId.toString() !== agencyId) return res.status(403).json({ message: 'Forbidden' });
    Object.assign(pkg, req.body);
    await pkg.save();
    res.json({ package: pkg });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.deletePackage = async (req, res) => {
  try {
    const agencyId = req.user.id;
    const pkg = await Package.findById(req.params.id);
    if (!pkg) return res.status(404).json({ message: 'Package not found' });
    if (pkg.agencyId.toString() !== agencyId) return res.status(403).json({ message: 'Forbidden' });
    await pkg.deleteOne();
    res.json({ message: 'Deleted' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.getPackageById = async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ message: 'Invalid package id' });
    }
    const pkg = await Package.findById(req.params.id).lean();
    if (!pkg) return res.status(404).json({ message: 'Package not found' });

    // collect available offers: embedded package offers + global offers that match
    const embeddedOffers = (pkg.offers || []).map((o) => ({
      title: o.title,
      discountType: 'PERCENTAGE',
      value: Number(o.discountPercent || 0),
      packageId: pkg._id,
      destination: pkg.destination
    }));

    // find global offers that either target this package, match destination, or are general
    const globalOffers = await Offer.find({
      $or: [
        { packageId: pkg._id },
        { destination: pkg.destination },
        { $and: [{ packageId: { $exists: false } }, { destination: { $exists: false } }] },
        { packageId: null, destination: null }
      ]
    }).lean();

    const availableOffers = [...embeddedOffers, ...globalOffers];

    // determine travelDate from query string (optional)
    const travelDate = req.query.travelDate || null;

    const pricing = await computeFinalPrice({ basePrice: pkg.price, travelDate, availableOffers });

    res.json({ package: pkg, pricing, offers: availableOffers });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};
