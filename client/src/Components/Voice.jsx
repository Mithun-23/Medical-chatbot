import React, { useState, useEffect, useContext, useRef, useCallback } from "react";
import { RiMic2Line, RiStopCircleLine } from "react-icons/ri";
import { FiVideo, FiVideoOff } from "react-icons/fi";
import { ThemeContext } from "./ThemeContext";
import { axiosClient } from "../axios";
import { io } from 'socket.io-client';
import TalkingAvatar from './TalkingAvatar';

const PYTHON_SERVER_URL = 'http://localhost:5000';

export default function Voice() {
  const { isDarkMode } = useContext(ThemeContext);
  const [error, setError] = useState(null);
  const [status, setStatus] = useState('idle'); // 'idle' | 'listening' | 'processing' | 'speaking'
  const [transcript, setTranscript] = useState('');
  const [voiceSessionId, setVoiceSessionId] = useState(() => {
    // Get existing session or create new one
    const stored = localStorage.getItem('voiceSessionId');
    if (stored) return stored;
    const newId = `voice-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    localStorage.setItem('voiceSessionId', newId);
    return newId;
  });
  const [messageCount, setMessageCount] = useState(0);

  // Video & emotion state
  const [isVideoEnabled, setIsVideoEnabled] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [currentEmotion, setCurrentEmotion] = useState('Neutral');
  const [faceDetected, setFaceDetected] = useState(false);

  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const canvasRef = useRef(null);
  const socketRef = useRef(null);
  const frameIntervalRef = useRef(null);
  const recognitionRef = useRef(null);
  const speechRef = useRef(null);
  const keepAliveRef = useRef(null);

  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

  // Initialize Socket.IO connection for emotion detection
  useEffect(() => {
    socketRef.current = io(PYTHON_SERVER_URL, {
      transports: ['polling', 'websocket'],
      reconnectionAttempts: 3,
    });

    socketRef.current.on('connect', () => {
      console.log('✅ Connected to emotion server');
      setIsConnected(true);
    });

    socketRef.current.on('disconnect', () => {
      setIsConnected(false);
    });

    socketRef.current.on('emotion_update', (data) => {
      if (data.emotion) setCurrentEmotion(data.emotion);
      if (typeof data.face_detected === 'boolean') setFaceDetected(data.face_detected);
    });

    return () => {
      if (socketRef.current) socketRef.current.disconnect();
    };
  }, []);

  // Capture video frame for emotion detection
  const captureFrame = useCallback(() => {
    if (!videoRef.current || !canvasRef.current || !socketRef.current?.connected) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');

    canvas.width = video.videoWidth || 320;
    canvas.height = video.videoHeight || 240;
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    const frameData = canvas.toDataURL('image/jpeg', 0.5);
    socketRef.current.emit('video_frame', { frame: frameData });
  }, []);

  // Start video
  const startVideo = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 320 }, height: { ideal: 240 }, facingMode: 'user' },
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

      frameIntervalRef.current = setInterval(captureFrame, 50);
      setIsVideoEnabled(true);
      setError(null);
    } catch (err) {
      setError(err.name === 'NotAllowedError' ? 'Camera permission denied' : `Camera error: ${err.message}`);
    }
  }, [captureFrame]);

  // Stop video
  const stopVideo = useCallback(() => {
    if (frameIntervalRef.current) {
      clearInterval(frameIntervalRef.current);
      frameIntervalRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) videoRef.current.srcObject = null;
    setIsVideoEnabled(false);
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopVideo();
      stopEverything();
    };
  }, [stopVideo]);

  // Stop all speech/recognition
  const stopEverything = useCallback(() => {
    // Stop speech synthesis
    if (window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
    if (keepAliveRef.current) {
      clearInterval(keepAliveRef.current);
      keepAliveRef.current = null;
    }

    // Stop recognition
    if (recognitionRef.current) {
      try {
        recognitionRef.current.abort();
      } catch (e) { }
    }

    setStatus('idle');
    setTranscript('');
  }, []);

  // Start listening
  const startListening = useCallback(() => {
    if (!SpeechRecognition) {
      setError('Speech recognition not supported');
      return;
    }

    // Stop any ongoing speech first
    stopEverything();

    const recognition = new SpeechRecognition();
    recognition.lang = 'en-IN';
    recognition.continuous = false; // Single utterance mode
    recognition.interimResults = true;

    recognition.onstart = () => {
      setStatus('listening');
      setError(null);
      setTranscript('');
    };

    recognition.onresult = (event) => {
      let finalTranscript = '';
      let interimTranscript = '';

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        if (result.isFinal) {
          finalTranscript += result[0].transcript;
        } else {
          interimTranscript += result[0].transcript;
        }
      }

      setTranscript(finalTranscript || interimTranscript);

      if (finalTranscript) {
        sendMessage(finalTranscript.trim());
      }
    };

    recognition.onerror = (event) => {
      console.error('Recognition error:', event.error);
      if (event.error !== 'no-speech' && event.error !== 'aborted') {
        setError(`Voice error: ${event.error}`);
      }
      setStatus('idle');
    };

    recognition.onend = () => {
      if (status === 'listening') {
        setStatus('idle');
      }
    };

    recognitionRef.current = recognition;

    try {
      recognition.start();
    } catch (e) {
      setError('Could not start listening');
      setStatus('idle');
    }
  }, [SpeechRecognition, status]);

  // Send message to backend
  const sendMessage = async (text) => {
    if (!text.trim()) return;

    setStatus('processing');

    try {
      const userId = localStorage.getItem("Email") || "guest";
      const emotionToSend = faceDetected ? currentEmotion : 'Neutral';

      console.log('Sending message:', text);

      const response = await axiosClient.post('/api/chat', {
        userId,
        message: text,
        sessionId: voiceSessionId,
        emotion: emotionToSend
      });

      setMessageCount(prev => prev + 1);

      console.log('Response received:', response.data);

      if (response.data && response.data.response) {
        speakResponse(response.data.response);
      } else {
        throw new Error('Empty response from server');
      }
    } catch (err) {
      console.error("Chat error:", err);
      setError(err.response?.data?.error || err.message || "Failed to get response");
      setStatus('idle');
    }
  };

  // Speak the AI response
  const speakResponse = (text) => {
    if (!('speechSynthesis' in window)) {
      setError('Speech synthesis not supported');
      setStatus('idle');
      return;
    }

    // Cancel any existing speech
    window.speechSynthesis.cancel();

    const speech = new SpeechSynthesisUtterance(text);
    speechRef.current = speech;

    // Get available voices
    let voices = window.speechSynthesis.getVoices();
    const englishVoice = voices.find(v => v.lang.includes('en-IN'))
      || voices.find(v => v.lang.includes('en-US'))
      || voices.find(v => v.lang.includes('en'))
      || voices[0];

    if (englishVoice) speech.voice = englishVoice;
    speech.lang = 'en-IN';
    speech.rate = 1.0;
    speech.pitch = 1.0;
    speech.volume = 1.0;

    // Chrome keep-alive workaround
    const startKeepAlive = () => {
      if (keepAliveRef.current) clearInterval(keepAliveRef.current);
      keepAliveRef.current = setInterval(() => {
        if (window.speechSynthesis.speaking && !window.speechSynthesis.paused) {
          window.speechSynthesis.pause();
          window.speechSynthesis.resume();
        }
      }, 10000);
    };

    const stopKeepAlive = () => {
      if (keepAliveRef.current) {
        clearInterval(keepAliveRef.current);
        keepAliveRef.current = null;
      }
    };

    speech.onstart = () => {
      console.log('Speech started');
      setStatus('speaking');
      startKeepAlive();
    };

    speech.onend = () => {
      console.log('Speech ended');
      stopKeepAlive();
      setStatus('idle');
      setTranscript('');
    };

    speech.onerror = (event) => {
      console.error('Speech error:', event.error);
      stopKeepAlive();
      if (event.error !== 'interrupted' && event.error !== 'canceled') {
        setError(`Speech error: ${event.error}`);
      }
      setStatus('idle');
    };

    setStatus('speaking');
    window.speechSynthesis.speak(speech);
  };

  // Handle mic button click
  const handleMicClick = () => {
    if (status === 'idle') {
      startListening();
    } else {
      // Interrupt and stop everything
      stopEverything();
    }
  };

  const getStatusText = () => {
    switch (status) {
      case 'listening': return transcript || '🎙️ Listening...';
      case 'processing': return '⏳ Processing...';
      case 'speaking': return '🔊 Speaking...';
      default: return 'Tap to speak';
    }
  };

  const getMicButtonStyle = () => {
    if (status === 'listening') return 'bg-red-500 animate-pulse';
    if (status === 'processing') return 'bg-yellow-500';
    if (status === 'speaking') return 'bg-green-500';
    return 'bg-gradient-to-r from-blue-500 to-purple-600';
  };

  return (
    <div className={`min-h-screen flex flex-col items-center justify-center ${isDarkMode ? "bg-gray-900" : "bg-gray-50"}`}>

      {/* Main content - side by side */}
      <div className="flex flex-row items-center justify-center gap-12 mb-8">

        {/* LEFT: User Camera */}
        <div className="flex flex-col items-center gap-3">
          <div className={`rounded-2xl overflow-hidden shadow-xl ${isDarkMode ? "bg-gray-800" : "bg-white"}`}>
            <div className="relative w-80 h-60">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className={`w-full h-full object-cover ${isVideoEnabled ? 'block' : 'hidden'}`}
                style={{ transform: 'scaleX(-1)' }}
              />

              {!isVideoEnabled && (
                <div className="w-full h-full flex flex-col items-center justify-center gap-2">
                  <FiVideoOff size={40} className={isDarkMode ? "text-gray-600" : "text-gray-400"} />
                  <p className={`text-sm ${isDarkMode ? "text-gray-500" : "text-gray-400"}`}>Camera off</p>
                </div>
              )}

              {isVideoEnabled && (
                <div className={`absolute bottom-2 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full text-sm font-medium ${isDarkMode ? 'bg-gray-900/80 text-white' : 'bg-white/80 text-gray-900'}`}>
                  {currentEmotion} {faceDetected && '●'}
                </div>
              )}
            </div>
          </div>

          {/* Camera toggle */}
          <button
            onClick={() => isVideoEnabled ? stopVideo() : startVideo()}
            className={`px-4 py-2 rounded-xl font-medium flex items-center gap-2 transition-all ${isVideoEnabled
              ? 'bg-green-500 text-white'
              : isDarkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-200 text-gray-700'
              }`}
          >
            {isVideoEnabled ? <FiVideo size={18} /> : <FiVideoOff size={18} />}
            {isVideoEnabled ? 'Camera On' : 'Enable Camera'}
          </button>
        </div>

        {/* RIGHT: AI Avatar */}
        <div className="flex flex-col items-center">
          <TalkingAvatar
            isSpeaking={status === 'speaking'}
            isListening={status === 'listening'}
            emotion={currentEmotion}
            size={240}
          />
        </div>
      </div>

      {/* Controls - centered below */}
      <div className="flex flex-col items-center gap-4">
        {/* Error */}
        {error && (
          <div className="p-3 rounded-xl bg-red-500/10 text-red-500 text-sm text-center max-w-sm">
            {error}
          </div>
        )}

        {/* Mic Button */}
        <button
          onClick={handleMicClick}
          className={`w-20 h-20 rounded-full flex items-center justify-center shadow-xl transition-all transform hover:scale-105 text-white ${getMicButtonStyle()}`}
        >
          {status !== 'idle' ? <RiStopCircleLine size={40} /> : <RiMic2Line size={40} />}
        </button>

        {/* Status text */}
        <p className={`text-lg font-medium text-center max-w-md ${isDarkMode ? "text-gray-300" : "text-gray-600"}`}>
          {getStatusText()}
        </p>

        {/* Conversation info & new convo button */}
        <div className="flex items-center gap-4 mt-2">
          {messageCount > 0 && (
            <span className={`text-sm ${isDarkMode ? "text-gray-500" : "text-gray-400"}`}>
              {messageCount} message{messageCount !== 1 ? 's' : ''} in this session
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
