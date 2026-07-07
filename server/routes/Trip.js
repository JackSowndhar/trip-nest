const express = require('express');
const router = express.Router();
const Trip = require('../models/Trip');
const Member = require('../models/Member');
const Expense = require('../models/Expense');
const Itinerary = require('../models/Itinerary');
const { protect } = require('../middleware/auth');

// Helper to check if user has access to the trip
const hasTripAccess = async (tripId, userId) => {
  const trip = await Trip.findById(tripId);
  if (!trip) return null;
  const isOwner = (trip.owners || []).map(id => id.toString()).includes(userId.toString());
  if (isOwner) return { trip, role: 'owner' };
  const member = await Member.findOne({ trip: tripId, user: userId });
  if (member) return { trip, role: member.role };
  return null;
};

// @route   POST /api/trips
// @desc    Create a new trip
// @access  Private
router.post('/', protect, async (req, res) => {
  try {
    const { name, destination, startDate, endDate, budget, emoji, gradient, status } = req.body;

    const trip = await Trip.create({
      name, destination, startDate, endDate,
      budget: budget || 0,
      owners: [req.user._id],
      emoji: emoji || '✈️',
      gradient: gradient || 'from-primary-500 to-emerald-500',
      status: status || 'planning',
    });

    // Automatically add owner as a member
    await Member.create({
      trip: trip._id,
      user: req.user._id,
      role: 'owner',
    });

    res.status(201).json(trip);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error creating trip', error: error.message });
  }
});

// @route   GET /api/trips
// @desc    Get all trips for user (owned or member)
// @access  Private
router.get('/', protect, async (req, res) => {
  try {
    const memberTrips = await Member.find({ user: req.user._id });
    const tripIds = memberTrips.map((m) => m.trip);

   const trips = await Trip.find({
      $or: [{ owners: req.user._id }, { _id: { $in: tripIds } }],
    }).sort({ startDate: -1 });

    const enrichedTrips = await Promise.all(
      trips.map(async (trip) => {
        const memberCount = await Member.countDocuments({ trip: trip._id });
        const expenses = await Expense.find({ trip: trip._id });
        const totalSpent = expenses.reduce((sum, e) => sum + e.amount, 0);
        const now = new Date();
        const start = new Date(trip.startDate);
        const end = new Date(trip.endDate);

        let status = trip.status;
        if (!status) {
          if (now >= end) {
            status = 'completed';
          } else if (now >= start) {
            status = 'active';
          } else {
            status = 'planning';
          }
        }

        // Calculate travel progress percentage based on status and dates
        let progress = 0;
        if (status === 'completed') {
          progress = 100;
        } else if (status === 'planning') {
          progress = 0;
        } else {
          // active
          if (now >= end) {
            progress = 99;
          } else if (now >= start) {
            const totalDuration = end - start;
            const elapsed = now - start;
            progress = Math.min(99, Math.max(1, Math.round((elapsed / totalDuration) * 100)));
          } else {
            progress = 50;
          }
        }

        const durationDays = Math.ceil((end - start) / (1000 * 60 * 60 * 24)) + 1;

        return {
          ...trip.toJSON(),
          memberCount,
          totalSpent,
          progress,
          durationDays,
        };
      })
    );

    res.json(enrichedTrips);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error retrieving trips', error: error.message });
  }
});

// @route   GET /api/trips/:id
// @desc    Get trip by ID
// @access  Private
router.get('/:id', protect, async (req, res) => {
  try {
    const access = await hasTripAccess(req.params.id, req.user._id);
    if (!access) {
      return res.status(403).json({ message: 'Access denied or trip not found' });
    }

    const memberCount = await Member.countDocuments({ trip: access.trip._id });
    const expenses = await Expense.find({ trip: access.trip._id });
    const totalSpent = expenses.reduce((sum, e) => sum + e.amount, 0);

    const now = new Date();
    const start = new Date(access.trip.startDate);
    const end = new Date(access.trip.endDate);

    let status = access.trip.status;
    if (!status) {
      if (now >= end) {
        status = 'completed';
      } else if (now >= start) {
        status = 'active';
      } else {
        status = 'planning';
      }
    }

    let progress = 0;
    if (status === 'completed') {
      progress = 100;
    } else if (status === 'planning') {
      progress = 0;
    } else {
      if (now >= end) {
        progress = 99;
      } else if (now >= start) {
        const totalDuration = end - start;
        const elapsed = now - start;
        progress = Math.min(99, Math.max(1, Math.round((elapsed / totalDuration) * 100)));
      } else {
        progress = 50;
      }
    }

    const durationDays = Math.ceil((end - start) / (1000 * 60 * 60 * 24)) + 1;

    res.json({
      ...access.trip.toJSON(),
      role: access.role,
      memberCount,
      totalSpent,
      progress,
      durationDays,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error retrieving trip details', error: error.message });
  }
});

// @route   PUT /api/trips/:id
// @desc    Update a trip
// @access  Private
router.put('/:id', protect, async (req, res) => {
  try {
    const access = await hasTripAccess(req.params.id, req.user._id);
    if (!access || access.role !== 'owner') {
      return res.status(403).json({ message: 'Only trip owners can update trip details' });
    }

    const { name, destination, startDate, endDate, budget, emoji, gradient, status, progress } = req.body;

    let updatedStatus = status;
    if (progress !== undefined && status === undefined) {
      if (progress === 100) {
        updatedStatus = 'completed';
      } else if (progress > 0) {
        updatedStatus = 'active';
      } else {
        updatedStatus = 'planning';
      }
    }

    const updateData = {};
    if (name !== undefined) updateData.name = name;
    if (destination !== undefined) updateData.destination = destination;
    if (startDate !== undefined) updateData.startDate = startDate;
    if (endDate !== undefined) updateData.endDate = endDate;
    if (budget !== undefined) updateData.budget = budget;
    if (emoji !== undefined) updateData.emoji = emoji;
    if (gradient !== undefined) updateData.gradient = gradient;
    if (updatedStatus !== undefined) updateData.status = updatedStatus;
    if (req.body.owners !== undefined) updateData.owners = req.body.owners;

    const updatedTrip = await Trip.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    );

    const now = new Date();
    const start = new Date(updatedTrip.startDate);
    const end = new Date(updatedTrip.endDate);
    let calculatedProgress = 0;
    if (updatedTrip.status === 'completed') {
      calculatedProgress = 100;
    } else if (updatedTrip.status === 'planning') {
      calculatedProgress = 0;
    } else {
      if (now >= end) {
        calculatedProgress = 99;
      } else if (now >= start) {
        const totalDuration = end - start;
        const elapsed = now - start;
        calculatedProgress = Math.min(99, Math.max(1, Math.round((elapsed / totalDuration) * 100)));
      } else {
        calculatedProgress = 50;
      }
    }

    const durationDays = Math.ceil((end - start) / (1000 * 60 * 60 * 24)) + 1;

    res.json({
      ...updatedTrip.toJSON(),
      progress: calculatedProgress,
      durationDays,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error updating trip', error: error.message });
  }
});

// @route   DELETE /api/trips/:id
// @desc    Delete a trip
// @access  Private
router.delete('/:id', protect, async (req, res) => {
  try {
    const access = await hasTripAccess(req.params.id, req.user._id);
    if (!access || access.role !== 'owner') {
      return res.status(403).json({ message: 'Only trip owners can delete a trip' });
    }

    await Trip.findByIdAndDelete(req.params.id);
    // Cleanup cascade
    await Member.deleteMany({ trip: req.params.id });
    await Expense.deleteMany({ trip: req.params.id });
    await Itinerary.deleteMany({ trip: req.params.id });

    res.json({ message: 'Trip deleted successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error deleting trip', error: error.message });
  }
});

module.exports = router;
