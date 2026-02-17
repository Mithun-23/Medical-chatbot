import React, { useState, useEffect, useContext, useRef, useCallback } from "react";
import { RiMic2Line, RiStopCircleLine, RiSendPlane2Fill } from "react-icons/ri";
import { FiVideo, FiVideoOff, FiVolume2 } from "react-icons/fi";
import { ThemeContext } from "./ThemeContext";
import axios from "axios";
import { io } from 'socket.io-client';

const PYTHON_SERVER_URL = 'http://localhost:5000';
const NODE_SERVER_URL = 'http://localhost:8000';

// Simple AI Avatar Component
const AIAvatar = ({ isSpeaking, isListening, size = 280 }) => {
  const [mouthFrame, setMouthFrame] = useState(0);
  const [blinkState, setBlinkState] = useState(false);

  useEffect(() => {
    if (!isSpeaking) {
      setMouthFrame(0);
      return;
    }
    const interval = setInterval(() => {
      setMouthFrame(prev => (prev + 1) % 4);
    }, 120);
    return () => clearInterval(interval);
  }, [isSpeaking]);

  useEffect(() => {
    const blinkInterval = setInterval(() => {
      setBlinkState(true);
      setTimeout(() => setBlinkState(false), 150);
    }, 3000 + Math.random() * 2000);
    return () => clearInterval(blinkInterval);
  }, []);

  const accentColor = isSpeaking ? '#10b981' : isListening ? '#ef4444' : '#6366f1';

  return (
    <div className="relative flex flex-col items-center" style={{ width: size, height: size + 50 }}>
      {/* Glow */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div
          className={`absolute rounded-full transition-all duration-500 ${isSpeaking || isListening ? 'animate-pulse' : ''}`}
          style={{
            width: size + 40,
            height: size + 40,
            background: `radial-gradient(circle, ${accentColor}40 0%, transparent 70%)`,
          }}
        />
      </div>

      {/* Avatar */}
      <div
        className="relative rounded-full overflow-hidden shadow-2xl bg-gradient-to-br from-blue-500 to-purple-600 transition-transform duration-300"
        style={{
          width: size,
          height: size,
          transform: isSpeaking ? 'scale(1.03)' : 'scale(1)',
          boxShadow: `0 0 40px ${accentColor}50`,
        }}
      >
        <svg viewBox="0 0 100 100" className="absolute inset-0 w-full h-full">
          {/* Hair */}
          <ellipse cx="50" cy="25" rx="42" ry="20" fill="#2d1f3d" />
          <ellipse cx="50" cy="35" rx="45" ry="25" fill="#3d2b52" />

          {/* Face */}
          <ellipse cx="50" cy="52" rx="32" ry="36" fill="#fce7d6" />
          <ellipse cx="50" cy="55" rx="30" ry="33" fill="#fdd8c4" />

          {/* Blush */}
          <ellipse cx="30" cy="55" rx="8" ry="4" fill="#ffb8b8" opacity="0.5" />
          <ellipse cx="70" cy="55" rx="8" ry="4" fill="#ffb8b8" opacity="0.5" />

          {/* Eyes */}
          <ellipse cx="38" cy="48" rx="7" ry={blinkState ? 1 : 8} fill="white" />
          <ellipse cx="38" cy={blinkState ? 48 : 49} rx="5" ry={blinkState ? 0.5 : 6} fill="#4a3366" />
          {!blinkState && <ellipse cx="40" cy="47" rx="1.5" ry="1.5" fill="white" />}

          <ellipse cx="62" cy="48" rx="7" ry={blinkState ? 1 : 8} fill="white" />
          <ellipse cx="62" cy={blinkState ? 48 : 49} rx="5" ry={blinkState ? 0.5 : 6} fill="#4a3366" />
          {!blinkState && <ellipse cx="64" cy="47" rx="1.5" ry="1.5" fill="white" />}

          {/* Eyebrows */}
          <path d="M 30 40 Q 38 37 46 40" stroke="#3d2b52" strokeWidth="1.5" fill="none" />
          <path d="M 54 40 Q 62 37 70 40" stroke="#3d2b52" strokeWidth="1.5" fill="none" />

          {/* Mouth */}
          {isSpeaking ? (
            <ellipse cx="50" cy="70" rx={[6, 8, 4, 7][mouthFrame]} ry={[4, 6, 2, 5][mouthFrame]} fill="#d35d6e" />
          ) : (
            <path d="M 42 68 Q 50 74 58 68" stroke="#d35d6e" strokeWidth="2" fill="none" strokeLinecap="round" />
          )}

          {/* Hair strands */}
          <path d="M 15 30 Q 20 45 22 55" stroke="#3d2b52" strokeWidth="6" fill="none" />
          <path d="M 85 30 Q 80 45 78 55" stroke="#3d2b52" strokeWidth="6" fill="none" />
          <path d="M 30 15 Q 50 5 70 15" stroke="#3d2b52" strokeWidth="8" fill="none" strokeLinecap="round" />

          {/* Headphone */}
          <path d="M 18 45 Q 10 45 10 55 Q 10 65 18 65" stroke={accentColor} strokeWidth="3" fill="none" />
          <path d="M 82 45 Q 90 45 90 55 Q 90 65 82 65" stroke={accentColor} strokeWidth="3" fill="none" />
          <ellipse cx="15" cy="55" rx="5" ry="8" fill={accentColor} />
          <ellipse cx="85" cy="55" rx="5" ry="8" fill={accentColor} />
          <path d="M 15 35 Q 15 15 50 12 Q 85 15 85 35" stroke={accentColor} strokeWidth="4" fill="none" />
        </svg>
        <div className="absolute top-4 left-6 w-1/4 h-1/6 rounded-full bg-white/20 blur-sm" />
      </div>

      {/* Status */}
      <div
        className="mt-4 px-5 py-2 rounded-full text-sm font-semibold shadow-lg"
        style={{
          background: `${accentColor}20`,
          color: accentColor,
          border: `1px solid ${accentColor}50`,
        }}
      >
        {isSpeaking ? '🎙️ Dr. Aria is speaking...' : isListening ? '👂 Listening...' : 'Hi, I\'m Dr. Aria!'}
      </div>
    </div>
  );
};

// Chat Bubble
const ChatBubble = ({ text, isUser, isDarkMode }) => (
  <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} w-full mb-3`}>
    <div className={`max-w-xs px-4 py-3 rounded-2xl shadow-lg ${isUser
      ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-br-sm'
      : isDarkMode ? 'bg-gray-700 text-gray-100 rounded-bl-sm' : 'bg-white text-gray-800 rounded-bl-sm border border-gray-200'
      }`}>
      <p className="text-sm">{text}</p>
    </div>
  </div>
);

export default function Voice() {
  const { isDarkMode } = useContext(ThemeContext);
  const [status, setStatus] = useState('idle'); // idle, listening, processing, speaking
  const [error, setError] = useState(null);
  const [messages, setMessages] = useState([]);
  const [textInput, setTextInput] = useState('');
  const [currentTranscript, setCurrentTranscript] = useState('');

  // Video state
  const [isVideoOn, setIsVideoOn] = useState(false);
  const [emotion, setEmotion] = useState('Neutral');
  const [hasFace, setHasFace] = useState(false);
  const [socketConnected, setSocketConnected] = useState(false);

  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const canvasRef = useRef(null);
  const socketRef = useRef(null);
  const frameLoopRef = useRef(null);
  const recognitionRef = useRef(null);
  const messagesEndRef = useRef(null);

  const sessionId = useRef(`voice-${Date.now()}`).current;
  const userId = localStorage.getItem('Email') || 'guest';

  // Scroll to bottom of messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Initialize Socket.IO
  useEffect(() => {
    console.log('Connecting to socket...');
    const socket = io(PYTHON_SERVER_URL, {
      transports: ['polling', 'websocket'],
      reconnection: true,
      timeout: 10000,
    });

    socket.on('connect', () => {
      console.log('✅ Socket connected!', socket.id);
      setSocketConnected(true);
    });

    socket.on('disconnect', () => {
      console.log('❌ Socket disconnected');
      setSocketConnected(false);
    });

    socket.on('connect_error', (err) => {
      console.error('Socket error:', err);
      setSocketConnected(false);
    });

    socket.on('emotion_update', (data) => {
      console.log('Emotion update:', data);
      if (data.emotion) setEmotion(data.emotion);
      if (data.face_detected !== undefined) setHasFace(data.face_detected);
    });

    socketRef.current = socket;

    return () => {
      socket.disconnect();
    };
  }, []);

  // Capture and send video frames
  const sendFrame = useCallback(() => {
    if (!videoRef.current || !canvasRef.current || !socketRef.current?.connected) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;

    if (video.readyState < 2) return; // Video not ready

    canvas.width = 320;
    canvas.height = 240;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(video, 0, 0, 320, 240);

    const frameData = canvas.toDataURL('image/jpeg', 0.6);
    socketRef.current.emit('video_frame', { frame: frameData });
  }, []);

  // Start video
  const startVideo = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 320, height: 240, facingMode: 'user' },
        audio: false
      });

      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }

      if (!canvasRef.current) {
        canvasRef.current = document.createElement('canvas');
      }

      // Start sending frames
      frameLoopRef.current = setInterval(sendFrame, 100);
      setIsVideoOn(true);
      setError(null);
      console.log('Camera started');
    } catch (err) {
      console.error('Camera error:', err);
      setError('Camera permission denied');
    }
  };

  // Stop video
  const stopVideo = () => {
    if (frameLoopRef.current) {
      clearInterval(frameLoopRef.current);
      frameLoopRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setIsVideoOn(false);
    setHasFace(false);
  };

  // Send message to API
  const sendMessage = async (text) => {
    if (!text.trim()) return;

    setStatus('processing');
    setMessages(prev => [...prev, { text, isUser: true }]);
    setCurrentTranscript('');

    try {
      const response = await axios.post(`${NODE_SERVER_URL}/api/chat`, {
        userId,
        message: text,
        sessionId,
        emotion: hasFace ? emotion : 'Neutral'
      });

      const aiText = response.data.response;
      setMessages(prev => [...prev, { text: aiText, isUser: false }]);
      speakText(aiText);
    } catch (err) {
      console.error('API error:', err);
      setError('Failed to get response. Check if server is running.');
      setStatus('idle');
    }
  };

  // Speak text using Web Speech API
  const speakText = (text) => {
    if (!window.speechSynthesis) {
      setError('Speech not supported');
      setStatus('idle');
      return;
    }

    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);

    // Try to get a nice voice
    const voices = window.speechSynthesis.getVoices();
    const preferredVoice = voices.find(v => v.name.includes('Samantha') || v.name.includes('Female'))
      || voices.find(v => v.lang.includes('en'))
      || voices[0];

    if (preferredVoice) utterance.voice = preferredVoice;
    utterance.rate = 0.95;
    utterance.pitch = 1.1;

    utterance.onstart = () => setStatus('speaking');
    utterance.onend = () => setStatus('idle');
    utterance.onerror = () => setStatus('idle');

    setStatus('speaking');
    window.speechSynthesis.speak(utterance);
  };

  // Start speech recognition
  const startListening = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setError('Speech recognition not supported. Use text input.');
      return;
    }

    // Cancel any ongoing speech
    window.speechSynthesis.cancel();
    if (recognitionRef.current) {
      try { recognitionRef.current.abort(); } catch (e) { }
    }

    const recognition = new SpeechRecognition();
    recognition.lang = 'en-US'; // Changed from en-IN to en-US for better compatibility
    recognition.continuous = false;
    recognition.interimResults = true;

    recognition.onstart = () => {
      setStatus('listening');
      setError(null);
      setCurrentTranscript('');
    };

    recognition.onresult = (event) => {
      let final = '', interim = '';
      for (let i = event.resultIndex; i < event.results.length; i++) {
        if (event.results[i].isFinal) {
          final += event.results[i][0].transcript;
        } else {
          interim += event.results[i][0].transcript;
        }
      }
      setCurrentTranscript(final || interim);
      if (final) {
        sendMessage(final.trim());
      }
    };

    recognition.onerror = (event) => {
      console.error('Speech error:', event.error);
      if (event.error === 'network') {
        setError('Connection error. Please check your internet or try using Chrome.');
      } else if (event.error === 'not-allowed') {
        setError('Microphone access denied. Please allow permission.');
      } else if (event.error === 'no-speech') {
        // Ignore no-speech errors (common when silence)
        return;
      } else if (event.error !== 'aborted') {
        setError(`Voice error: ${event.error}`);
      }
      setStatus('idle');
    };

    recognition.onend = () => {
      if (status === 'listening') setStatus('idle');
    };

    recognitionRef.current = recognition;
    try {
      recognition.start();
    } catch (e) {
      setError('Could not start voice. Use text input.');
      setStatus('idle');
    }
  };

  // Stop everything
  const stopAll = () => {
    window.speechSynthesis.cancel();
    if (recognitionRef.current) {
      try { recognitionRef.current.abort(); } catch (e) { }
    }
    setStatus('idle');
  };

  // Handle mic click
  const handleMicClick = () => {
    if (status === 'idle') {
      startListening();
    } else {
      stopAll();
    }
  };

  // Handle text submit
  const handleTextSubmit = () => {
    if (textInput.trim() && status === 'idle') {
      sendMessage(textInput.trim());
      setTextInput('');
    }
  };

  // Cleanup
  useEffect(() => {
    return () => {
      stopVideo();
      stopAll();
    };
  }, []);

  return (
    <div className={`min-h-screen flex ${isDarkMode ? 'bg-gradient-to-br from-gray-900 via-purple-900/20 to-gray-900' : 'bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50'}`}>

      {/* Left Panel - Camera & Controls */}
      <div className="w-80 flex flex-col items-center p-6 border-r border-gray-500/20">
        {/* Camera */}
        <div className={`rounded-2xl overflow-hidden shadow-xl ${isDarkMode ? 'bg-gray-800' : 'bg-white'} mb-4`}>
          <div className="relative w-64 h-48">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className={`w-full h-full object-cover ${isVideoOn ? '' : 'hidden'}`}
              style={{ transform: 'scaleX(-1)' }}
            />
            {!isVideoOn && (
              <div className="w-full h-full flex flex-col items-center justify-center">
                <FiVideoOff size={36} className={isDarkMode ? 'text-gray-600' : 'text-gray-400'} />
                <p className={`text-sm mt-2 ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}>Camera off</p>
              </div>
            )}
            {isVideoOn && (
              <div className={`absolute bottom-2 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full text-xs font-medium ${isDarkMode ? 'bg-gray-900/80 text-white' : 'bg-white/90 text-gray-800'}`}>
                {hasFace ? `😊 ${emotion}` : '👤 No face detected'}
              </div>
            )}
          </div>
        </div>

        {/* Camera Toggle */}
        <button
          onClick={() => isVideoOn ? stopVideo() : startVideo()}
          className={`px-4 py-2 rounded-xl font-medium flex items-center gap-2 mb-6 transition-all ${isVideoOn ? 'bg-green-500 text-white' : isDarkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-200 text-gray-700'
            }`}
        >
          {isVideoOn ? <FiVideo size={18} /> : <FiVideoOff size={18} />}
          {isVideoOn ? 'Camera On' : 'Enable Camera'}
        </button>

        {/* Socket Status */}
        <div className={`text-xs mb-4 ${socketConnected ? 'text-green-500' : 'text-red-500'}`}>
          {socketConnected ? '● Connected to emotion server' : '○ Connecting...'}
        </div>

        {/* Mic Button */}
        <button
          onClick={handleMicClick}
          disabled={status === 'processing' || status === 'speaking'}
          className={`w-20 h-20 rounded-full flex items-center justify-center shadow-xl transition-all text-white ${status === 'listening' ? 'bg-red-500 animate-pulse' :
            status === 'processing' ? 'bg-yellow-500' :
              status === 'speaking' ? 'bg-green-500' :
                'bg-gradient-to-r from-blue-500 to-purple-600 hover:scale-105'
            }`}
        >
          {status !== 'idle' ? <RiStopCircleLine size={40} /> : <RiMic2Line size={40} />}
        </button>

        <p className={`mt-3 text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
          {status === 'listening' ? 'Listening...' :
            status === 'processing' ? 'Thinking...' :
              status === 'speaking' ? 'Speaking...' : 'Tap to speak'}
        </p>

        {currentTranscript && status === 'listening' && (
          <p className={`mt-2 text-xs italic ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}>
            "{currentTranscript}"
          </p>
        )}

        {error && (
          <div className="mt-4 p-3 rounded-xl bg-red-500/10 text-red-500 text-xs text-center max-w-full">
            {error}
          </div>
        )}

        {/* Text Input */}
        <div className="mt-6 w-full">
          <div className="flex gap-2">
            <input
              type="text"
              value={textInput}
              onChange={(e) => setTextInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleTextSubmit()}
              placeholder="Type message..."
              disabled={status !== 'idle'}
              className={`flex-1 px-3 py-2 rounded-xl text-sm ${isDarkMode ? 'bg-gray-700 text-white border-gray-600' : 'bg-white text-gray-800 border-gray-300'
                } border focus:border-purple-500 outline-none`}
            />
            <button
              onClick={handleTextSubmit}
              disabled={!textInput.trim() || status !== 'idle'}
              className={`p-2 rounded-xl ${textInput.trim() && status === 'idle'
                ? 'bg-purple-600 text-white'
                : isDarkMode ? 'bg-gray-700 text-gray-500' : 'bg-gray-200 text-gray-400'
                }`}
            >
              <RiSendPlane2Fill size={20} />
            </button>
          </div>
        </div>
      </div>

      {/* Center - AI Avatar */}
      <div className="flex-1 flex flex-col items-center justify-center">
        <AIAvatar
          isSpeaking={status === 'speaking'}
          isListening={status === 'listening'}
          size={280}
        />
      </div>

      {/* Right Panel - Conversation */}
      <div className={`w-96 flex flex-col p-6 border-l ${isDarkMode ? 'border-gray-700/50' : 'border-gray-200'}`}>
        <h3 className={`text-lg font-bold mb-4 flex items-center gap-2 ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>
          <FiVolume2 className="text-purple-500" />
          Conversation
        </h3>

        <div className="flex-1 overflow-y-auto space-y-2 pr-2" style={{ maxHeight: 'calc(100vh - 150px)' }}>
          {messages.length === 0 ? (
            <div className={`text-center py-12 ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}>
              <p className="text-4xl mb-3">💬</p>
              <p className="text-sm">Start talking to Dr. Aria!</p>
              <p className="text-xs mt-1">Use the mic or type below</p>
            </div>
          ) : (
            messages.map((msg, i) => (
              <ChatBubble key={i} text={msg.text} isUser={msg.isUser} isDarkMode={isDarkMode} />
            ))
          )}

          {status === 'processing' && (
            <div className="flex justify-start">
              <div className={`px-4 py-3 rounded-2xl ${isDarkMode ? 'bg-gray-700' : 'bg-white border'}`}>
                <div className="flex gap-1">
                  <span className="w-2 h-2 bg-purple-500 rounded-full animate-bounce" />
                  <span className="w-2 h-2 bg-purple-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} />
                  <span className="w-2 h-2 bg-purple-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </div>
    </div>
  );
}
