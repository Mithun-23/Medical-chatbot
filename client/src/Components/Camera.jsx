import React, { useEffect, useState } from 'react';

const VideoFeed = () => {
  const [emotion, setEmotion] = useState('Neutral');

  useEffect(() => {
    // Fetch emotion data every second
    const interval = setInterval(async () => {
      try {
        const response = await fetch('https://apparent-wolf-obviously.ngrok-free.app/emotion');
        const data = await response.json();
        setEmotion(data.emotion);
      } catch (err) {
        console.error('Failed to fetch emotion:', err);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div style={{ textAlign: 'center' }}>
      <h2>Live Video Feed</h2>
      <img
        src="https://apparent-wolf-obviously.ngrok-free.app/video_feed"
        alt="Video Feed"
        style={{ border: '2px solid black', width: '500px', height: '400px' }}
      />
      <h3>Detected Emotion: <strong>{emotion}</strong></h3>
    </div>
  );
};

export default VideoFeed;
