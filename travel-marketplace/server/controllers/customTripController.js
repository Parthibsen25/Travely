const CustomTrip = require('../models/CustomTrip');

// GET /api/custom-trips/my – list user's custom trips
exports.getMyTrips = async (req, res) => {
  try {
    const trips = await CustomTrip.find({ userId: req.user.id }).sort({ updatedAt: -1 });
    res.json({ trips });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

// GET /api/custom-trips/:id – single trip detail
exports.getTrip = async (req, res) => {
  try {
    const trip = await CustomTrip.findOne({ _id: req.params.id, userId: req.user.id });
    if (!trip) return res.status(404).json({ message: 'Trip not found' });
    res.json({ trip });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

// POST /api/custom-trips – create a new custom trip
exports.createTrip = async (req, res) => {
  try {
    const { title, destinations, startDate, endDate, travelers, budgetItems, notes } = req.body;

    if (!title || !title.trim()) {
      return res.status(400).json({ message: 'Trip title is required' });
    }

    const trip = await CustomTrip.create({
      userId: req.user.id,
      title: title.trim(),
      destinations: destinations || [],
      startDate: startDate || null,
      endDate: endDate || null,
      travelers: travelers || 1,
      budgetItems: budgetItems || [],
      notes: notes || ''
    });

    res.status(201).json({ trip });
  } catch (err) {
    console.error(err);
    if (err.name === 'ValidationError') {
      return res.status(400).json({ message: err.message });
    }
    res.status(500).json({ message: 'Server error' });
  }
};

// PUT /api/custom-trips/:id – update a custom trip
exports.updateTrip = async (req, res) => {
  try {
    const trip = await CustomTrip.findOne({ _id: req.params.id, userId: req.user.id });
    if (!trip) return res.status(404).json({ message: 'Trip not found' });

    const { title, destinations, startDate, endDate, travelers, budgetItems, notes, status } = req.body;

    if (title !== undefined) trip.title = title.trim();
    if (destinations !== undefined) trip.destinations = destinations;
    if (startDate !== undefined) trip.startDate = startDate;
    if (endDate !== undefined) trip.endDate = endDate;
    if (travelers !== undefined) trip.travelers = travelers;
    if (budgetItems !== undefined) trip.budgetItems = budgetItems;
    if (notes !== undefined) trip.notes = notes;
    if (status !== undefined) trip.status = status;

    await trip.save();
    res.json({ trip });
  } catch (err) {
    console.error(err);
    if (err.name === 'ValidationError') {
      return res.status(400).json({ message: err.message });
    }
    res.status(500).json({ message: 'Server error' });
  }
};

// DELETE /api/custom-trips/:id – delete a custom trip
exports.deleteTrip = async (req, res) => {
  try {
    const trip = await CustomTrip.findOneAndDelete({ _id: req.params.id, userId: req.user.id });
    if (!trip) return res.status(404).json({ message: 'Trip not found' });
    res.json({ message: 'Trip deleted' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};
