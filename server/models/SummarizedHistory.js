const mongoose = require('mongoose');

const summarySchema = new mongoose.Schema({
    userId: { type: String, required: true },
    sessionId: { type: String, required: true },
    summarizedHistory: { type: String, required: true },
    botResponse: { type: String, required: true },
    createdAt: { type: Date, default: Date.now }
});

const Summary = mongoose.model('Summary', summarySchema);

module.exports = Summary;
