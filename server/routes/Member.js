const express = require('express');
const router = express.Router({ mergeParams: true });
const Trip = require('../models/Trip');
const Member = require('../models/Member');
const User = require('../models/User');
const { protect } = require('../middleware/auth');

// Helper to check access
const checkTripOwner = async (tripId, userId) => {
  const trip = await Trip.findById(tripId);
  if (!trip) return false;
  const owners = trip.owners || (trip.owner ? [trip.owner] : []);
  return owners.map(id => id.toString()).includes(userId.toString());
};
// @route   GET /api/trips/:tripId/members
// @desc    Get all members of a trip
// @access  Private
router.get('/', protect, async (req, res) => {
  try {
    const { tripId } = req.params;
    const userMember = await Member.findOne({ trip: tripId, user: req.user._id });
    if (!userMember) {
      return res.status(403).json({ message: 'Access denied. You are not a member of this trip.' });
    }

    const members = await Member.find({ trip: tripId })
      .populate('user', 'name email avatar')
      .sort({ role: 1, createdAt: 1 });

    res.json(members);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error retrieving members', error: error.message });
  }
});

// @route   POST /api/trips/:tripId/members
// @desc    Add a user to a trip by email
// @access  Private
router.post('/', protect, async (req, res) => {
  try {
    const { tripId } = req.params;
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ message: 'Email address is required' });
    }

    // Check if user is trip owner
    const isOwner = await checkTripOwner(tripId, req.user._id);
    if (!isOwner) {
      return res.status(403).json({ message: 'Only the trip owner can add members' });
    }

    // Find user by email
    const userToAdd = await User.findOne({ email: email.toLowerCase().trim() });
    if (!userToAdd) {
      return res.status(404).json({ message: 'User not found with this email' });
    }

    // Check if user is already a member
    const existingMember = await Member.findOne({ trip: tripId, user: userToAdd._id });
    if (existingMember) {
      return res.status(400).json({ message: 'User is already a member of this trip' });
    }

    const newMember = await Member.create({
      trip: tripId,
      user: userToAdd._id,
      role: 'editor', // Default role
    });

    const populated = await newMember.populate('user', 'name email avatar');

    res.status(201).json(populated);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error adding member', error: error.message });
  }
});

// @route   DELETE /api/trips/:tripId/members/:userId
// @desc    Remove a member from a trip or leave a trip
// @access  Private
router.delete('/:userId', protect, async (req, res) => {
  try {
    const { tripId, userId } = req.params;

    const trip = await Trip.findById(tripId);
    if (!trip) {
      return res.status(404).json({ message: 'Trip not found' });
    }

    const tripOwners = (trip.owners || [trip.owner]).map(id => id.toString());
    const isOwner = tripOwners.includes(req.user._id.toString());
    const isSelf = userId.toString() === req.user._id.toString();

    // Only trip owners or the users themselves leaving can perform deletion
    if (!isOwner && !isSelf) {
      return res.status(403).json({ message: 'Not authorized to remove this member' });
    }

    if (tripOwners.includes(userId.toString())) {
      return res.status(400).json({ message: 'Cannot remove an owner of the trip' });
    }

    const deleted = await Member.findOneAndDelete({ trip: tripId, user: userId });
    if (!deleted) {
      return res.status(404).json({ message: 'Member not found in this trip' });
    }

    res.json({ message: 'Member removed successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error removing member', error: error.message });
  }
});

// @route   PUT /api/trips/:tripId/members/:userId/role
// @desc    Update a member's role
// @access  Private (owner only)
router.put('/:userId/role', protect, async (req, res) => {
  try {
    const { tripId, userId } = req.params;
    const { role } = req.body;

    const isOwner = await checkTripOwner(tripId, req.user._id);
    if (!isOwner) {
      return res.status(403).json({ message: 'Only the trip owner can change roles' });
    }

    const member = await Member.findOneAndUpdate(
      { trip: tripId, user: userId },
      { role },
      { new: true }
    ).populate('user', 'name email avatar');

    if (!member) {
      return res.status(404).json({ message: 'Member not found' });
    }

    res.json(member);
  } catch (error) {
    res.status(500).json({ message: 'Error updating role', error: error.message });
  }
});

module.exports = router;
