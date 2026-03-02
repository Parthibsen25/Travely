const CustomTrip = require('../models/CustomTrip');
const crypto = require('crypto');

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

// PUT /api/custom-trips/:id/expenses/:expenseId — update a daily expense
exports.updateExpense = async (req, res) => {
  try {
    const trip = await CustomTrip.findOne({ _id: req.params.id, userId: req.user.id });
    if (!trip) return res.status(404).json({ message: 'Trip not found' });

    const expense = trip.dailyExpenses.id(req.params.expenseId);
    if (!expense) return res.status(404).json({ message: 'Expense not found' });

    const { date, category, description, amount, paymentMethod, paidBy } = req.body;
    if (date !== undefined) expense.date = date;
    if (category !== undefined) expense.category = category;
    if (description !== undefined) expense.description = description.trim();
    if (amount !== undefined && amount > 0) expense.amount = Number(amount);
    if (paymentMethod !== undefined) expense.paymentMethod = paymentMethod;
    if (paidBy !== undefined) expense.paidBy = paidBy;

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

/* ═══════════════════════════════════════════════════════════════════════
   COLLABORATIVE TRIP PLANNING
   ═══════════════════════════════════════════════════════════════════════ */

// POST /api/custom-trips/:id/share — generate a share link
exports.enableSharing = async (req, res) => {
  try {
    const trip = await CustomTrip.findOne({ _id: req.params.id, userId: req.user.id });
    if (!trip) return res.status(404).json({ message: 'Trip not found' });

    if (!trip.shareToken) {
      trip.shareToken = crypto.randomBytes(16).toString('hex');
    }
    trip.isShared = true;
    await trip.save();

    res.json({ shareToken: trip.shareToken, isShared: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

// DELETE /api/custom-trips/:id/share — disable sharing
exports.disableSharing = async (req, res) => {
  try {
    const trip = await CustomTrip.findOne({ _id: req.params.id, userId: req.user.id });
    if (!trip) return res.status(404).json({ message: 'Trip not found' });

    trip.isShared = false;
    // Keep the token so re-enabling gives same link
    await trip.save();
    res.json({ isShared: false });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

// GET /api/custom-trips/shared/:token — view shared trip (no auth required)
exports.getSharedTrip = async (req, res) => {
  try {
    const trip = await CustomTrip.findOne({ shareToken: req.params.token, isShared: true })
      .populate('userId', 'name')
      .populate('collaborators.userId', 'name email')
      .lean();
    if (!trip) return res.status(404).json({ message: 'Shared trip not found or link disabled' });
    res.json({ trip });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

// POST /api/custom-trips/shared/:token/join — join as collaborator
exports.joinSharedTrip = async (req, res) => {
  try {
    const trip = await CustomTrip.findOne({ shareToken: req.params.token, isShared: true });
    if (!trip) return res.status(404).json({ message: 'Shared trip not found or link disabled' });

    // Already the owner
    if (trip.userId.toString() === req.user.id) {
      return res.json({ trip, message: 'You are the trip owner' });
    }

    // Already a collaborator
    const existing = trip.collaborators.find(
      (c) => c.userId && c.userId.toString() === req.user.id
    );
    if (existing) {
      return res.json({ trip, message: 'Already a collaborator' });
    }

    trip.collaborators.push({
      userId: req.user.id,
      name: req.user.name || req.user.email,
      email: req.user.email,
      role: 'editor',
      joinedAt: new Date()
    });
    await trip.save();
    res.json({ trip, message: 'Joined as collaborator' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

// POST /api/custom-trips/shared/:token/expenses — collaborator adds expense
exports.addCollaboratorExpense = async (req, res) => {
  try {
    const trip = await CustomTrip.findOne({ shareToken: req.params.token, isShared: true });
    if (!trip) return res.status(404).json({ message: 'Shared trip not found' });

    // Check if user is owner or collaborator with editor role
    const isOwner = req.user && trip.userId.toString() === req.user.id;
    const collab = req.user && trip.collaborators.find(
      (c) => c.userId && c.userId.toString() === req.user.id && c.role === 'editor'
    );
    if (!isOwner && !collab) {
      return res.status(403).json({ message: 'Not authorized to add expenses' });
    }

    const { date, category, description, amount, paymentMethod, paidBy, splitType, splitAmong, customSplits } = req.body;
    if (!category || !description || !amount || amount <= 0) {
      return res.status(400).json({ message: 'Category, description and valid amount are required' });
    }

    trip.dailyExpenses.push({
      date: date || new Date(),
      category,
      description: description.trim(),
      amount: Number(amount),
      paymentMethod: paymentMethod || 'cash',
      paidBy: paidBy || '',
      splitType: splitType || 'equal',
      splitAmong: splitAmong || [],
      customSplits: customSplits || []
    });

    await trip.save();
    res.status(201).json({ trip });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

// POST /api/custom-trips/shared/:token/checklist — collaborator toggles/adds checklist
exports.updateCollaboratorChecklist = async (req, res) => {
  try {
    const trip = await CustomTrip.findOne({ shareToken: req.params.token, isShared: true });
    if (!trip) return res.status(404).json({ message: 'Shared trip not found' });

    const isOwner = req.user && trip.userId.toString() === req.user.id;
    const collab = req.user && trip.collaborators.find(
      (c) => c.userId && c.userId.toString() === req.user.id && c.role === 'editor'
    );
    if (!isOwner && !collab) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    const { checklist } = req.body;
    if (checklist !== undefined) trip.checklist = checklist;
    await trip.save();
    res.json({ trip });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

// DELETE /api/custom-trips/:id/collaborators/:collabId — remove collaborator
exports.removeCollaborator = async (req, res) => {
  try {
    const trip = await CustomTrip.findOne({ _id: req.params.id, userId: req.user.id });
    if (!trip) return res.status(404).json({ message: 'Trip not found' });

    trip.collaborators = trip.collaborators.filter(
      (c) => c._id.toString() !== req.params.collabId
    );
    await trip.save();
    res.json({ trip });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

/* ═══════════════════════════════════════════════════════════════════════
   SPLIT BILLS CALCULATOR
   ═══════════════════════════════════════════════════════════════════════ */

// GET /api/custom-trips/:id/settlements — compute who owes whom
exports.getSettlements = async (req, res) => {
  try {
    const trip = await CustomTrip.findOne({ _id: req.params.id, userId: req.user.id });
    if (!trip) return res.status(404).json({ message: 'Trip not found' });

    const { settlements, personSummary } = computeSettlements(trip);
    res.json({ settlements, personSummary });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

// Also available for shared trips
exports.getSharedSettlements = async (req, res) => {
  try {
    const trip = await CustomTrip.findOne({ shareToken: req.params.token, isShared: true });
    if (!trip) return res.status(404).json({ message: 'Shared trip not found' });

    const { settlements, personSummary } = computeSettlements(trip);
    res.json({ settlements, personSummary });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

function computeSettlements(trip) {
  const names = trip.travelerNames || [];
  if (names.length < 2) return { settlements: [], personSummary: [] };

  // Track: how much each person paid, how much each person owes
  const paid = {};
  const owes = {};
  names.forEach((n) => { paid[n] = 0; owes[n] = 0; });

  (trip.dailyExpenses || []).forEach((exp) => {
    const payer = exp.paidBy;
    if (!payer || !paid.hasOwnProperty(payer)) return; // unassigned expense

    const amount = exp.amount;
    paid[payer] += amount;

    if (exp.splitType === 'custom' && exp.customSplits && exp.customSplits.length > 0) {
      // Custom split amounts
      exp.customSplits.forEach((s) => {
        if (owes.hasOwnProperty(s.name)) {
          owes[s.name] += s.amount;
        }
      });
    } else if (exp.splitType === 'full') {
      // Full amount on payer only
      owes[payer] += amount;
    } else {
      // Equal split (default)
      const participants = (exp.splitAmong && exp.splitAmong.length > 0)
        ? exp.splitAmong.filter((n) => names.includes(n))
        : names;
      const share = amount / participants.length;
      participants.forEach((n) => { owes[n] += share; });
    }
  });

  // Net balance: positive means they are owed money, negative means they owe
  const balances = {};
  names.forEach((n) => {
    balances[n] = paid[n] - owes[n];
  });

  // Greedy settlement algorithm (minimize transactions)
  const debtors = []; // negative balance — they owe
  const creditors = []; // positive balance — they are owed

  names.forEach((n) => {
    const bal = Math.round(balances[n] * 100) / 100;
    if (bal < -0.01) debtors.push({ name: n, amount: Math.abs(bal) });
    else if (bal > 0.01) creditors.push({ name: n, amount: bal });
  });

  // Sort for efficiency
  debtors.sort((a, b) => b.amount - a.amount);
  creditors.sort((a, b) => b.amount - a.amount);

  const settlements = [];
  let di = 0, ci = 0;
  while (di < debtors.length && ci < creditors.length) {
    const transfer = Math.min(debtors[di].amount, creditors[ci].amount);
    if (transfer > 0.01) {
      settlements.push({
        from: debtors[di].name,
        to: creditors[ci].name,
        amount: Math.round(transfer * 100) / 100
      });
    }
    debtors[di].amount -= transfer;
    creditors[ci].amount -= transfer;
    if (debtors[di].amount < 0.01) di++;
    if (creditors[ci].amount < 0.01) ci++;
  }

  // Person summary
  const personSummary = names.map((n) => ({
    name: n,
    paid: Math.round(paid[n] * 100) / 100,
    owes: Math.round(owes[n] * 100) / 100,
    balance: Math.round(balances[n] * 100) / 100
  }));

  return { settlements, personSummary };
}

/* ═══════════════════════════════════════════════════════════════════════
   AI BUDGET OPTIMIZER
   ═══════════════════════════════════════════════════════════════════════ */

// Average daily costs per person for popular destinations (INR)
const DESTINATION_COSTS = {
  // Beach destinations
  'goa': { Transport: 600, Accommodation: 2500, Food: 1200, Activities: 1500, Shopping: 500, Other: 300, tier: 'mid', type: 'beach' },
  'pondicherry': { Transport: 400, Accommodation: 2000, Food: 1000, Activities: 800, Shopping: 400, Other: 200, tier: 'budget', type: 'beach' },
  'andaman': { Transport: 800, Accommodation: 3000, Food: 1500, Activities: 2000, Shopping: 600, Other: 400, tier: 'premium', type: 'beach' },
  'gokarna': { Transport: 300, Accommodation: 1500, Food: 800, Activities: 600, Shopping: 200, Other: 200, tier: 'budget', type: 'beach' },
  'kovalam': { Transport: 400, Accommodation: 2200, Food: 1000, Activities: 1000, Shopping: 400, Other: 300, tier: 'mid', type: 'beach' },
  'lakshadweep': { Transport: 1200, Accommodation: 4000, Food: 1800, Activities: 2500, Shopping: 300, Other: 500, tier: 'luxury', type: 'beach' },

  // Hill stations
  'manali': { Transport: 500, Accommodation: 2000, Food: 900, Activities: 1200, Shopping: 400, Other: 300, tier: 'mid', type: 'hill' },
  'shimla': { Transport: 500, Accommodation: 2200, Food: 900, Activities: 1000, Shopping: 500, Other: 300, tier: 'mid', type: 'hill' },
  'ooty': { Transport: 400, Accommodation: 1800, Food: 800, Activities: 800, Shopping: 400, Other: 200, tier: 'budget', type: 'hill' },
  'munnar': { Transport: 400, Accommodation: 2000, Food: 900, Activities: 1000, Shopping: 400, Other: 200, tier: 'mid', type: 'hill' },
  'darjeeling': { Transport: 500, Accommodation: 1800, Food: 800, Activities: 1000, Shopping: 500, Other: 300, tier: 'mid', type: 'hill' },
  'mussoorie': { Transport: 500, Accommodation: 2200, Food: 900, Activities: 800, Shopping: 400, Other: 300, tier: 'mid', type: 'hill' },
  'kodaikanal': { Transport: 400, Accommodation: 1800, Food: 800, Activities: 900, Shopping: 300, Other: 200, tier: 'budget', type: 'hill' },
  'nainital': { Transport: 500, Accommodation: 2000, Food: 800, Activities: 900, Shopping: 400, Other: 200, tier: 'mid', type: 'hill' },
  'coorg': { Transport: 400, Accommodation: 2200, Food: 900, Activities: 1000, Shopping: 400, Other: 200, tier: 'mid', type: 'hill' },
  'leh': { Transport: 1000, Accommodation: 2500, Food: 1000, Activities: 1500, Shopping: 500, Other: 500, tier: 'premium', type: 'hill' },
  'ladakh': { Transport: 1000, Accommodation: 2500, Food: 1000, Activities: 1500, Shopping: 500, Other: 500, tier: 'premium', type: 'hill' },

  // Heritage / cultural
  'jaipur': { Transport: 400, Accommodation: 2000, Food: 800, Activities: 1200, Shopping: 800, Other: 300, tier: 'mid', type: 'heritage' },
  'udaipur': { Transport: 400, Accommodation: 2500, Food: 900, Activities: 1200, Shopping: 600, Other: 300, tier: 'mid', type: 'heritage' },
  'varanasi': { Transport: 400, Accommodation: 1500, Food: 600, Activities: 800, Shopping: 500, Other: 200, tier: 'budget', type: 'heritage' },
  'agra': { Transport: 400, Accommodation: 1800, Food: 700, Activities: 1000, Shopping: 600, Other: 200, tier: 'mid', type: 'heritage' },
  'jodhpur': { Transport: 400, Accommodation: 1800, Food: 700, Activities: 1000, Shopping: 600, Other: 200, tier: 'mid', type: 'heritage' },
  'mysore': { Transport: 300, Accommodation: 1500, Food: 700, Activities: 800, Shopping: 500, Other: 200, tier: 'budget', type: 'heritage' },
  'hampi': { Transport: 300, Accommodation: 1200, Food: 600, Activities: 600, Shopping: 300, Other: 200, tier: 'budget', type: 'heritage' },
  'delhi': { Transport: 500, Accommodation: 2500, Food: 1000, Activities: 1200, Shopping: 1000, Other: 400, tier: 'mid', type: 'city' },
  'mumbai': { Transport: 600, Accommodation: 3000, Food: 1200, Activities: 1500, Shopping: 1000, Other: 400, tier: 'premium', type: 'city' },
  'kolkata': { Transport: 400, Accommodation: 1800, Food: 700, Activities: 800, Shopping: 500, Other: 300, tier: 'budget', type: 'city' },
  'bangalore': { Transport: 500, Accommodation: 2500, Food: 1000, Activities: 1000, Shopping: 800, Other: 300, tier: 'mid', type: 'city' },
  'bengaluru': { Transport: 500, Accommodation: 2500, Food: 1000, Activities: 1000, Shopping: 800, Other: 300, tier: 'mid', type: 'city' },
  'hyderabad': { Transport: 400, Accommodation: 2000, Food: 800, Activities: 900, Shopping: 700, Other: 300, tier: 'mid', type: 'city' },
  'chennai': { Transport: 400, Accommodation: 2000, Food: 800, Activities: 800, Shopping: 600, Other: 300, tier: 'mid', type: 'city' },
  'kochi': { Transport: 400, Accommodation: 2000, Food: 900, Activities: 1000, Shopping: 500, Other: 200, tier: 'mid', type: 'heritage' },

  // Adventure / nature
  'rishikesh': { Transport: 400, Accommodation: 1500, Food: 700, Activities: 2000, Shopping: 300, Other: 300, tier: 'mid', type: 'adventure' },
  'mcleodganj': { Transport: 400, Accommodation: 1200, Food: 600, Activities: 800, Shopping: 300, Other: 200, tier: 'budget', type: 'hill' },
  'spiti': { Transport: 800, Accommodation: 1500, Food: 700, Activities: 1200, Shopping: 300, Other: 400, tier: 'mid', type: 'adventure' },
  'kasol': { Transport: 400, Accommodation: 1200, Food: 600, Activities: 800, Shopping: 200, Other: 200, tier: 'budget', type: 'hill' },
  'bir billing': { Transport: 400, Accommodation: 1200, Food: 600, Activities: 2000, Shopping: 200, Other: 200, tier: 'mid', type: 'adventure' },
  'auli': { Transport: 600, Accommodation: 2000, Food: 800, Activities: 1500, Shopping: 200, Other: 300, tier: 'mid', type: 'adventure' },
  'meghalaya': { Transport: 700, Accommodation: 2000, Food: 800, Activities: 1200, Shopping: 400, Other: 300, tier: 'mid', type: 'adventure' },
  'sikkim': { Transport: 600, Accommodation: 2000, Food: 800, Activities: 1200, Shopping: 400, Other: 300, tier: 'mid', type: 'adventure' },
  'ranthambore': { Transport: 500, Accommodation: 2500, Food: 800, Activities: 2500, Shopping: 300, Other: 300, tier: 'premium', type: 'wildlife' },
  'jim corbett': { Transport: 500, Accommodation: 2500, Food: 800, Activities: 2000, Shopping: 200, Other: 300, tier: 'mid', type: 'wildlife' },

  // International budget
  'thailand': { Transport: 1500, Accommodation: 3000, Food: 1500, Activities: 2000, Shopping: 1000, Other: 500, tier: 'mid', type: 'international' },
  'bali': { Transport: 1500, Accommodation: 3500, Food: 1500, Activities: 2500, Shopping: 1000, Other: 500, tier: 'mid', type: 'international' },
  'sri lanka': { Transport: 1200, Accommodation: 2500, Food: 1200, Activities: 1500, Shopping: 600, Other: 400, tier: 'budget', type: 'international' },
  'nepal': { Transport: 800, Accommodation: 1500, Food: 800, Activities: 1200, Shopping: 400, Other: 300, tier: 'budget', type: 'international' },
  'vietnam': { Transport: 1200, Accommodation: 2000, Food: 1000, Activities: 1500, Shopping: 600, Other: 400, tier: 'budget', type: 'international' },
  'dubai': { Transport: 2000, Accommodation: 5000, Food: 2500, Activities: 3000, Shopping: 2000, Other: 800, tier: 'luxury', type: 'international' },
  'singapore': { Transport: 2000, Accommodation: 5000, Food: 2500, Activities: 3000, Shopping: 1500, Other: 700, tier: 'luxury', type: 'international' },
  'malaysia': { Transport: 1500, Accommodation: 3000, Food: 1500, Activities: 2000, Shopping: 1000, Other: 500, tier: 'mid', type: 'international' },
  'maldives': { Transport: 2500, Accommodation: 8000, Food: 3000, Activities: 3000, Shopping: 500, Other: 800, tier: 'luxury', type: 'international' },
};

// Budget tier multipliers
const TIER_MULTIPLIERS = {
  budget: 0.6,
  mid: 1.0,
  premium: 1.3,
  luxury: 1.8
};

// POST /api/custom-trips/optimize-budget — AI budget optimizer
exports.optimizeBudget = async (req, res) => {
  try {
    const { destination, totalBudget, days, travelers, travelStyle } = req.body;

    if (!destination || !totalBudget || !days || totalBudget <= 0 || days <= 0) {
      return res.status(400).json({ message: 'destination, totalBudget, days are required' });
    }

    const numTravelers = travelers || 1;
    const perPersonBudget = totalBudget / numTravelers;
    const dailyBudget = perPersonBudget / days;

    // Find destination cost data (fuzzy match)
    const destKey = destination.toLowerCase().trim();
    let costData = DESTINATION_COSTS[destKey];

    // Try partial match
    if (!costData) {
      const match = Object.keys(DESTINATION_COSTS).find(
        (k) => destKey.includes(k) || k.includes(destKey)
      );
      if (match) costData = DESTINATION_COSTS[match];
    }

    // Fallback: generate generic costs based on budget
    if (!costData) {
      const avgDaily = dailyBudget;
      costData = {
        Transport: avgDaily * 0.12,
        Accommodation: avgDaily * 0.35,
        Food: avgDaily * 0.20,
        Activities: avgDaily * 0.18,
        Shopping: avgDaily * 0.08,
        Other: avgDaily * 0.07,
        tier: 'mid',
        type: 'general'
      };
    }

    // Apply travel style multiplier
    const styleMap = {
      backpacker: 0.5,
      budget: 0.7,
      comfort: 1.0,
      premium: 1.4,
      luxury: 2.0
    };
    const styleMul = styleMap[travelStyle] || 1.0;

    // Calculate base daily cost per person
    const categories = ['Transport', 'Accommodation', 'Food', 'Activities', 'Shopping', 'Other'];
    const baseDailyCost = categories.reduce((sum, cat) => sum + (costData[cat] || 0), 0);
    const adjustedDailyCost = baseDailyCost * styleMul;

    // Scale to fit budget
    const scaleFactor = dailyBudget / adjustedDailyCost;

    // Generate optimized budget items
    const budgetItems = [];
    const categoryAllocations = {};
    let totalAllocated = 0;

    categories.forEach((cat) => {
      const rawAmount = (costData[cat] || 0) * styleMul * scaleFactor * days * numTravelers;
      const amount = Math.round(rawAmount / 100) * 100; // round to nearest 100
      categoryAllocations[cat] = amount;
      totalAllocated += amount;
    });

    // Adjust to match exact budget
    const diff = totalBudget - totalAllocated;
    if (diff !== 0) {
      // Add/subtract from the largest category
      const largest = categories.reduce((a, b) =>
        categoryAllocations[a] > categoryAllocations[b] ? a : b
      );
      categoryAllocations[largest] += diff;
    }

    // Build descriptive budget items
    const descriptions = {
      Transport: getTransportDesc(costData.type, days, destination),
      Accommodation: getAccommodationDesc(travelStyle, days, destination),
      Food: getFoodDesc(travelStyle, days, numTravelers),
      Activities: getActivitiesDesc(costData.type, days, destination),
      Shopping: `Souvenirs & shopping`,
      Other: `Miscellaneous & contingency`
    };

    categories.forEach((cat) => {
      if (categoryAllocations[cat] > 0) {
        budgetItems.push({
          category: cat,
          description: descriptions[cat],
          amount: categoryAllocations[cat]
        });
      }
    });

    // Generate tips
    const tips = generateBudgetTips(destination, costData, travelStyle, dailyBudget, totalBudget, days, numTravelers);

    // Feasibility assessment
    const minDailyCost = baseDailyCost * 0.5; // bare minimum
    const feasibility = dailyBudget >= minDailyCost * 1.2 ? 'comfortable'
      : dailyBudget >= minDailyCost * 0.8 ? 'tight'
      : 'very_tight';

    res.json({
      budgetItems,
      totalBudget,
      perPersonPerDay: Math.round(dailyBudget),
      feasibility,
      destinationType: costData.type,
      tips,
      categoryBreakdown: categoryAllocations
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

// GET /api/custom-trips/destinations — list known destinations for autocomplete
exports.getKnownDestinations = (req, res) => {
  const destinations = Object.keys(DESTINATION_COSTS).map((key) => ({
    name: key.charAt(0).toUpperCase() + key.slice(1),
    type: DESTINATION_COSTS[key].type,
    tier: DESTINATION_COSTS[key].tier,
    avgDailyCost: Object.values(DESTINATION_COSTS[key]).filter((v) => typeof v === 'number').reduce((a, b) => a + b, 0)
  }));
  destinations.sort((a, b) => a.name.localeCompare(b.name));
  res.json({ destinations });
};

function getTransportDesc(type, days, dest) {
  if (type === 'international') return `Flights + local transport (${days} days)`;
  if (type === 'hill' || type === 'adventure') return `Travel to ${dest} + local cab/bike rental`;
  if (type === 'beach') return `Flights/train + scooter/bike rental (${days} days)`;
  return `Round-trip travel + local transport (${days} days)`;
}

function getAccommodationDesc(style, days, dest) {
  const nights = Math.max(1, days - 1);
  if (style === 'backpacker') return `Hostel / dormitory (${nights} nights)`;
  if (style === 'budget') return `Budget hotel / guesthouse (${nights} nights)`;
  if (style === 'premium') return `Premium hotel / resort (${nights} nights)`;
  if (style === 'luxury') return `Luxury resort / 5-star hotel (${nights} nights)`;
  return `Hotel / resort (${nights} nights)`;
}

function getFoodDesc(style, days, travelers) {
  const meals = days * 3;
  if (style === 'backpacker') return `Street food & local eateries (${meals} meals)`;
  if (style === 'budget') return `Local restaurants & cafes (${meals} meals)`;
  if (style === 'premium') return `Fine dining & restaurants (${meals} meals)`;
  if (style === 'luxury') return `Premium dining & room service (${meals} meals)`;
  return `Meals & dining (${meals} meals)`;
}

function getActivitiesDesc(type, days, dest) {
  if (type === 'beach') return `Water sports, beach activities, sunset cruise`;
  if (type === 'hill') return `Trekking, sightseeing, local tours`;
  if (type === 'adventure') return `Adventure sports, trekking, outdoor activities`;
  if (type === 'heritage') return `Museum entries, monument tickets, guided tours`;
  if (type === 'wildlife') return `Safari rides, park fees, nature walks`;
  if (type === 'city') return `City tours, attractions, entertainment`;
  if (type === 'international') return `Tours, excursions, local experiences`;
  return `Sightseeing & entertainment (${days} days)`;
}

function generateBudgetTips(dest, costData, style, dailyBudget, total, days, travelers) {
  const tips = [];
  const tier = costData.tier;

  if (style === 'backpacker' || style === 'budget') {
    tips.push('💡 Book hostels or homestays on Hostelworld/Airbnb for the best budget rates');
    tips.push('🍽️ Eat at local dhabas and street food stalls to save 40-60% on food');
  }

  if (costData.type === 'beach') {
    tips.push('🛵 Rent a scooter instead of cabs — saves up to ₹500/day');
    tips.push('🌅 Many beach activities are free — sunrise walks, beach hopping');
  }

  if (costData.type === 'hill' || costData.type === 'adventure') {
    tips.push('🏔️ Travel in groups to split cab/jeep costs');
    tips.push('🎒 Carry snacks & water from base towns — prices spike uphill');
  }

  if (costData.type === 'heritage') {
    tips.push('🎟️ Check for combined monument tickets — saves 30-50%');
    tips.push('📱 Use audio guides (apps) instead of hiring personal guides');
  }

  if (costData.type === 'international') {
    tips.push('💳 Use zero-forex credit cards to avoid currency conversion fees');
    tips.push('✈️ Book flights 2-3 months in advance for best rates');
    tips.push('🏨 Consider Airbnb for stays longer than 3 nights');
  }

  if (travelers > 1) {
    tips.push(`👥 Split accommodation costs — ₹${Math.round(total * 0.35 / travelers)} per person for stays`);
  }

  if (dailyBudget < 3000) {
    tips.push('🚌 Use public transport (buses/metros) instead of private cabs');
    tips.push('🕐 Travel during off-season for 20-40% lower hotel rates');
  }

  if (days >= 5) {
    tips.push('📅 Consider a weekly hotel deal — many offer 10-15% off for 5+ nights');
  }

  tips.push('🔖 Apply Travely referral coupons at checkout for extra discounts');

  return tips.slice(0, 6); // max 6 tips
}
