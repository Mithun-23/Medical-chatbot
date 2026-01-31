import React, { useEffect, useState, memo } from 'react';

/**
 * Professional AI Assistant Avatar
 * Modern, clean design with smooth animations
 */
const TalkingAvatar = memo(function TalkingAvatar({
    isSpeaking = false,
    isListening = false,
    emotion = 'Neutral',
    size = 200
}) {
    const [mouthState, setMouthState] = useState(0); // 0-2 for different mouth shapes
    const [pulseSize, setPulseSize] = useState(1);

    // Mouth animation when speaking
    useEffect(() => {
        if (!isSpeaking) {
            setMouthState(0);
            return;
        }

        const mouthInterval = setInterval(() => {
            setMouthState(prev => (prev + 1) % 3);
        }, 100);

        return () => clearInterval(mouthInterval);
    }, [isSpeaking]);

    // Pulse animation for speaking/listening
    useEffect(() => {
        if (!isSpeaking && !isListening) {
            setPulseSize(1);
            return;
        }

        const pulseInterval = setInterval(() => {
            setPulseSize(prev => prev === 1 ? 1.05 : 1);
        }, 500);

        return () => clearInterval(pulseInterval);
    }, [isSpeaking, isListening]);

    // Get emotion-based accent color
    const getAccentColor = () => {
        switch (emotion) {
            case 'Happy': return { primary: '#10B981', secondary: '#34D399', glow: 'rgba(16, 185, 129, 0.3)' };
            case 'Sad': return { primary: '#3B82F6', secondary: '#60A5FA', glow: 'rgba(59, 130, 246, 0.3)' };
            case 'Angry': return { primary: '#EF4444', secondary: '#F87171', glow: 'rgba(239, 68, 68, 0.3)' };
            case 'Surprise': return { primary: '#8B5CF6', secondary: '#A78BFA', glow: 'rgba(139, 92, 246, 0.3)' };
            case 'Fear': return { primary: '#F59E0B', secondary: '#FBBF24', glow: 'rgba(245, 158, 11, 0.3)' };
            default: return { primary: '#6366F1', secondary: '#818CF8', glow: 'rgba(99, 102, 241, 0.3)' };
        }
    };

    const colors = getAccentColor();

    const getMouthPath = () => {
        if (!isSpeaking) {
            // Slight smile when not speaking
            return "M 35 52 Q 50 56 65 52";
        }
        // Different mouth shapes for speaking animation
        switch (mouthState) {
            case 0: return "M 35 50 Q 50 58 65 50"; // Open
            case 1: return "M 38 52 Q 50 54 62 52"; // Semi-closed
            case 2: return "M 35 50 Q 50 60 65 50"; // Wide open
            default: return "M 35 52 Q 50 56 65 52";
        }
    };

    return (
        <div
            className="relative flex flex-col items-center"
            style={{ width: size, height: size + 40 }}
        >
            {/* Outer glow ring */}
            <div
                className="absolute rounded-full transition-all duration-500"
                style={{
                    width: size,
                    height: size,
                    background: `radial-gradient(circle, ${colors.glow} 0%, transparent 70%)`,
                    transform: `scale(${isSpeaking ? 1.3 : isListening ? 1.2 : 1.1})`,
                    opacity: isSpeaking || isListening ? 1 : 0.5,
                }}
            />

            {/* Main avatar container */}
            <div
                className="relative rounded-full overflow-hidden shadow-2xl transition-transform duration-300"
                style={{
                    width: size,
                    height: size,
                    transform: `scale(${pulseSize})`,
                    background: `linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f0f23 100%)`,
                    border: `3px solid ${colors.primary}`,
                    boxShadow: `0 0 30px ${colors.glow}, inset 0 0 60px rgba(255,255,255,0.05)`,
                }}
            >
                {/* Animated background pattern */}
                <div
                    className="absolute inset-0 opacity-20"
                    style={{
                        background: `radial-gradient(circle at 30% 30%, ${colors.secondary}40 0%, transparent 50%),
                        radial-gradient(circle at 70% 70%, ${colors.primary}30 0%, transparent 50%)`,
                    }}
                />

                {/* Face SVG */}
                <svg viewBox="0 0 100 100" className="absolute inset-0 w-full h-full">
                    {/* Left eye */}
                    <ellipse
                        cx="35"
                        cy="38"
                        rx="8"
                        ry="6"
                        fill={colors.primary}
                        className="transition-all duration-200"
                        style={{
                            filter: `drop-shadow(0 0 8px ${colors.primary})`,
                        }}
                    />
                    <ellipse
                        cx="35"
                        cy="38"
                        rx="4"
                        ry="4"
                        fill="white"
                        opacity="0.9"
                    />
                    <ellipse
                        cx="36"
                        cy="37"
                        rx="1.5"
                        ry="1.5"
                        fill="white"
                    />

                    {/* Right eye */}
                    <ellipse
                        cx="65"
                        cy="38"
                        rx="8"
                        ry="6"
                        fill={colors.primary}
                        className="transition-all duration-200"
                        style={{
                            filter: `drop-shadow(0 0 8px ${colors.primary})`,
                        }}
                    />
                    <ellipse
                        cx="65"
                        cy="38"
                        rx="4"
                        ry="4"
                        fill="white"
                        opacity="0.9"
                    />
                    <ellipse
                        cx="66"
                        cy="37"
                        rx="1.5"
                        ry="1.5"
                        fill="white"
                    />

                    {/* Mouth */}
                    <path
                        d={getMouthPath()}
                        stroke={colors.secondary}
                        strokeWidth="3"
                        strokeLinecap="round"
                        fill={isSpeaking ? colors.primary + '40' : 'none'}
                        className="transition-all duration-100"
                        style={{
                            filter: `drop-shadow(0 0 4px ${colors.secondary})`,
                        }}
                    />

                    {/* Audio waves when speaking */}
                    {isSpeaking && (
                        <>
                            <circle
                                cx="50"
                                cy="75"
                                r="8"
                                fill="none"
                                stroke={colors.secondary}
                                strokeWidth="1"
                                opacity="0.6"
                                className="animate-ping"
                                style={{ animationDuration: '1s' }}
                            />
                            <circle
                                cx="50"
                                cy="75"
                                r="12"
                                fill="none"
                                stroke={colors.secondary}
                                strokeWidth="0.5"
                                opacity="0.4"
                                className="animate-ping"
                                style={{ animationDuration: '1.5s' }}
                            />
                        </>
                    )}

                    {/* Listening indicator */}
                    {isListening && !isSpeaking && (
                        <>
                            <circle
                                cx="50"
                                cy="20"
                                r="4"
                                fill={colors.primary}
                                className="animate-pulse"
                            />
                            <circle
                                cx="40"
                                cy="22"
                                r="2"
                                fill={colors.secondary}
                                className="animate-pulse"
                                style={{ animationDelay: '0.2s' }}
                            />
                            <circle
                                cx="60"
                                cy="22"
                                r="2"
                                fill={colors.secondary}
                                className="animate-pulse"
                                style={{ animationDelay: '0.4s' }}
                            />
                        </>
                    )}
                </svg>

                {/* Shine effect */}
                <div
                    className="absolute top-2 left-4 w-1/3 h-1/4 rounded-full opacity-20"
                    style={{
                        background: 'linear-gradient(135deg, white 0%, transparent 100%)',
                    }}
                />
            </div>

            {/* Status indicator */}
            <div
                className="mt-4 px-4 py-1.5 rounded-full text-xs font-medium tracking-wide uppercase transition-all duration-300"
                style={{
                    background: `linear-gradient(135deg, ${colors.primary}20, ${colors.secondary}20)`,
                    color: colors.primary,
                    border: `1px solid ${colors.primary}40`,
                    boxShadow: `0 0 10px ${colors.glow}`,
                }}
            >
                {isSpeaking ? '● Speaking' : isListening ? '● Listening' : `● ${emotion}`}
            </div>
        </div>
    );
});

export default TalkingAvatar;
