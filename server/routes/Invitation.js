const express = require('express');
const router = express.Router();
const Invitation = require('../models/Invitation');
const Member = require('../models/Member');
const Trip = require('../models/Trip');
const { protect } = require('../middleware/auth');

// @route   GET /api/invitations
// @desc    Get all pending invitations for the current user
// @access  Private
router.get('/', protect, async (req, res) => {
  try {
    const invitations = await Invitation.find({ invitee: req.user._id, status: 'pending' })
      .populate('inviter', 'name email avatar')
      .populate('trip', 'name destination emoji gradient');

    // Enrich invitations with current member count for the trip
    const enriched = await Promise.all(
      invitations.map(async (invite) => {
        const memberCount = await Member.countDocuments({ trip: invite.trip._id });
        return {
          ...invite.toJSON(),
          memberCount,
        };
      })
    );

    res.json(enriched);
  } catch (error) {
    console.error('Error fetching invitations:', error);
    res.status(500).json({ message: 'Error retrieving invitations', error: error.message });
  }
});

// @route   POST /api/invitations/:id/accept
// @desc    Accept a trip invitation
// @access  Private
router.post('/:id/accept', protect, async (req, res) => {
  try {
    const invitation = await Invitation.findOne({
      _id: req.params.id,
      invitee: req.user._id,
      status: 'pending',
    });

    if (!invitation) {
      return res.status(404).json({ message: 'Invitation not found or already processed' });
    }

    // Verify trip exists
    const trip = await Trip.findById(invitation.trip);
    if (!trip) {
      // If trip doesn't exist, cleanup invitation
      await Invitation.findByIdAndDelete(req.params.id);
      return res.status(404).json({ message: 'Trip no longer exists' });
    }

    // Check if already a member (failsafe)
    const existingMember = await Member.findOne({ trip: invitation.trip, user: req.user._id });
    if (!existingMember) {
      await Member.create({
        trip: invitation.trip,
        user: req.user._id,
        role: 'editor',
      });
    }

    // Delete the invitation
    await Invitation.findByIdAndDelete(req.params.id);

    res.json({ message: 'Invitation accepted! Welcome to the crew. ✈️' });
  } catch (error) {
    console.error('Error accepting invitation:', error);
    res.status(500).json({ message: 'Error accepting invitation', error: error.message });
  }
});

// @route   POST /api/invitations/:id/reject
// @desc    Reject a trip invitation
// @access  Private
router.post('/:id/reject', protect, async (req, res) => {
  try {
    const invitation = await Invitation.findOneAndDelete({
      _id: req.params.id,
      invitee: req.user._id,
      status: 'pending',
    });

    if (!invitation) {
      return res.status(404).json({ message: 'Invitation not found or already processed' });
    }

    res.json({ message: 'Invitation declined.' });
  } catch (error) {
    console.error('Error rejecting invitation:', error);
    res.status(500).json({ message: 'Error declining invitation', error: error.message });
  }
});

module.exports = router;
