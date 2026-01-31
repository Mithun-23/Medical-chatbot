import React, { useContext, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ThemeContext } from './ThemeContext';
import {
    Gamepad2,
    Music,
    Phone,
    Wind,
    BookOpen,
    X,
    AlertTriangle
} from 'lucide-react';

/**
 * ActionButton component renders interactive buttons based on LLM-suggested actions.
 * Supports: GAME, MUSIC, EMERGENCY, BREATHING, JOURNAL
 */
const ActionButton = ({ action }) => {
    const navigate = useNavigate();
    const { isDarkMode } = useContext(ThemeContext);
    const [showEmergencyModal, setShowEmergencyModal] = useState(false);
    const [showBreathingModal, setShowBreathingModal] = useState(false);
    const [showJournalModal, setShowJournalModal] = useState(false);

    // Action configurations
    const actionConfig = {
        GAME: {
            icon: Gamepad2,
            label: 'Play a Game',
            color: 'from-purple-500 to-indigo-600',
            hoverColor: 'hover:from-purple-600 hover:to-indigo-700'
        },
        MUSIC: {
            icon: Music,
            label: 'Listen to Music',
            color: 'from-pink-500 to-rose-600',
            hoverColor: 'hover:from-pink-600 hover:to-rose-700'
        },
        EMERGENCY: {
            icon: Phone,
            label: 'Crisis Support',
            color: 'from-red-500 to-red-700',
            hoverColor: 'hover:from-red-600 hover:to-red-800'
        },
        BREATHING: {
            icon: Wind,
            label: 'Breathing Exercise',
            color: 'from-cyan-500 to-teal-600',
            hoverColor: 'hover:from-cyan-600 hover:to-teal-700'
        },
        JOURNAL: {
            icon: BookOpen,
            label: 'Write in Journal',
            color: 'from-amber-500 to-orange-600',
            hoverColor: 'hover:from-amber-600 hover:to-orange-700'
        }
    };

    const config = actionConfig[action.type];
    if (!config) return null;

    const Icon = config.icon;

    const handleClick = () => {
        switch (action.type) {
            case 'GAME':
                navigate('/game-selector');
                break;
            case 'MUSIC':
                navigate('/music');
                break;
            case 'EMERGENCY':
                setShowEmergencyModal(true);
                break;
            case 'BREATHING':
                setShowBreathingModal(true);
                break;
            case 'JOURNAL':
                setShowJournalModal(true);
                break;
            default:
                break;
        }
    };

    // Emergency Modal
    const EmergencyModal = () => (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className={`max-w-md w-full rounded-2xl p-6 shadow-2xl ${isDarkMode ? 'bg-gray-800' : 'bg-white'
                }`}>
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-red-100 rounded-full">
                            <AlertTriangle className="w-6 h-6 text-red-600" />
                        </div>
                        <h3 className={`text-xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                            Crisis Support
                        </h3>
                    </div>
                    <button
                        onClick={() => setShowEmergencyModal(false)}
                        className={`p-1 rounded-full ${isDarkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}`}
                    >
                        <X className={`w-5 h-5 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`} />
                    </button>
                </div>

                <p className={`mb-6 ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                    You're not alone. Here are resources that can help right now:
                </p>

                <div className="space-y-3">
                    <a
                        href="tel:108"
                        className="flex items-center gap-3 p-4 bg-red-50 hover:bg-red-100 rounded-xl transition-colors"
                    >
                        <Phone className="w-5 h-5 text-red-600" />
                        <div>
                            <p className="font-semibold text-red-800">108 Emergency Ambulance</p>
                            <p className="text-sm text-red-600">Call 108 (Free, 24/7)</p>
                        </div>
                    </a>

                    <a
                        href="tel:9152987821"
                        className="flex items-center gap-3 p-4 bg-blue-50 hover:bg-blue-100 rounded-xl transition-colors"
                    >
                        <Phone className="w-5 h-5 text-blue-600" />
                        <div>
                            <p className="font-semibold text-blue-800">iCall Mental Health</p>
                            <p className="text-sm text-blue-600">9152987821 (Mon-Sat, 8am-10pm)</p>
                        </div>
                    </a>

                    <a
                        href="tel:18602662345"
                        className="flex items-center gap-3 p-4 bg-purple-50 hover:bg-purple-100 rounded-xl transition-colors"
                    >
                        <Phone className="w-5 h-5 text-purple-600" />
                        <div>
                            <p className="font-semibold text-purple-800">Vandrevala Foundation</p>
                            <p className="text-sm text-purple-600">1860-2662-345 (24/7, Free)</p>
                        </div>
                    </a>

                    <a
                        href="tel:08046110007"
                        className="flex items-center gap-3 p-4 bg-green-50 hover:bg-green-100 rounded-xl transition-colors"
                    >
                        <Phone className="w-5 h-5 text-green-600" />
                        <div>
                            <p className="font-semibold text-green-800">NIMHANS Helpline</p>
                            <p className="text-sm text-green-600">080-46110007 (24/7)</p>
                        </div>
                    </a>
                </div>

                <button
                    onClick={() => setShowEmergencyModal(false)}
                    className={`mt-6 w-full py-3 rounded-xl font-medium ${isDarkMode
                        ? 'bg-gray-700 text-white hover:bg-gray-600'
                        : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                        }`}
                >
                    Close
                </button>
            </div>
        </div>
    );

    // Breathing Exercise Modal
    const BreathingModal = () => {
        const [phase, setPhase] = useState('ready');
        const [count, setCount] = useState(4);
        const [cycles, setCycles] = useState(0);

        React.useEffect(() => {
            if (phase === 'ready') return;

            const interval = setInterval(() => {
                setCount(prev => {
                    if (prev > 1) return prev - 1;

                    // Transition to next phase
                    if (phase === 'inhale') {
                        setPhase('hold');
                        return 7;
                    } else if (phase === 'hold') {
                        setPhase('exhale');
                        return 8;
                    } else if (phase === 'exhale') {
                        setCycles(c => c + 1);
                        if (cycles >= 2) {
                            setPhase('complete');
                            return 0;
                        }
                        setPhase('inhale');
                        return 4;
                    }
                    return prev;
                });
            }, 1000);

            return () => clearInterval(interval);
        }, [phase, cycles]);

        const startBreathing = () => {
            setPhase('inhale');
            setCount(4);
            setCycles(0);
        };

        const phaseColors = {
            ready: 'bg-cyan-500',
            inhale: 'bg-cyan-400',
            hold: 'bg-teal-500',
            exhale: 'bg-cyan-600',
            complete: 'bg-green-500'
        };

        const phaseText = {
            ready: 'Ready to begin',
            inhale: 'Breathe In',
            hold: 'Hold',
            exhale: 'Breathe Out',
            complete: 'Great job!'
        };

        return (
            <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                <div className={`max-w-md w-full rounded-2xl p-8 shadow-2xl ${isDarkMode ? 'bg-gray-800' : 'bg-white'
                    }`}>
                    <div className="flex items-center justify-between mb-6">
                        <h3 className={`text-xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                            4-7-8 Breathing
                        </h3>
                        <button
                            onClick={() => setShowBreathingModal(false)}
                            className={`p-1 rounded-full ${isDarkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}`}
                        >
                            <X className={`w-5 h-5 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`} />
                        </button>
                    </div>

                    <div className="flex flex-col items-center">
                        <div className={`w-40 h-40 rounded-full flex items-center justify-center mb-6 transition-all duration-1000 ${phaseColors[phase]} ${phase === 'inhale' ? 'scale-110' : phase === 'exhale' ? 'scale-90' : 'scale-100'
                            }`}>
                            <span className="text-5xl font-bold text-white">
                                {phase === 'complete' ? '✓' : count}
                            </span>
                        </div>

                        <p className={`text-xl font-medium mb-6 ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>
                            {phaseText[phase]}
                        </p>

                        {phase === 'ready' && (
                            <button
                                onClick={startBreathing}
                                className="px-8 py-3 bg-gradient-to-r from-cyan-500 to-teal-600 text-white rounded-xl font-medium hover:from-cyan-600 hover:to-teal-700 transition-all"
                            >
                                Start Exercise
                            </button>
                        )}

                        {phase === 'complete' && (
                            <button
                                onClick={() => setShowBreathingModal(false)}
                                className="px-8 py-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-xl font-medium hover:from-green-600 hover:to-emerald-700 transition-all"
                            >
                                Done
                            </button>
                        )}
                    </div>
                </div>
            </div>
        );
    };

    // Journal Modal
    const JournalModal = () => {
        const [entry, setEntry] = useState('');
        const prompt = action.prompt || 'Write about what you\'re feeling right now...';

        const saveEntry = () => {
            // Save to localStorage for now
            const entries = JSON.parse(localStorage.getItem('journalEntries') || '[]');
            entries.push({
                date: new Date().toISOString(),
                prompt,
                entry
            });
            localStorage.setItem('journalEntries', JSON.stringify(entries));
            setShowJournalModal(false);
        };

        return (
            <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                <div className={`max-w-lg w-full rounded-2xl p-6 shadow-2xl ${isDarkMode ? 'bg-gray-800' : 'bg-white'
                    }`}>
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                            <div className={`p-2 rounded-full ${isDarkMode ? 'bg-amber-900/30' : 'bg-amber-100'}`}>
                                <BookOpen className={`w-5 h-5 ${isDarkMode ? 'text-amber-400' : 'text-amber-600'}`} />
                            </div>
                            <h3 className={`text-xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                                Journal Entry
                            </h3>
                        </div>
                        <button
                            onClick={() => setShowJournalModal(false)}
                            className={`p-1 rounded-full ${isDarkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}`}
                        >
                            <X className={`w-5 h-5 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`} />
                        </button>
                    </div>

                    <p className={`mb-4 italic ${isDarkMode ? 'text-amber-300' : 'text-amber-700'}`}>
                        "{prompt}"
                    </p>

                    <textarea
                        value={entry}
                        onChange={(e) => setEntry(e.target.value)}
                        placeholder="Start writing..."
                        className={`w-full h-48 p-4 rounded-xl border resize-none focus:outline-none focus:ring-2 focus:ring-amber-500 ${isDarkMode
                            ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400'
                            : 'bg-gray-50 border-gray-200 text-gray-800 placeholder-gray-400'
                            }`}
                    />

                    <div className="flex gap-3 mt-4">
                        <button
                            onClick={() => setShowJournalModal(false)}
                            className={`flex-1 py-3 rounded-xl font-medium ${isDarkMode
                                ? 'bg-gray-700 text-white hover:bg-gray-600'
                                : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                                }`}
                        >
                            Cancel
                        </button>
                        <button
                            onClick={saveEntry}
                            disabled={!entry.trim()}
                            className={`flex-1 py-3 rounded-xl font-medium bg-gradient-to-r from-amber-500 to-orange-600 text-white hover:from-amber-600 hover:to-orange-700 disabled:opacity-50 disabled:cursor-not-allowed`}
                        >
                            Save Entry
                        </button>
                    </div>
                </div>
            </div>
        );
    };

    return (
        <>
            <button
                onClick={handleClick}
                className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl font-medium text-white bg-gradient-to-r ${config.color} ${config.hoverColor} transition-all shadow-md hover:shadow-lg transform hover:scale-105`}
            >
                <Icon className="w-4 h-4" />
                <span>{config.label}</span>
            </button>

            {showEmergencyModal && <EmergencyModal />}
            {showBreathingModal && <BreathingModal />}
            {showJournalModal && <JournalModal />}
        </>
    );
};

export default ActionButton;
