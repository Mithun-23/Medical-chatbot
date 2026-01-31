import React, { useContext, useState } from 'react';
import { ThemeContext } from './Components/ThemeContext';
import { Music as MusicIcon } from 'lucide-react';

// Curated playlists for mental wellness
const playlists = [
    {
        id: '37i9dQZF1DWXe9gFZP0gtP',
        name: 'Peaceful Piano',
        emoji: '🧘',
        description: 'Relax and unwind with peaceful piano melodies'
    },
    {
        id: '37i9dQZF1DX3Ogo9pFvBkY',
        name: 'Sleep',
        emoji: '😴',
        description: 'Gentle ambient music for restful sleep'
    },
    {
        id: '37i9dQZF1DX4sWSpwq3LiO',
        name: 'Deep Focus',
        emoji: '🧠',
        description: 'Keep your mind sharp with concentration music'
    },
    {
        id: '37i9dQZF1DX1s9knjP51Oa',
        name: 'Mood Booster',
        emoji: '☀️',
        description: 'Feel-good hits to lift your spirits'
    },
    {
        id: '37i9dQZF1DWZqd5JICZI0u',
        name: 'Nature Sounds',
        emoji: '🌿',
        description: 'Sounds of nature for relaxation'
    },
    {
        id: '37i9dQZF1DX9sIqqvKsjG8',
        name: 'Lo-Fi Beats',
        emoji: '🎵',
        description: 'Chill beats for studying and relaxing'
    }
];

function Music() {
    const { isDarkMode } = useContext(ThemeContext);
    const [selectedPlaylist, setSelectedPlaylist] = useState(playlists[0]);

    return (
        <div className={`min-h-screen ${isDarkMode ? 'bg-gray-900' : 'bg-gray-50'} p-6`}>
            <div className="max-w-6xl mx-auto">
                {/* Header */}
                <div className="mb-8">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center shadow-lg">
                            <MusicIcon size={24} className="text-white" />
                        </div>
                        <div>
                            <h1 className={`text-3xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                                Music Therapy
                            </h1>
                            <p className={`${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                                Curated playlists for relaxation, focus, and mental wellness
                            </p>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Playlist Selector */}
                    <div className={`rounded-2xl p-5 shadow-lg ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`}>
                        <h2 className={`text-lg font-semibold mb-4 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                            Choose a Playlist
                        </h2>
                        <div className="space-y-2">
                            {playlists.map((playlist) => (
                                <button
                                    key={playlist.id}
                                    onClick={() => setSelectedPlaylist(playlist)}
                                    className={`w-full text-left p-3 rounded-xl transition-all duration-200 ${selectedPlaylist.id === playlist.id
                                        ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg'
                                        : isDarkMode
                                            ? 'bg-gray-700 hover:bg-gray-600 text-gray-200'
                                            : 'bg-gray-100 hover:bg-gray-200 text-gray-800'
                                        }`}
                                >
                                    <div className="flex items-center gap-2">
                                        <span className="text-lg">{playlist.emoji}</span>
                                        <span className="font-medium">{playlist.name}</span>
                                    </div>
                                    <div className={`text-sm mt-1 ${selectedPlaylist.id === playlist.id
                                        ? 'text-blue-100'
                                        : isDarkMode ? 'text-gray-400' : 'text-gray-500'
                                        }`}>
                                        {playlist.description}
                                    </div>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Spotify Player */}
                    <div className="lg:col-span-2">
                        <div className={`rounded-2xl overflow-hidden shadow-lg ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`}>
                            <div className={`p-4 border-b ${isDarkMode ? 'border-gray-700' : 'border-gray-200'} bg-gradient-to-r from-blue-600/10 to-purple-600/10`}>
                                <div className="flex items-center gap-3">
                                    <span className="text-2xl">{selectedPlaylist.emoji}</span>
                                    <div>
                                        <h2 className={`text-lg font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                                            {selectedPlaylist.name}
                                        </h2>
                                        <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                                            {selectedPlaylist.description}
                                        </p>
                                    </div>
                                </div>
                            </div>
                            <iframe
                                src={`https://open.spotify.com/embed/playlist/${selectedPlaylist.id}?utm_source=generator&theme=${isDarkMode ? '0' : '1'}`}
                                width="100%"
                                height="480"
                                frameBorder="0"
                                allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
                                loading="lazy"
                                title={selectedPlaylist.name}
                                className="w-full"
                            />
                        </div>

                        {/* Tips Section */}
                        <div className={`mt-6 rounded-2xl p-5 shadow-lg ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`}>
                            <h3 className={`font-semibold mb-3 flex items-center gap-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                                <span className="w-8 h-8 rounded-lg bg-gradient-to-br from-yellow-500 to-orange-500 flex items-center justify-center text-sm">💡</span>
                                Music Therapy Tips
                            </h3>
                            <div className={`grid grid-cols-1 md:grid-cols-2 gap-3 text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                                <div className={`p-3 rounded-xl ${isDarkMode ? 'bg-gray-700/50' : 'bg-gray-50'}`}>
                                    <strong className={isDarkMode ? 'text-blue-400' : 'text-blue-600'}>Anxiety Relief:</strong>
                                    <p>Peaceful Piano or Nature Sounds</p>
                                </div>
                                <div className={`p-3 rounded-xl ${isDarkMode ? 'bg-gray-700/50' : 'bg-gray-50'}`}>
                                    <strong className={isDarkMode ? 'text-purple-400' : 'text-purple-600'}>Work & Study:</strong>
                                    <p>Deep Focus or Lo-Fi Beats</p>
                                </div>
                                <div className={`p-3 rounded-xl ${isDarkMode ? 'bg-gray-700/50' : 'bg-gray-50'}`}>
                                    <strong className={isDarkMode ? 'text-yellow-400' : 'text-yellow-600'}>Feeling Low:</strong>
                                    <p>Mood Booster playlist</p>
                                </div>
                                <div className={`p-3 rounded-xl ${isDarkMode ? 'bg-gray-700/50' : 'bg-gray-50'}`}>
                                    <strong className={isDarkMode ? 'text-indigo-400' : 'text-indigo-600'}>Before Bed:</strong>
                                    <p>Sleep playlist 30 min before</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default Music;


