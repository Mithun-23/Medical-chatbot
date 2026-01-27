const mongoose = require("mongoose");

const chatReportSchema = new mongoose.Schema({
    userId: { type: String, required: true },
    sessionId: { type: String, required: true, unique: true },
    message_count: { type: Number, default: 0, min: 0 },
    sentiment: { type: String, default: 'neutral' },
    summary: { type: String, default: '' },
    positive_count: { type: Number, default: 0, min: 0 },
    negative_count: { type: Number, default: 0, min: 0 },
    neutral_count: { type: Number, default: 0, min: 0 }
}, { timestamps: true }); 

module.exports = mongoose.model('ChatReport', chatReportSchema);
