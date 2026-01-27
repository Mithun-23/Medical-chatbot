const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const axios = require('axios');
const app = express();
const port = 5000;

require('dotenv').config();
const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const client = require('twilio')(accountSid, authToken);

// Middleware setup
app.use(cors());
app.use(bodyParser.json());

// Endpoint to receive sleep data and forward to Python backend
app.post('/send-sleep-data', async (req, res) => {
    const sleepData = req.body.sleepData;

    console.log('Received sleep data:', sleepData);

    try {
        // Send data to Python backend
        const response = await axios.post('http://127.0.0.1:5000/api/sleepdata', {
            message: JSON.stringify(sleepData)  // Send sleep data as a message
        });

        console.log('Response from Python backend:', response.data);

        // Send WhatsApp message using Twilio
        client.messages
            .create({
                from: 'whatsapp:+14155238886',
                body: `Response from Python:  ${JSON.stringify(response.data, null, 2)}`,
                to: 'whatsapp:+919597965746'
            })
            .then(() => {
                console.log('Message sent!');
                res.sendStatus(200);
            })
            .catch((error) => {
                console.error('Error sending message:', error);
                res.sendStatus(500);
            });

    } catch (error) {
        console.error('Error forwarding to Python backend:', error);
        res.sendStatus(500);
    }
});

app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});
