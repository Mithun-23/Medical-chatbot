const mongoose = require("mongoose");

const ChatSchema = new mongoose.Schema({
  sessionId: {
    type: String,
    required: true,
    index: true
  },
  userId: {
    type: String,
    required: true
  },
  messages: [
    {
      text: String,
      sender: {
        type: String,
        enum: ['user', 'bot']
      },
      timestamp: {
        type: Date,
        default: Date.now
      }
    }
  ]
});

module.exports = mongoose.model("Chat", ChatSchema);