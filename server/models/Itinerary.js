const mongoose = require('mongoose');

const activitySchema = new mongoose.Schema({
  time: {
    type: String,
    trim: true,
  },
  title: {
    type: String,
    required: [true, 'Activity title is required'],
    trim: true,
  },
  description: {
    type: String,
    trim: true,
  },
  cost: {
    type: Number,
    default: 0,
  },
  location: {
    type: String,
    trim: true,
  },
  type: {
    type: String,
    enum: ['activity', 'food', 'transport', 'stay', 'rest', 'other'],
    default: 'activity',
  },
  done: {
    type: Boolean,
    default: false,
  },
});

const itinerarySchema = new mongoose.Schema(
  {
    trip: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Trip',
      required: true,
    },
    dayNumber: {
      type: Number,
      required: true,
    },
    date: {
      type: Date,
    },
    activities: [activitySchema],
  },
  {
    timestamps: true,
  }
);

// A trip can only have one itinerary document per day number
itinerarySchema.index({ trip: 1, dayNumber: 1 }, { unique: true });

module.exports = mongoose.model('Itinerary', itinerarySchema);
