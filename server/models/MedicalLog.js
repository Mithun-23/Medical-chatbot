const mongoose = require("mongoose");

const mentalHealthLogSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    sessionId: { type: mongoose.Schema.Types.ObjectId, ref: "Session", required: true},
    message: { type: String, required: true },
    sentiment: { type: String },
    emotion: { type: String },
    stressLevel: { type: Number },
    timestamp: { type: Date, default: Date.now }
});

const MentalHealthLog = mongoose.model("MentalHealthLog", mentalHealthLogSchema);

module.exports = MentalHealthLog;
