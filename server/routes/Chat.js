const express = require('express');
const router = express.Router({ mergeParams: true });
const Message = require('../models/Message');
const Member = require('../models/Member');
const { protect } = require('../middleware/auth');

// @route   GET /api/trips/:tripId/chat
// @desc    Get all chat messages for a trip
// @access  Private
router.get('/', protect, async (req, res) => {
  try {
    const { tripId } = req.params;

    // Check if the user is a member of the trip
    const isMember = await Member.findOne({ trip: tripId, user: req.user._id });
    if (!isMember) {
      return res.status(403).json({ message: 'Access denied. You are not a member of this trip.' });
    }

    // Fetch messages populated with sender info, sorted by time ascending (older first)
    const messages = await Message.find({ trip: tripId })
      .populate('sender', 'name email avatar')
      .sort({ createdAt: 1 })
      .limit(100); // Limit to the last 100 messages to prevent heavy loading

    res.json(messages);
  } catch (error) {
    console.error('Error fetching chat messages:', error);
    res.status(500).json({ message: 'Error retrieving chat messages', error: error.message });
  }
});

module.exports = router;
