const mongoose = require("mongoose");

const CheckInSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true
  },
  checkInDate: {
    type: Date,
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Compound index to ensure one check-in per user per day
CheckInSchema.index({ userId: 1, checkInDate: 1 }, { unique: true });

module.exports = mongoose.model("CheckIn", CheckInSchema);
