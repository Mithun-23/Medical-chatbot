const express = require('express');
const cors = require('cors');
const axios = require('axios');

const app = express();
app.use(cors({
  origin: 'http://localhost:5173'
}));

// OR to allow all origins during development (not recommended for prod)
app.use(cors());

// Current emotion state
let currentEmotion = 'Neutral';

// Function to poll the Python server for emotion updates
async function pollPythonServer() {
  try {
    const response = await axios.get('http://localhost:3000/emotion');
    if (response.data && response.data.emotion) {
      console.log('Received emotion from Python:', response.data.emotion);
      currentEmotion = response.data.emotion;
    }
  } catch (error) {
    console.error('Error polling Python server:', error.message);
  }
}

// Poll the Python server every 500ms
setInterval(pollPythonServer, 500);

// REST endpoint for the frontend to get emotion data
app.get('/emotion', (req, res) => {
  res.json({ emotion: currentEmotion });
});

// Start the server
const PORT = 4000;
app.listen(PORT, () => {
  console.log(`Emotion relay server running on port ${PORT}`);
  console.log(`Polling Python server at http://localhost:3000/emotion`);
});