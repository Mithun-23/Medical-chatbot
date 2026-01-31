const mongoose = require("mongoose");

const ArchivedChatSchema = new mongoose.Schema({
    sessionId: {
        type: String,
        required: true,
        index: true
    },
    userId: {
        type: String,
        required: true,
        index: true
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
    ],
    archivedAt: {
        type: Date,
        default: Date.now
    },
    originalCreatedAt: {
        type: Date
    }
});

// Index for efficient querying of user's archived chats
ArchivedChatSchema.index({ userId: 1, archivedAt: -1 });

module.exports = mongoose.model("ArchivedChat", ArchivedChatSchema);
