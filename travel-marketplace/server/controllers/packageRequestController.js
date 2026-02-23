const PackageRequest = require('../models/PackageRequest');
const Notification = require('../models/Notification');
const User = require('../models/User');

// ───── User endpoints ─────

// Create a custom package request
exports.createRequest = async (req, res) => {
  try {
    const {
      destination,
      exploringDestinations,
      departureCity,
      dateType,
      departureDate,
      returnDate,
      travelers,
      budgetPerPerson,
      category,
      themes,
      specialRequirements,
    } = req.body;

    const request = await PackageRequest.create({
      userId: req.user.id,
      destination: destination || '',
      exploringDestinations: !!exploringDestinations,
      departureCity: departureCity || '',
      dateType: dateType || 'anytime',
      departureDate: departureDate || null,
      returnDate: returnDate || null,
      travelers: Number(travelers) || 1,
      budgetPerPerson: Number(budgetPerPerson) || 0,
      category: category || '',
      themes: themes || [],
      specialRequirements: specialRequirements || '',
    });

    // Notify all agencies about the new request
    const agencies = await User.find({ role: 'AGENCY' }).select('_id').lean();
    const notifications = agencies.map((agency) => ({
      recipientId: agency._id,
      recipientRole: 'AGENCY',
      type: 'PACKAGE_REQUEST',
      title: 'New Custom Package Request',
      message: `A traveler is looking for ${destination || 'a destination'}${departureCity ? ' from ' + departureCity : ''}. Check it out and send a quote!`,
      referenceId: request._id,
      referenceModel: 'PackageRequest',
    }));
    if (notifications.length > 0) await Notification.insertMany(notifications);

    res.status(201).json({ request, message: 'Your request has been submitted! Agencies will review it shortly.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

// List user's own requests
exports.getMyRequests = async (req, res) => {
  try {
    const requests = await PackageRequest.find({ userId: req.user.id })
      .sort('-createdAt')
      .populate('agencyResponses.agencyId', 'businessName email')
      .populate('agencyResponses.suggestedPackageId', 'title destination price imageUrl')
      .lean();
    res.json({ requests });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

// Cancel a request (user)
exports.cancelRequest = async (req, res) => {
  try {
    const request = await PackageRequest.findOne({ _id: req.params.id, userId: req.user.id });
    if (!request) return res.status(404).json({ message: 'Request not found' });
    if (['CANCELLED', 'ACCEPTED'].includes(request.status)) {
      return res.status(400).json({ message: 'Cannot cancel this request' });
    }
    request.status = 'CANCELLED';
    await request.save();
    res.json({ message: 'Request cancelled' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

// ───── Agency endpoints ─────

// List all pending/active requests (agencies can browse)
exports.listRequests = async (req, res) => {
  try {
    const filter = { status: { $in: ['PENDING', 'REVIEWED', 'QUOTED'] } };
    const requests = await PackageRequest.find(filter)
      .sort('-createdAt')
      .populate('userId', 'name email')
      .populate('agencyResponses.agencyId', 'businessName')
      .lean();
    res.json({ requests });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

// Agency responds to a request (send quote / suggestion)
exports.respondToRequest = async (req, res) => {
  try {
    const { message, suggestedPackageId, quotedPrice } = req.body;
    const request = await PackageRequest.findById(req.params.id);
    if (!request) return res.status(404).json({ message: 'Request not found' });

    if (['CANCELLED', 'ACCEPTED', 'EXPIRED'].includes(request.status)) {
      return res.status(400).json({ message: 'Cannot respond to this request' });
    }

    // Check if this agency already responded
    const alreadyResponded = request.agencyResponses.some(
      (r) => r.agencyId.toString() === req.user.id
    );
    if (alreadyResponded) {
      return res.status(400).json({ message: 'You have already responded to this request' });
    }

    request.agencyResponses.push({
      agencyId: req.user.id,
      message: message || '',
      suggestedPackageId: suggestedPackageId || null,
      quotedPrice: quotedPrice ? Number(quotedPrice) : null,
    });

    if (request.status === 'PENDING') request.status = 'QUOTED';
    await request.save();

    // Notify the user
    const agencyName = req.user.businessName || req.user.name || 'An agency';
    await Notification.create({
      recipientId: request.userId,
      recipientRole: 'USER',
      type: 'PACKAGE_REQUEST_RESPONSE',
      title: 'New Quote for Your Trip Request!',
      message: `${agencyName} has sent you a quote${quotedPrice ? ' of ₹' + Number(quotedPrice).toLocaleString() : ''}. Check your requests to view details.`,
      referenceId: request._id,
      referenceModel: 'PackageRequest',
    });

    res.json({ message: 'Response submitted successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};
