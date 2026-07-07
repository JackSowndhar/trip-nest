const express = require('express');
const router = express.Router({ mergeParams: true });
const Member = require('../models/Member');
const Expense = require('../models/Expense');
const { protect } = require('../middleware/auth');

// Helper to check membership
const checkTripMember = async (tripId, userId) => {
  const isMember = await Member.findOne({ trip: tripId, user: userId });
  return !!isMember;
};

// @route   GET /api/trips/:tripId/expenses
// @desc    Get all expenses for a trip
// @access  Private
router.get('/', protect, async (req, res) => {
  try {
    const { tripId } = req.params;

    const isMember = await checkTripMember(tripId, req.user._id);
    if (!isMember) {
      return res.status(403).json({ message: 'Access denied. You are not a member of this trip.' });
    }

    const expenses = await Expense.find({ trip: tripId })
      .populate('paidBy', 'name email avatar color')
      .populate('splitWith', 'name email avatar color')
      .sort({ date: -1, createdAt: -1 });

    // Map database fields to what frontend expects (splitWith -> splitAmong, lowercase category)
    const mappedExpenses = expenses.map(exp => {
      const obj = exp.toJSON();
      obj.splitAmong = obj.splitWith;
      if (obj.category) {
        const catMap = {
          'Food': 'food',
          'Stay': 'stay',
          'Transport': 'transport',
          'Activities': 'activity',
          'Shopping': 'shopping',
          'Other': 'other'
        };
        obj.category = catMap[obj.category] || obj.category.toLowerCase();
      }
      return obj;
    });

    const totalSpent = mappedExpenses.reduce((sum, e) => sum + e.amount, 0);

    // Calculate memberSpend
    const members = await Member.find({ trip: tripId }).populate('user', 'name email');
    
    // Initialize paid and owes maps for each member
    const paidMap = {};
    const owesMap = {};
    
    members.forEach(m => {
      if (m.user) {
        paidMap[m.user._id.toString()] = 0;
        owesMap[m.user._id.toString()] = 0;
      }
    });

    mappedExpenses.forEach(exp => {
      const payerId = exp.paidBy?._id?.toString() || exp.paidBy?.toString();
      if (payerId && paidMap[payerId] !== undefined) {
        paidMap[payerId] += exp.amount;
      }
      
      const splitList = exp.splitWith || [];
      if (splitList.length > 0) {
        const splitShare = exp.amount / splitList.length;
        splitList.forEach(userRef => {
          const userId = userRef._id?.toString() || userRef.toString();
          if (userId && owesMap[userId] !== undefined) {
            owesMap[userId] += splitShare;
          }
        });
      }
    });

    const memberSpend = members.filter(m => m.user).map(m => {
      const userIdStr = m.user._id.toString();
      return {
        member: {
          _id: m.user._id,
          name: m.user.name,
          color: m.color || '#6366f1'
        },
        paid: paidMap[userIdStr] || 0,
        owes: owesMap[userIdStr] || 0
      };
    });

    res.json({
      expenses: mappedExpenses,
      totalSpent,
      memberSpend
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error retrieving expenses', error: error.message });
  }
});

// @route   POST /api/trips/:tripId/expenses
// @desc    Add a new expense to a trip
// @access  Private
router.post('/', protect, async (req, res) => {
  try {
    const { tripId } = req.params;
    let { title, amount, category, paidBy, splitWith, splitAmong, date } = req.body;

    const isMember = await checkTripMember(tripId, req.user._id);
    if (!isMember) {
      return res.status(403).json({ message: 'Access denied. You are not a member of this trip.' });
    }

    if (!splitWith && splitAmong) {
      splitWith = splitAmong;
    }

    if (!title || !amount || !category || !paidBy || !splitWith || splitWith.length === 0) {
      return res.status(400).json({ message: 'Please provide all required fields' });
    }

    const catMap = {
      food: 'Food',
      stay: 'Stay',
      transport: 'Transport',
      activity: 'Activities',
      activities: 'Activities',
      shopping: 'Shopping',
      other: 'Other'
    };
    category = catMap[category.toLowerCase()] || 'Other';

    const expense = await Expense.create({
      trip: tripId,
      title,
      amount,
      category,
      paidBy,
      splitWith,
      date: date || Date.now(),
    });

    const populated = await expense.populate([
      { path: 'paidBy', select: 'name email avatar' },
      { path: 'splitWith', select: 'name email avatar' },
    ]);

    const responseObj = populated.toJSON();
    responseObj.splitAmong = responseObj.splitWith;
    responseObj.category = req.body.category;

    res.status(201).json(responseObj);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error creating expense', error: error.message });
  }
});

// @route   PUT /api/trips/:tripId/expenses/:expenseId
// @desc    Update an expense
// @access  Private
router.put('/:expenseId', protect, async (req, res) => {
  try {
    const { tripId, expenseId } = req.params;
    let { title, amount, category, paidBy, splitWith, splitAmong, date } = req.body;

    const isMember = await checkTripMember(tripId, req.user._id);
    if (!isMember) {
      return res.status(403).json({ message: 'Access denied. You are not a member of this trip.' });
    }

    const expense = await Expense.findOne({ _id: expenseId, trip: tripId });
    if (!expense) {
      return res.status(404).json({ message: 'Expense not found' });
    }

    if (!splitWith && splitAmong) {
      splitWith = splitAmong;
    }

    if (category) {
      const catMap = {
        food: 'Food',
        stay: 'Stay',
        transport: 'Transport',
        activity: 'Activities',
        activities: 'Activities',
        shopping: 'Shopping',
        other: 'Other'
      };
      category = catMap[category.toLowerCase()] || 'Other';
    }

    const updated = await Expense.findByIdAndUpdate(
      expenseId,
      {
        title,
        amount,
        category,
        paidBy,
        splitWith,
        date,
      },
      { new: true, runValidators: true }
    ).populate([
      { path: 'paidBy', select: 'name email avatar' },
      { path: 'splitWith', select: 'name email avatar' },
    ]);

    const responseObj = updated.toJSON();
    responseObj.splitAmong = responseObj.splitWith;
    if (req.body.category) {
      responseObj.category = req.body.category;
    }

    res.json(responseObj);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error updating expense', error: error.message });
  }
});

// @route   DELETE /api/trips/:tripId/expenses/:expenseId
// @desc    Delete an expense
// @access  Private
router.delete('/:expenseId', protect, async (req, res) => {
  try {
    const { tripId, expenseId } = req.params;

    const isMember = await checkTripMember(tripId, req.user._id);
    if (!isMember) {
      return res.status(403).json({ message: 'Access denied. You are not a member of this trip.' });
    }

    const deleted = await Expense.findOneAndDelete({ _id: expenseId, trip: tripId });
    if (!deleted) {
      return res.status(404).json({ message: 'Expense not found' });
    }

    res.json({ message: 'Expense deleted successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error deleting expense', error: error.message });
  }
});

module.exports = router;
