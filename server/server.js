const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bodyParser = require('body-parser');
const admin = require('firebase-admin');
// Import Routes
const chatRoutes = require('./routes/chatRoutes');
const SaveSummary= require('./routes/saveSummary');
const Report = require('./routes/report');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(bodyParser.json());
app.use(express.json());

// Protected Routes (Require Authentication)
app.use('/chat', chatRoutes);
app.use('/api', SaveSummary);
app.use('/api',chatRoutes);

// Initialize Firebase Admin
const serviceAccount = require('./service-account.json'); // Update the path
admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
});

// Middleware for Firebase Authentication (Now Fetches Email)
const verifyToken = async (req, res, next) => {
    const token = req.headers.authorization?.split(" ")[1]; // Extract Bearer token

    if (!token) {
        return res.status(401).json({ error: "Unauthorized: No token provided" });
    }

    try {
        const decodedToken = await admin.auth().verifyIdToken(token);
        const userId = decodedToken.uid;

        // Fetch user details from Firebase
        const userRecord = await admin.auth().getUser(userId);
        const userEmail = userRecord.email; // Get the email

        req.userId = userId; // Attach user ID to request
        req.userEmail = userEmail; // Attach email to request

        next();
    } catch (error) {
        console.error("❌ Token verification failed:", error);
        return res.status(403).json({ error: "Forbidden: Invalid token" });
    }
};

app.use('/api', chatRoutes);
app.use('/api',SaveSummary);
app.use('/api',Report);


mongoose.connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true
})
.then(() => console.log('✅ MongoDB connected'))
.catch(err => {
    console.error('❌ MongoDB connection error:', err);
    process.exit(1);
});

app.use((err, req, res, next) => {
    console.error("❌ Error:", err.stack);
    res.status(500).json({
        error: "Server error",
        message: process.env.NODE_ENV === 'development' ? err.message : 'An unexpected error occurred'
    });
});


const PORT = process.env.PORT || 8000;
const server = app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));

// <<<<<<< Updated upstream

// process.on('SIGINT', () => {
//   mongoose.connection.close(() => {
//     console.log('MongoDB connection closed');
//     process.exit(0);
//   });
// });
// const gracefulShutdown = () => {
//     console.log("\n🔴 Shutting down server...");
//     mongoose.connection.close(() => {
//         console.log('🔗 MongoDB connection closed');
//         server.close(() => {
//             console.log("✅ Server shutdown complete");
//             process.exit(0);
//         });
//     });
// };

// process.on('SIGINT', gracefulShutdown);
// process.on('SIGTERM', gracefulShutdown);
// >>>>>>> Stashed changes
