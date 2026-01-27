const express = require("express");
const axios = require("axios");
const Chat = require("../models/chat");
const Session = require("../models/session");
const Summary = require("../models/SummarizedHistory");

const router = express.Router();

router.post('/chat', async (req, res) => {
    const chatResponse = await axios.post('http://localhost:5000/api/chat', req.body);
    return res.status(200).json(chatResponse.data);
});

router.post("/chatbot", async (req, res) => {
    try {
        const { userId, message, sessionId, title, emotion } = req.body;
        if (!userId || !message || !sessionId) {
            return res.status(400).json({ error: "Missing required fields" });
        }

        let chat = await Chat.findOne({ sessionId, userId });
        if (!chat) {
            chat = new Chat({ sessionId, userId, messages: [] });
        }

        let session = await Session.findOne({ sessionId, userId });
        if (!session) {
            session = new Session({
                sessionId,
                userId,
                title: title || "New Chat",
                preview: message.slice(0, 50) + (message.length > 50 ? "..." : "")
            });
            await session.save();
        } else if (title && session.title === "New Chat") {
            session.title = title;
            session.preview = message.slice(0, 50) + (message.length > 50 ? "..." : "");
            session.lastUpdated = new Date();
            await session.save();
        }

        chat.messages.push({ text: message, sender: "user", timestamp: new Date() });
        await chat.save();

        const latestSummary = await Summary.findOne({ userId, sessionId }).sort({ timestamp: -1 });

        const modelPayload = {
            message,
            user_id: userId,
            sessionId: sessionId,
            emotion: emotion,
            history_summary: latestSummary ? latestSummary.summarizedHistory : ""
        };

        console.log("Sending payload to Python:", modelPayload);


        let modelResponse;
        try {
            modelResponse = await axios.post("http://localhost:5000/api/chat", modelPayload);
        } catch (modelError) {
            console.error("Model API Error:", modelError.response?.data || modelError.message);
            return res.status(500).json({ error: "Failed to process chatbot response" });
        }

        const botMessageText = modelResponse.data.response || "I'm not sure how to respond to that right now.";

        const botMessage = {
            text: botMessageText,
            sender: "bot",
            timestamp: new Date()
        };

        chat.messages.push(botMessage);
        await chat.save();


        res.json({ sessionId, response: botMessage.text });


        if (modelResponse.data.summarized_history) {
            saveSummarizedHistory(userId, sessionId, modelResponse.data.summarized_history, botMessage.text)
                .catch(err => console.error("Error saving summary:", err));
        }

    } catch (error) {
        console.error("Chat API Error:", error.message || error);
        res.status(500).json({ error: "Failed to process chat" });
    }
});


async function saveSummarizedHistory(userId, sessionId, summarizedHistory, botResponse) {
    const summaryDoc = new Summary({
        userId,
        sessionId,
        summarizedHistory,
        botResponse,
        timestamp: new Date(),
    });
    await summaryDoc.save();
}

router.post("/chatreport", async (req, res) => {
    console.log("chatreport endpoint hit");

    try {
        const { userId, sessionId, summary } = req.body;


        const response = await axios.post("https://apparent-wolf-obviously.ngrok-free.app/api/chatreport", {
            userId,
            sessionId,
            summary
        });

        console.log("Response from Python:", response.data);


        res.status(200).json(response.data);

    } catch (error) {
        console.error("Error in chatreport:", error.message);
        res.status(500).json({ error: "Failed to process chat report" });
    }
});

router.get("/sessions", async (req, res) => {
    try {
        const { userId } = req.query;

        if (!userId) {
            return res.status(400).json({ error: "User ID is required" });
        }

        const sessions = await Session.find({ userId }).sort({ lastUpdated: -1 }).lean();
        res.json(sessions);
    } catch (error) {
        console.error("Error fetching sessions:", error);
        res.status(500).json({ error: "Failed to fetch sessions" });
    }
});

router.get("/chat/:sessionId", async (req, res) => {
    try {
        const { sessionId } = req.params;
        const { userId } = req.query;

        if (!userId) {
            return res.status(400).json({ error: "User ID is required" });
        }

        const chat = await Chat.findOne({ sessionId, userId }).lean();
        res.json(chat || { messages: [] });
    } catch (error) {
        console.error("Error fetching chat:", error);
        res.status(500).json({ error: "Failed to fetch chat" });
    }
});

router.delete("/chat/:sessionId", async (req, res) => {
    try {
        const { sessionId } = req.params;
        const { userId } = req.body;

        if (!userId) {
            return res.status(400).json({ error: "User ID is required" });
        }

        await Session.deleteOne({ sessionId, userId });
        await Chat.deleteOne({ sessionId, userId });

        res.json({ success: true, message: "Chat deleted successfully" });
    } catch (error) {
        console.error("Error deleting chat:", error);
        res.status(500).json({ error: "Failed to delete chat" });
    }
});

router.post("/saveSummary", async (req, res) => {
    const { userId, sessionId, summarizedHistory, botResponse } = req.body;

    if (!userId || !sessionId || !summarizedHistory || !botResponse) {
        return res.status(400).json({ error: "Missing required fields" });
    }

    try {
        const summaryDoc = new Summary({
            userId,
            sessionId,
            summarizedHistory,
            botResponse,
            timestamp: new Date()
        });

        await summaryDoc.save();
        res.status(200).json({ message: "Summary saved successfully" });
    } catch (err) {
        console.error("DB save error:", err);
        res.status(500).json({ error: "Failed to save summary" });
    }
});

router.get("/active-days", async (req, res) => {
    try {
        const userEmail = req.query.userId; // Extract user email

        console.log("🔍 Received userId:", userEmail); // Debugging

        if (!userEmail) {
            return res.status(400).json({ error: "User email is required" });
        }

        // Find sessions based on email
        const sessions = await Session.find({ userId: userEmail }).select("createdAt");

        if (!sessions.length) {
            return res.json({ activeDays: [], totalDays: 0 });
        }

        // Extract unique days
        const activeDaysSet = new Set(
            sessions.map((session) => session.createdAt.toISOString().split("T")[0])
        );

        return res.json({ activeDays: Array.from(activeDaysSet), totalDays: activeDaysSet.size });
    } catch (error) {
        console.error("❌ Error fetching active days:", error);
        res.status(500).json({ error: "Server error" });
    }
});


module.exports = router;
