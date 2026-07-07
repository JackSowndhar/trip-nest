const express = require('express');
const router = express.Router({ mergeParams: true });
const Member = require('../models/Member');
const Itinerary = require('../models/Itinerary');
const { protect } = require('../middleware/auth');

// Helper to check membership
const checkTripMember = async (tripId, userId) => {
  const isMember = await Member.findOne({ trip: tripId, user: userId });
  return !!isMember;
};

// @route   GET /api/trips/:tripId/itinerary
// @desc    Get itinerary days and activities for a trip
// @access  Private
router.get('/', protect, async (req, res) => {
  try {
    const { tripId } = req.params;

    const isMember = await checkTripMember(tripId, req.user._id);
    if (!isMember) {
      return res.status(403).json({ message: 'Access denied. You are not a member of this trip.' });
    }

    const itineraries = await Itinerary.find({ trip: tripId }).sort({ dayNumber: 1 });
    res.json(itineraries);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error retrieving itinerary', error: error.message });
  }
});

// @route   POST /api/trips/:tripId/itinerary
// @desc    Create or update activities for a day (upsert day)
// @access  Private
router.post('/', protect, async (req, res) => {
  try {
    const { tripId } = req.params;
    const { dayNumber, date, activities } = req.body;

    const isMember = await checkTripMember(tripId, req.user._id);
    if (!isMember) {
      return res.status(403).json({ message: 'Access denied. You are not a member of this trip.' });
    }

    if (!dayNumber) {
      return res.status(400).json({ message: 'Day number is required' });
    }

    let itinerary = await Itinerary.findOne({ trip: tripId, dayNumber });
    if (itinerary) {
      if (date) itinerary.date = date;
      if (activities) itinerary.activities = activities;
      await itinerary.save();
    } else {
      itinerary = await Itinerary.create({
        trip: tripId,
        dayNumber,
        date,
        activities: activities || [],
      });
    }

    res.status(201).json(itinerary);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error saving itinerary', error: error.message });
  }
});

// @route   PUT /api/trips/:tripId/itinerary/:id
// @desc    Update an itinerary day
// @access  Private
router.put('/:id', protect, async (req, res) => {
  try {
    const { tripId, id } = req.params;
    const { date, activities, dayNumber } = req.body;

    const isMember = await checkTripMember(tripId, req.user._id);
    if (!isMember) {
      return res.status(403).json({ message: 'Access denied. You are not a member of this trip.' });
    }

    const updated = await Itinerary.findOneAndUpdate(
      { _id: id, trip: tripId },
      { date, activities, dayNumber },
      { new: true, runValidators: true }
    );

    if (!updated) {
      return res.status(404).json({ message: 'Itinerary day not found' });
    }

    res.json(updated);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error updating itinerary day', error: error.message });
  }
});

// @route   DELETE /api/trips/:tripId/itinerary/:id
// @desc    Delete an itinerary day
// @access  Private
router.delete('/:id', protect, async (req, res) => {
  try {
    const { tripId, id } = req.params;

    const isMember = await checkTripMember(tripId, req.user._id);
    if (!isMember) {
      return res.status(403).json({ message: 'Access denied. You are not a member of this trip.' });
    }

    const deleted = await Itinerary.findOneAndDelete({ _id: id, trip: tripId });
    if (!deleted) {
      return res.status(404).json({ message: 'Itinerary day not found' });
    }

    res.json({ message: 'Itinerary day deleted successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error deleting itinerary day', error: error.message });
  }
});

module.exports = router;
