import React, { useRef, useEffect, useState, useCallback } from 'react';
import { io } from 'socket.io-client';

const SOCKET_URL = 'http://localhost:5000';

export default function EmotionCamera({
    onEmotionChange,
    isEnabled = false,
    showPreview = true,
    frameRate = 10 // frames per second to send
}) {
    const videoRef = useRef(null);
    const canvasRef = useRef(null);
    const socketRef = useRef(null);
    const intervalRef = useRef(null);
    const streamRef = useRef(null);

    const [isConnected, setIsConnected] = useState(false);
    const [currentEmotion, setCurrentEmotion] = useState('Neutral');
    const [faceDetected, setFaceDetected] = useState(false);
    const [error, setError] = useState(null);
    const [suggestion, setSuggestion] = useState(null);

    // Store callback in ref to avoid reconnection on every render
    const onEmotionChangeRef = useRef(onEmotionChange);
    useEffect(() => {
        onEmotionChangeRef.current = onEmotionChange;
    }, [onEmotionChange]);

    // Initialize socket connection
    useEffect(() => {
        if (!isEnabled) return;

        socketRef.current = io(SOCKET_URL, {
            transports: ['websocket', 'polling'],
            reconnectionAttempts: 5,
            reconnectionDelay: 1000
        });

        socketRef.current.on('connect', () => {
            console.log('Socket connected');
            setIsConnected(true);
            setError(null);
        });

        socketRef.current.on('disconnect', () => {
            console.log('Socket disconnected');
            setIsConnected(false);
        });

        socketRef.current.on('connect_error', (err) => {
            console.error('Socket connection error:', err);
            setError('Failed to connect to emotion server');
            setIsConnected(false);
        });

        socketRef.current.on('emotion_update', (data) => {
            if (data.emotion) {
                setCurrentEmotion(data.emotion);
                if (onEmotionChangeRef.current) {
                    onEmotionChangeRef.current(data.emotion);
                }
            }
            if (data.face_detected !== undefined) {
                setFaceDetected(data.face_detected);
            }
            if (data.suggestion) {
                setSuggestion(data.suggestion);
                // Auto-clear suggestion after 10 seconds
                setTimeout(() => setSuggestion(null), 10000);
            }
            if (data.error) {
                console.error('Emotion detection error:', data.error);
            }
        });

        return () => {
            if (socketRef.current) {
                socketRef.current.disconnect();
                socketRef.current = null;
            }
        };
    }, [isEnabled]);

    // Start/stop camera based on isEnabled
    useEffect(() => {
        if (isEnabled) {
            startCamera();
        } else {
            stopCamera();
        }

        return () => {
            stopCamera();
        };
    }, [isEnabled]);

    const startCamera = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                video: {
                    width: { ideal: 320 },
                    height: { ideal: 240 },
                    facingMode: 'user'
                }
            });

            streamRef.current = stream;

            if (videoRef.current) {
                videoRef.current.srcObject = stream;
                videoRef.current.play();
            }

            // Start sending frames
            startFrameCapture();
            setError(null);
        } catch (err) {
            console.error('Failed to access camera:', err);
            setError('Camera access denied. Please allow camera permissions.');
        }
    };

    const stopCamera = () => {
        // Stop frame capture
        if (intervalRef.current) {
            clearInterval(intervalRef.current);
            intervalRef.current = null;
        }

        // Stop camera stream
        if (streamRef.current) {
            streamRef.current.getTracks().forEach(track => track.stop());
            streamRef.current = null;
        }

        if (videoRef.current) {
            videoRef.current.srcObject = null;
        }
    };

    const startFrameCapture = useCallback(() => {
        if (intervalRef.current) {
            clearInterval(intervalRef.current);
        }

        const captureInterval = 1000 / frameRate;

        intervalRef.current = setInterval(() => {
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

            // Convert to base64 JPEG
            const frameData = canvas.toDataURL('image/jpeg', 0.7);

            // Send to server
            socketRef.current.emit('video_frame', { frame: frameData });
        }, captureInterval);
    }, [frameRate]);

    const getEmotionColor = () => {
        switch (currentEmotion) {
            case 'Happy': return 'bg-yellow-400';
            case 'Sad': return 'bg-blue-400';
            case 'Angry': return 'bg-red-500';
            case 'Surprise': return 'bg-purple-400';
            case 'Fear': return 'bg-green-400';
            case 'Disgusted': return 'bg-amber-500';
            default: return 'bg-gray-400';
        }
    };

    const getEmotionEmoji = () => {
        switch (currentEmotion) {
            case 'Happy': return '😊';
            case 'Sad': return '😢';
            case 'Angry': return '😠';
            case 'Surprise': return '😲';
            case 'Fear': return '😨';
            case 'Disgusted': return '🤢';
            default: return '😐';
        }
    };

    if (!isEnabled) {
        return null;
    }

    return (
        <div className="emotion-camera">
            {/* Hidden canvas for frame capture */}
            <canvas ref={canvasRef} style={{ display: 'none' }} />

            {/* Video preview */}
            {showPreview && (
                <div className="relative rounded-lg overflow-hidden bg-gray-900 shadow-lg">
                    <video
                        ref={videoRef}
                        autoPlay
                        playsInline
                        muted
                        className="w-48 h-36 object-cover mirror"
                        style={{ transform: 'scaleX(-1)' }}
                    />

                    {/* Emotion overlay */}
                    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-2">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <span className={`w-3 h-3 rounded-full ${getEmotionColor()} animate-pulse`}></span>
                                <span className="text-white text-sm font-medium">
                                    {getEmotionEmoji()} {currentEmotion}
                                </span>
                            </div>

                            {/* Connection status */}
                            <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-400' : 'bg-red-400'}`}
                                title={isConnected ? 'Connected' : 'Disconnected'} />
                        </div>

                        {!faceDetected && (
                            <p className="text-yellow-400 text-xs mt-1">No face detected</p>
                        )}
                    </div>
                </div>
            )}

            {/* Error message */}
            {error && (
                <div className="mt-2 p-2 bg-red-100 text-red-600 rounded-md text-sm">
                    {error}
                </div>
            )}

            {/* Emotion suggestion popup */}
            {suggestion && (
                <div className="mt-2 p-3 bg-blue-50 border border-blue-200 rounded-lg text-sm text-blue-800 animate-fadeIn">
                    <p className="font-medium">💡 Suggestion based on your emotion:</p>
                    <p className="mt-1">{suggestion}</p>
                </div>
            )}

            {/* Non-preview mode: just show emotion indicator */}
            {!showPreview && (
                <div className="flex items-center gap-2 p-2 bg-gray-100 rounded-lg">
                    <span className={`w-3 h-3 rounded-full ${getEmotionColor()}`}></span>
                    <span className="text-sm font-medium">{getEmotionEmoji()} {currentEmotion}</span>
                    <span className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-400' : 'bg-red-400'}`} />
                </div>
            )}
        </div>
    );
}
