/**
 * One-time migration: clear old local `/uploads/...` image paths from the DB.
 *
 * These packages were created before Cloudinary was set up so they still
 * hold paths like `/uploads/packages/1771586337176-manali.jpg` which no
 * longer resolve. This script sets their imageUrl to '' so the frontend
 * shows a placeholder instead of a 404 loop.
 *
 * Usage:  node scripts/fix-local-image-urls.js
 */

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
const mongoose = require('mongoose');
const Package = require('../models/Package');
const Banner = require('../models/Banner');

async function run() {
  await mongoose.connect(process.env.MONGO_URI);
  console.log('Connected to MongoDB');

  // Fix packages with local upload paths (both /uploads/... and http://localhost.../uploads/...)
  const pkgResult = await Package.updateMany(
    { imageUrl: { $regex: '(/uploads/|localhost.*/uploads/)' } },
    { $set: { imageUrl: '' } }
  );
  console.log(`Packages fixed: ${pkgResult.modifiedCount} (matched ${pkgResult.matchedCount})`);

  // Fix banners with local upload paths
  const bannerResult = await Banner.updateMany(
    { imageUrl: { $regex: '(/uploads/|localhost.*/uploads/)' } },
    { $set: { imageUrl: '' } }
  );
  console.log(`Banners fixed: ${bannerResult.modifiedCount} (matched ${bannerResult.matchedCount})`);

  await mongoose.disconnect();
  console.log('Done — old local image paths have been cleared.');
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
