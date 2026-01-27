const express = require('express');
const router = express.Router();
const axios = require('axios');
const mongoose = require('mongoose');
const ChatReport = require('../models/chatReport');

router.post('/analyze', async (req, res) => {
    const { userId, sessionId, messages } = req.body;
    console.log(req.body);
    if (!sessionId || !userId || !messages || !Array.isArray(messages) || messages.length === 0) {
        return res.status(400).json({ 
            success: false, 
            error: 'Session ID, User ID, and valid messages are required' 
        });
    }

    try {
        const response = await axios.post('https://apparent-wolf-obviously.ngrok-free.app/api/chatreport', { messages });
     
        const result = response.data;

        if (result.status === 'processed') {
            try {
                await ChatReport.deleteMany({ sessionId });

                const reportData = {
                    userId,
                    sessionId,
                    timestamp: new Date(),
                    messageCount: result.message_count,
                    sentiment: result.analysis.sentiment,
                    summary: result.analysis.summary,
                    positiveCount: result.analysis.positive_count || 0,
                    negativeCount: result.analysis.negative_count || 0,
                    neutralCount: result.analysis.neutral_count || 0
                };

                const chatReport = new ChatReport(reportData);
                await chatReport.save();

                res.status(200).json({ success: true, chatReport });
            } catch (dbError) {
                console.error('Database error:', dbError);
                res.status(500).json({ success: false, error: 'Failed to save chat report' });
            }
        } else {
            res.status(500).json({
                success: false,
                error: 'Error in analysis',
                details: result
            });
        }
    } catch (error) {
        console.error('Error during analysis:', error.message || error);
        res.status(500).json({ 
            success: false, 
            error: 'Analysis service error',
            details: error.response?.data || error.message
        });
    }
});

module.exports = router;
