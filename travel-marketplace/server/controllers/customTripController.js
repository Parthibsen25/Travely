const CustomTrip = require('../models/CustomTrip');

/* ─── Budget Templates ────────────────────────────────────────────────── */
const BUDGET_TEMPLATES = [
  {
    id: 'weekend-getaway',
    title: 'Weekend Getaway',
    icon: '🏕️',
    description: '2-day quick escape',
    travelers: 2,
    budgetItems: [
      { category: 'Transport', description: 'Fuel / Bus fare', amount: 3000 },
      { category: 'Accommodation', description: 'Hotel (1 night)', amount: 4000 },
      { category: 'Food', description: 'Meals for 2 days', amount: 3000 },
      { category: 'Activities', description: 'Sightseeing / Entry fees', amount: 2000 },
      { category: 'Other', description: 'Miscellaneous', amount: 1000 }
    ]
  },
  {
    id: 'beach-vacation',
    title: 'Beach Vacation (Goa)',
    icon: '🏖️',
    description: '5-day beach trip',
    travelers: 2,
    budgetItems: [
      { category: 'Transport', description: 'Flights round-trip', amount: 8000 },
      { category: 'Accommodation', description: 'Hotel / Resort (4 nights)', amount: 16000 },
      { category: 'Food', description: 'Meals & drinks (5 days)', amount: 10000 },
      { category: 'Activities', description: 'Water sports / excursions', amount: 6000 },
      { category: 'Transport', description: 'Bike / car rental', amount: 3000 },
      { category: 'Shopping', description: 'Souvenirs', amount: 3000 },
      { category: 'Other', description: 'Miscellaneous', amount: 2000 }
    ]
  },
  {
    id: 'mountain-trek',
    title: 'Mountain Trek',
    icon: '🏔️',
    description: '4-day adventure trek',
    travelers: 1,
    budgetItems: [
      { category: 'Transport', description: 'Bus / train to base', amount: 4000 },
      { category: 'Accommodation', description: 'Camps / guesthouses (3 nights)', amount: 6000 },
      { category: 'Food', description: 'Meals (4 days)', amount: 4000 },
      { category: 'Activities', description: 'Guide + permit fees', amount: 5000 },
      { category: 'Insurance', description: 'Travel insurance', amount: 1500 },
      { category: 'Other', description: 'Gear rental / misc', amount: 3000 }
    ]
  },
  {
    id: 'cultural-tour',
    title: 'Cultural Heritage Tour',
    icon: '🏛️',
    description: '6-day heritage exploration',
    travelers: 2,
    budgetItems: [
      { category: 'Transport', description: 'Train / flights', amount: 10000 },
      { category: 'Accommodation', description: 'Heritage hotel (5 nights)', amount: 20000 },
      { category: 'Food', description: 'Meals (6 days)', amount: 9000 },
      { category: 'Activities', description: 'Museum / monument tickets', amount: 5000 },
      { category: 'Activities', description: 'Local guide', amount: 4000 },
      { category: 'Shopping', description: 'Handicrafts', amount: 5000 },
      { category: 'Other', description: 'Miscellaneous', amount: 2000 }
    ]
  },
  {
    id: 'international-budget',
    title: 'International Budget Trip',
    icon: '✈️',
    description: '7-day international trip',
    travelers: 1,
    budgetItems: [
      { category: 'Transport', description: 'International flights', amount: 25000 },
      { category: 'Visa', description: 'Visa fees', amount: 5000 },
      { category: 'Insurance', description: 'Travel insurance', amount: 3000 },
      { category: 'Accommodation', description: 'Hostels (6 nights)', amount: 12000 },
      { category: 'Food', description: 'Meals (7 days)', amount: 14000 },
      { category: 'Transport', description: 'Local transport', amount: 6000 },
      { category: 'Activities', description: 'Tours / attractions', amount: 10000 },
      { category: 'Shopping', description: 'Souvenirs', amount: 5000 }
    ]
  },
  {
    id: 'romantic-honeymoon',
    title: 'Romantic Honeymoon',
    icon: '💕',
    description: '5-day couples getaway',
    travelers: 2,
    budgetItems: [
      { category: 'Transport', description: 'Flights / train', amount: 12000 },
      { category: 'Accommodation', description: 'Luxury resort (4 nights)', amount: 32000 },
      { category: 'Food', description: 'Fine dining & room service', amount: 15000 },
      { category: 'Activities', description: 'Spa / couples activities', amount: 8000 },
      { category: 'Activities', description: 'Sunset cruise / tour', amount: 5000 },
      { category: 'Shopping', description: 'Gifts & keepsakes', amount: 5000 },
      { category: 'Other', description: 'Photography / surprises', amount: 3000 }
    ]
  }
];

// GET /api/custom-trips/templates
exports.getTemplates = (req, res) => {
  res.json({ templates: BUDGET_TEMPLATES });
};

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
    const { title, destinations, startDate, endDate, travelers, travelerNames, budgetItems, notes } = req.body;

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
      travelerNames: travelerNames || [],
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
    if (req.body.travelerNames !== undefined) trip.travelerNames = req.body.travelerNames;
    if (budgetItems !== undefined) trip.budgetItems = budgetItems;
    if (notes !== undefined) trip.notes = notes;
    if (status !== undefined) trip.status = status;

    // New fields
    const { budgetLimit, currency, tags, checklist } = req.body;
    if (budgetLimit !== undefined) trip.budgetLimit = budgetLimit;
    if (currency !== undefined) trip.currency = currency;
    if (tags !== undefined) trip.tags = tags;
    if (checklist !== undefined) trip.checklist = checklist;

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

/* ─── Daily Expenses ──────────────────────────────────────────────────── */

// POST /api/custom-trips/:id/expenses — add a daily expense
exports.addExpense = async (req, res) => {
  try {
    const trip = await CustomTrip.findOne({ _id: req.params.id, userId: req.user.id });
    if (!trip) return res.status(404).json({ message: 'Trip not found' });

    const { date, category, description, amount, paymentMethod, paidBy } = req.body;
    if (!category || !description || !amount || amount <= 0) {
      return res.status(400).json({ message: 'Category, description and valid amount are required' });
    }

    trip.dailyExpenses.push({
      date: date || new Date(),
      category,
      description: description.trim(),
      amount: Number(amount),
      paymentMethod: paymentMethod || 'cash',
      paidBy: paidBy || ''
    });

    await trip.save();
    res.status(201).json({ trip });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

// DELETE /api/custom-trips/:id/expenses/:expenseId — remove a daily expense
exports.removeExpense = async (req, res) => {
  try {
    const trip = await CustomTrip.findOne({ _id: req.params.id, userId: req.user.id });
    if (!trip) return res.status(404).json({ message: 'Trip not found' });

    trip.dailyExpenses = trip.dailyExpenses.filter(
      (e) => e._id.toString() !== req.params.expenseId
    );

    await trip.save();
    res.json({ trip });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

/* ─── Duplicate Trip ──────────────────────────────────────────────────── */

// POST /api/custom-trips/:id/duplicate — clone a trip
exports.duplicateTrip = async (req, res) => {
  try {
    const original = await CustomTrip.findOne({ _id: req.params.id, userId: req.user.id });
    if (!original) return res.status(404).json({ message: 'Trip not found' });

    const newTrip = await CustomTrip.create({
      userId: req.user.id,
      title: `${original.title} (Copy)`,
      destinations: [...original.destinations],
      travelers: original.travelers,
      travelerNames: [...(original.travelerNames || [])],
      budgetItems: original.budgetItems.map((b) => ({
        category: b.category,
        description: b.description,
        amount: b.amount,
        actualAmount: 0,
        isPaid: false
      })),
      budgetLimit: original.budgetLimit,
      currency: original.currency,
      tags: [...original.tags],
      checklist: original.checklist.map((c) => ({ text: c.text, checked: false })),
      notes: original.notes,
      status: 'PLANNING'
    });

    res.status(201).json({ trip: newTrip });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

/* ─── Budget Summary (for share) ──────────────────────────────────────── */

// GET /api/custom-trips/:id/summary – get shareable text summary
exports.getTripSummary = async (req, res) => {
  try {
    const trip = await CustomTrip.findOne({ _id: req.params.id, userId: req.user.id });
    if (!trip) return res.status(404).json({ message: 'Trip not found' });

    const fmt = (n) =>
      new Intl.NumberFormat('en-IN', { style: 'currency', currency: trip.currency || 'INR', maximumFractionDigits: 0 }).format(n);

    let text = `✈️ ${trip.title}\n`;
    if (trip.destinations.length) text += `📍 ${trip.destinations.join(' → ')}\n`;
    if (trip.startDate) {
      const sd = new Date(trip.startDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
      const ed = trip.endDate ? new Date(trip.endDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '';
      text += `📅 ${sd}${ed ? ` – ${ed}` : ''}\n`;
    }
    text += `👥 ${trip.travelers} traveler${trip.travelers > 1 ? 's' : ''}\n\n`;

    if (trip.budgetItems.length) {
      text += `💰 Budget Breakdown:\n`;
      trip.budgetItems.forEach((b) => {
        text += `  • ${b.category}: ${b.description} — ${fmt(b.amount)}\n`;
      });
      text += `\n📊 Total: ${fmt(trip.totalBudget)}`;
      if (trip.travelers > 1) text += ` (${fmt(trip.totalBudget / trip.travelers)}/person)`;
      text += '\n';
    }

    if (trip.totalActual > 0) {
      text += `💳 Actual Spent: ${fmt(trip.totalActual)}\n`;
    }

    // Per-person expense breakdown
    if (trip.travelerNames && trip.travelerNames.length > 0 && trip.dailyExpenses.length > 0) {
      const personTotals = {};
      trip.travelerNames.forEach((name) => { personTotals[name] = 0; });
      trip.dailyExpenses.forEach((exp) => {
        if (exp.paidBy && personTotals[exp.paidBy] !== undefined) {
          personTotals[exp.paidBy] += exp.amount;
        }
      });
      const hasAny = Object.values(personTotals).some((v) => v > 0);
      if (hasAny) {
        text += `\n👤 Per-Person Expenses:\n`;
        Object.entries(personTotals).forEach(([name, total]) => {
          text += `  • ${name}: ${fmt(total)}\n`;
        });
      }
    }

    text += `\n— Planned with Travely`;

    res.json({ summary: text });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};
