const mongoose = require('mongoose');

const memberSchema = new mongoose.Schema(
  {
    trip: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Trip',
      required: true,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    role: {
      type: String,
      enum: ['owner', 'editor', 'viewer'],
      default: 'editor',
    },
  },
  {
    timestamps: true,
  }
);

// Ensure a user can only be added once to a trip
memberSchema.index({ trip: 1, user: 1 }, { unique: true });

module.exports = mongoose.model('Member', memberSchema);
