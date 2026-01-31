const express = require("express");
const axios = require("axios");
const Chat = require("../models/chat");
const Session = require("../models/session");
const Summary = require("../models/SummarizedHistory");
const CheckIn = require("../models/CheckIn");
const ArchivedChat = require("../models/ArchivedChat");
const MedicalProfile = require("../models/MedicalProfile");

const router = express.Router();

router.post('/chat', async (req, res) => {
    try {
        const { userId, fitnessContext } = req.body;

        // Fetch user's health context from medical profile
        let healthContext = "";
        if (userId) {
            const profile = await MedicalProfile.findOne({ userId });
            if (profile) {
                let contextParts = [];
                if (profile.healthConditions?.length > 0) {
                    contextParts.push(`Health conditions: ${profile.healthConditions.map(c => c.condition).join(", ")}`);
                }
                if (profile.medications?.length > 0) {
                    contextParts.push(`Medications: ${profile.medications.map(m => m.name).join(", ")}`);
                }
                if (profile.allergies?.length > 0) {
                    contextParts.push(`Allergies: ${profile.allergies.join(", ")}`);
                }
                healthContext = contextParts.join(". ");
            }
        }

        // Combine medical profile with fitness data from Fitbit
        let fullHealthContext = healthContext || "No medical profile available";
        if (fitnessContext) {
            fullHealthContext += `. Fitness data: ${fitnessContext}`;
        }

        // Pass to Python chatbot with comprehensive health context
        const chatResponse = await axios.post('http://localhost:5000/api/chat', {
            ...req.body,
            healthContext: fullHealthContext
        });
        return res.status(200).json(chatResponse.data);
    } catch (error) {
        console.error("Chat error:", error);
        return res.status(500).json({ error: "Chat failed" });
    }
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

// Clear chat - archives messages for chatbot context but removes visible messages
router.post("/chat/clear", async (req, res) => {
    try {
        const { userId, sessionId } = req.body;

        if (!userId || !sessionId) {
            return res.status(400).json({ error: "User ID and Session ID are required" });
        }

        // Find the current chat to archive
        const chat = await Chat.findOne({ sessionId, userId });

        if (chat && chat.messages && chat.messages.length > 0) {
            // Archive the chat messages before clearing
            const archivedChat = new ArchivedChat({
                sessionId,
                userId,
                messages: chat.messages,
                archivedAt: new Date(),
                originalCreatedAt: chat.messages[0]?.timestamp || new Date()
            });
            await archivedChat.save();
            console.log(`✅ Archived ${chat.messages.length} messages for user ${userId}`);
        }

        // Clear the visible messages (but keep the session)
        await Chat.updateOne(
            { sessionId, userId },
            { $set: { messages: [] } }
        );

        res.json({
            success: true,
            message: "Chat cleared successfully. Chatbot memory retained."
        });
    } catch (error) {
        console.error("❌ Error clearing chat:", error);
        res.status(500).json({ error: "Failed to clear chat" });
    }
});

// Get archived chats for chatbot context
router.get("/chat/archived", async (req, res) => {
    try {
        const { userId } = req.query;

        if (!userId) {
            return res.status(400).json({ error: "User ID is required" });
        }

        const archivedChats = await ArchivedChat.find({ userId })
            .sort({ archivedAt: -1 })
            .limit(10);

        res.json(archivedChats);
    } catch (error) {
        console.error("Error fetching archived chats:", error);
        res.status(500).json({ error: "Failed to fetch archived chats" });
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

// Record a daily check-in for a user
router.post("/checkin", async (req, res) => {
    try {
        const { userId } = req.body;

        if (!userId) {
            return res.status(400).json({ error: "User ID is required" });
        }

        // Normalize today's date to midnight
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        // Try to create a check-in (will fail if already exists due to unique index)
        try {
            const checkIn = new CheckIn({
                userId,
                checkInDate: today
            });
            await checkIn.save();
            console.log(`✅ Check-in recorded for ${userId} on ${today.toISOString()}`);
            return res.status(201).json({
                message: "Check-in recorded successfully",
                checkInDate: today,
                isNewCheckIn: true
            });
        } catch (duplicateError) {
            if (duplicateError.code === 11000) {
                // Already checked in today
                return res.status(200).json({
                    message: "Already checked in today",
                    checkInDate: today,
                    isNewCheckIn: false
                });
            }
            throw duplicateError;
        }
    } catch (error) {
        console.error("❌ Error recording check-in:", error);
        res.status(500).json({ error: "Failed to record check-in" });
    }
});

// Get check-ins for a user with streak calculation
router.get("/checkins", async (req, res) => {
    try {
        const { userId, month, year } = req.query;

        if (!userId) {
            return res.status(400).json({ error: "User ID is required" });
        }

        const currentDate = new Date();
        const targetMonth = month ? parseInt(month) : currentDate.getMonth();
        const targetYear = year ? parseInt(year) : currentDate.getFullYear();

        // Get start and end of the target month
        const startOfMonth = new Date(targetYear, targetMonth, 1);
        const endOfMonth = new Date(targetYear, targetMonth + 1, 0, 23, 59, 59, 999);

        // Fetch check-ins for the target month
        const checkIns = await CheckIn.find({
            userId,
            checkInDate: { $gte: startOfMonth, $lte: endOfMonth }
        }).sort({ checkInDate: 1 });

        const checkInDates = checkIns.map(c => c.checkInDate.toISOString().split('T')[0]);

        // Calculate current streak (consecutive days ending today or yesterday)
        const allCheckIns = await CheckIn.find({ userId }).sort({ checkInDate: -1 });

        let currentStreak = 0;
        let longestStreak = 0;
        let tempStreak = 0;

        if (allCheckIns.length > 0) {
            const today = new Date();
            today.setHours(0, 0, 0, 0);

            const yesterday = new Date(today);
            yesterday.setDate(yesterday.getDate() - 1);

            const lastCheckIn = new Date(allCheckIns[0].checkInDate);
            lastCheckIn.setHours(0, 0, 0, 0);

            // Check if streak is still active (last check-in was today or yesterday)
            const isStreakActive = lastCheckIn.getTime() === today.getTime() ||
                lastCheckIn.getTime() === yesterday.getTime();

            if (isStreakActive) {
                // Count consecutive days
                let expectedDate = new Date(lastCheckIn);

                for (const checkIn of allCheckIns) {
                    const checkInDate = new Date(checkIn.checkInDate);
                    checkInDate.setHours(0, 0, 0, 0);

                    if (checkInDate.getTime() === expectedDate.getTime()) {
                        currentStreak++;
                        expectedDate.setDate(expectedDate.getDate() - 1);
                    } else if (checkInDate.getTime() < expectedDate.getTime()) {
                        break;
                    }
                }
            }

            // Calculate longest streak
            const sortedAsc = [...allCheckIns].reverse();
            tempStreak = 1;
            longestStreak = 1;

            for (let i = 1; i < sortedAsc.length; i++) {
                const prevDate = new Date(sortedAsc[i - 1].checkInDate);
                const currDate = new Date(sortedAsc[i].checkInDate);
                prevDate.setHours(0, 0, 0, 0);
                currDate.setHours(0, 0, 0, 0);

                const diffDays = (currDate - prevDate) / (1000 * 60 * 60 * 24);

                if (diffDays === 1) {
                    tempStreak++;
                    longestStreak = Math.max(longestStreak, tempStreak);
                } else {
                    tempStreak = 1;
                }
            }
        }

        res.json({
            checkInDates,
            currentStreak,
            longestStreak,
            month: targetMonth,
            year: targetYear,
            daysInMonth: new Date(targetYear, targetMonth + 1, 0).getDate(),
            firstDayOfWeek: startOfMonth.getDay()
        });
    } catch (error) {
        console.error("❌ Error fetching check-ins:", error);
        res.status(500).json({ error: "Failed to fetch check-ins" });
    }
});

// ========== MEDICAL PROFILE ENDPOINTS ==========

// Get medical profile
router.get("/medical-profile", async (req, res) => {
    try {
        const { userId } = req.query;
        if (!userId) {
            return res.status(400).json({ error: "User ID is required" });
        }

        let profile = await MedicalProfile.findOne({ userId });
        if (!profile) {
            // Create empty profile if doesn't exist
            profile = new MedicalProfile({ userId });
            await profile.save();
        }

        res.json(profile);
    } catch (error) {
        console.error("Error fetching medical profile:", error);
        res.status(500).json({ error: "Failed to fetch medical profile" });
    }
});

// Update medical profile
router.post("/medical-profile", async (req, res) => {
    try {
        const { userId, healthConditions, medications, allergies, bloodType, emergencyContact, notes } = req.body;

        if (!userId) {
            return res.status(400).json({ error: "User ID is required" });
        }

        const profile = await MedicalProfile.findOneAndUpdate(
            { userId },
            {
                healthConditions,
                medications,
                allergies,
                bloodType,
                emergencyContact,
                notes,
                lastUpdated: new Date()
            },
            { upsert: true, new: true }
        );

        console.log(`✅ Medical profile updated for ${userId}`);
        res.json(profile);
    } catch (error) {
        console.error("Error updating medical profile:", error);
        res.status(500).json({ error: "Failed to update medical profile" });
    }
});

// Add health condition
router.post("/medical-profile/condition", async (req, res) => {
    try {
        const { userId, condition, severity } = req.body;

        if (!userId || !condition) {
            return res.status(400).json({ error: "User ID and condition are required" });
        }

        const profile = await MedicalProfile.findOneAndUpdate(
            { userId },
            {
                $push: {
                    healthConditions: {
                        condition,
                        severity: severity || 'moderate',
                        addedAt: new Date()
                    }
                },
                $set: { lastUpdated: new Date() }
            },
            { upsert: true, new: true }
        );

        console.log(`✅ Added condition "${condition}" for ${userId}`);
        res.json(profile);
    } catch (error) {
        console.error("Error adding condition:", error);
        res.status(500).json({ error: "Failed to add condition" });
    }
});

// Remove health condition
router.delete("/medical-profile/condition", async (req, res) => {
    try {
        const { userId, conditionId } = req.body;

        if (!userId || !conditionId) {
            return res.status(400).json({ error: "User ID and condition ID are required" });
        }

        const profile = await MedicalProfile.findOneAndUpdate(
            { userId },
            {
                $pull: { healthConditions: { _id: conditionId } },
                $set: { lastUpdated: new Date() }
            },
            { new: true }
        );

        res.json(profile);
    } catch (error) {
        console.error("Error removing condition:", error);
        res.status(500).json({ error: "Failed to remove condition" });
    }
});

// Add medication
router.post("/medical-profile/medication", async (req, res) => {
    try {
        const { userId, name, dosage } = req.body;

        if (!userId || !name) {
            return res.status(400).json({ error: "User ID and medication name are required" });
        }

        const profile = await MedicalProfile.findOneAndUpdate(
            { userId },
            {
                $push: {
                    medications: {
                        name,
                        dosage: dosage || '',
                        addedAt: new Date()
                    }
                },
                $set: { lastUpdated: new Date() }
            },
            { upsert: true, new: true }
        );

        console.log(`✅ Added medication "${name}" for ${userId}`);
        res.json(profile);
    } catch (error) {
        console.error("Error adding medication:", error);
        res.status(500).json({ error: "Failed to add medication" });
    }
});

// Remove medication
router.delete("/medical-profile/medication", async (req, res) => {
    try {
        const { userId, medicationId } = req.body;

        if (!userId || !medicationId) {
            return res.status(400).json({ error: "User ID and medication ID are required" });
        }

        const profile = await MedicalProfile.findOneAndUpdate(
            { userId },
            {
                $pull: { medications: { _id: medicationId } },
                $set: { lastUpdated: new Date() }
            },
            { new: true }
        );

        console.log(`✅ Removed medication ${medicationId} for ${userId}`);
        res.json(profile);
    } catch (error) {
        console.error("Error removing medication:", error);
        res.status(500).json({ error: "Failed to remove medication" });
    }
});

// Get health context for chatbot (simplified format)
router.get("/medical-profile/context", async (req, res) => {
    try {
        const { userId } = req.query;
        if (!userId) {
            return res.status(400).json({ error: "User ID is required" });
        }

        const profile = await MedicalProfile.findOne({ userId });
        if (!profile) {
            return res.json({ context: "" });
        }

        // Build context string for chatbot
        let contextParts = [];

        if (profile.healthConditions && profile.healthConditions.length > 0) {
            const conditions = profile.healthConditions.map(c => c.condition).join(", ");
            contextParts.push(`Health conditions: ${conditions}`);
        }

        if (profile.medications && profile.medications.length > 0) {
            const meds = profile.medications.map(m => `${m.name} (${m.dosage})`).join(", ");
            contextParts.push(`Current medications: ${meds}`);
        }

        if (profile.allergies && profile.allergies.length > 0) {
            contextParts.push(`Allergies: ${profile.allergies.join(", ")}`);
        }

        if (profile.notes) {
            contextParts.push(`Additional notes: ${profile.notes}`);
        }

        res.json({
            context: contextParts.join(". "),
            profile: profile
        });
    } catch (error) {
        console.error("Error getting health context:", error);
        res.status(500).json({ error: "Failed to get health context" });
    }
});


module.exports = router;

