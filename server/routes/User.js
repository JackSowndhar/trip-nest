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

module.exports = router;