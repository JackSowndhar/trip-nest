const express = require('express');
const router = express.Router();
const User = require('../models/User');
const { protect } = require('../middleware/auth');


router.get('/', protect, async (req, res) => {
  try {
    const users = await User.find()
      .select('name email avatar')
      .sort({ name: 1 });

    res.json(users);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error retrieving users', error: error.message });
  }
});

router.put('/avatar', protect, async (req, res) => {
  try {
    const { avatar } = req.body;

    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    user.avatar = avatar;
    await user.save();

    res.json({
      message: 'Avatar updated successfully',
      user: user.toSafeObject(),
    });
  } catch (error) {
    console.error('Error updating avatar:', error);
    res.status(500).json({ message: 'Error updating avatar', error: error.message });
  }
});

module.exports = router;