import { useState, useEffect, useRef, useCallback } from 'react';
import { io } from 'socket.io-client';

const PYTHON_SERVER_URL = 'http://localhost:5000';
const FRAME_INTERVAL_MS = 500; // Send frame every 500ms

/**
 * Custom hook for video-based emotion detection using webcam and Socket.IO.
 * Connects to Python backend with DeepFace for facial emotion analysis.
 * 
 * @returns {Object} Hook state and controls
 */
export function useVideoEmotion() {
    const [isVideoEnabled, setIsVideoEnabled] = useState(false);
    const [isConnected, setIsConnected] = useState(false);
    const [currentEmotion, setCurrentEmotion] = useState('Neutral');
    const [rawEmotion, setRawEmotion] = useState('Neutral');
    const [faceDetected, setFaceDetected] = useState(false);
    const [error, setError] = useState(null);
    const [suggestion, setSuggestion] = useState(null);

    const socketRef = useRef(null);
    const videoRef = useRef(null);
    const canvasRef = useRef(null);
    const streamRef = useRef(null);
    const intervalRef = useRef(null);

    // Initialize Socket.IO connection
    useEffect(() => {
        socketRef.current = io(PYTHON_SERVER_URL, {
            transports: ['websocket', 'polling'],
            reconnectionAttempts: 5,
            reconnectionDelay: 1000,
        });

        socketRef.current.on('connect', () => {
            console.log('✅ Connected to emotion detection server');
            setIsConnected(true);
            setError(null);
        });

        socketRef.current.on('disconnect', () => {
            console.log('❌ Disconnected from emotion detection server');
            setIsConnected(false);
        });

        socketRef.current.on('connect_error', (err) => {
            console.error('Socket connection error:', err);
            setError('Could not connect to emotion detection server');
            setIsConnected(false);
        });

        socketRef.current.on('emotion_update', (data) => {
            if (data.emotion) {
                setCurrentEmotion(data.emotion);
            }
            if (data.raw_emotion) {
                setRawEmotion(data.raw_emotion);
            }
            if (typeof data.face_detected === 'boolean') {
                setFaceDetected(data.face_detected);
            }
            if (data.suggestion) {
                setSuggestion(data.suggestion);
            }
            if (data.error) {
                console.error('Emotion detection error:', data.error);
            }
        });

        return () => {
            if (socketRef.current) {
                socketRef.current.disconnect();
            }
        };
    }, []);

    // Capture and send video frame
    const captureFrame = useCallback(() => {
        if (!videoRef.current || !canvasRef.current || !socketRef.current?.connected) {
            return;
        }

        const video = videoRef.current;
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');

        // Set canvas size to match video
        canvas.width = video.videoWidth || 320;
        canvas.height = video.videoHeight || 240;

        // Draw video frame to canvas
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

        // Convert to base64 JPEG with reduced quality for faster transmission
        const frameData = canvas.toDataURL('image/jpeg', 0.6);

        // Send frame to server
        socketRef.current.emit('video_frame', { frame: frameData });
    }, []);

    // Start video capture
    const startVideo = useCallback(async () => {
        try {
            setError(null);

            const stream = await navigator.mediaDevices.getUserMedia({
                video: {
                    width: { ideal: 320 },
                    height: { ideal: 240 },
                    facingMode: 'user'
                },
                audio: false
            });

            streamRef.current = stream;

            if (videoRef.current) {
                videoRef.current.srcObject = stream;
                await videoRef.current.play();
            }

            // Create hidden canvas for frame capture
            if (!canvasRef.current) {
                canvasRef.current = document.createElement('canvas');
            }

            // Start capturing frames
            intervalRef.current = setInterval(captureFrame, FRAME_INTERVAL_MS);

            setIsVideoEnabled(true);
            console.log('📹 Video capture started');

        } catch (err) {
            console.error('Error starting video:', err);
            if (err.name === 'NotAllowedError') {
                setError('Camera permission denied. Please allow camera access.');
            } else if (err.name === 'NotFoundError') {
                setError('No camera found on this device.');
            } else {
                setError('Could not start video: ' + err.message);
            }
            setIsVideoEnabled(false);
        }
    }, [captureFrame]);

    // Stop video capture
    const stopVideo = useCallback(() => {
        if (intervalRef.current) {
            clearInterval(intervalRef.current);
            intervalRef.current = null;
        }

        if (streamRef.current) {
            streamRef.current.getTracks().forEach(track => track.stop());
            streamRef.current = null;
        }

        if (videoRef.current) {
            videoRef.current.srcObject = null;
        }

        setIsVideoEnabled(false);
        setFaceDetected(false);
        setCurrentEmotion('Neutral');
        console.log('📹 Video capture stopped');
    }, []);

    // Toggle video on/off
    const toggleVideo = useCallback(() => {
        if (isVideoEnabled) {
            stopVideo();
        } else {
            startVideo();
        }
    }, [isVideoEnabled, startVideo, stopVideo]);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            stopVideo();
        };
    }, [stopVideo]);

    // Clear suggestion after displaying
    const clearSuggestion = useCallback(() => {
        setSuggestion(null);
    }, []);

    return {
        // Refs
        videoRef,

        // State
        isVideoEnabled,
        isConnected,
        currentEmotion,
        rawEmotion,
        faceDetected,
        error,
        suggestion,

        // Actions
        startVideo,
        stopVideo,
        toggleVideo,
        clearSuggestion,
    };
}

export default useVideoEmotion;
