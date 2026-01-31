import React, { useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ThemeContext } from './ThemeContext';
import { ArrowLeft, Maximize2, ExternalLink } from 'lucide-react';

// Game data
const GAMES = {
    1: {
        name: "Bunny Runner",
        description: "Help the bunny jump through platforms",
        link: "https://my.spline.design/platformerrabbitcopy-40e708c7abbfe2d6c57b4b6af8db1fe5/"
    },
    2: {
        name: "Cozy Home",
        description: "Explore an interactive mini home",
        link: "https://my.spline.design/minihomeconditionallogiccopy-519248274fab05e2570787ecd2ccd538/"
    },
    3: {
        name: "Forest Adventure",
        description: "Physics-based forest exploration",
        link: "https://my.spline.design/forestphysicscopy-cc561d8feb6bcd5dc2b39d277201aaa4/"
    },
    4: {
        name: "Domino Effect",
        description: "Watch the satisfying domino chain",
        link: "https://my.spline.design/dominoeffectphysicscopy-77bdb140db0193f11d6697ce5d8379b7/"
    },
    5: {
        name: "Pig Island",
        description: "Fun interactions on the island",
        link: "https://my.spline.design/pigislandcopy-9f52f63911346dc68c2b3cd90032c479/"
    },
    6: {
        name: "Kids Playground",
        description: "Interactive playground physics",
        link: "https://my.spline.design/kidsplaygroundphysicscopy-fdab4a5561b96f5874c8d5dca23aa7cb/"
    },
};

const GamePage = () => {
    const { gameId } = useParams();
    const navigate = useNavigate();
    const { isDarkMode } = useContext(ThemeContext);

    const game = GAMES[gameId];

    if (!game) {
        return (
            <div className={`min-h-screen flex items-center justify-center ${isDarkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
                <div className={`text-center p-8 rounded-2xl ${isDarkMode ? 'bg-gray-800' : 'bg-white'} shadow-lg`}>
                    <span className="text-5xl mb-4 block">🎮</span>
                    <h2 className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                        Game Not Found
                    </h2>
                    <button
                        onClick={() => navigate('/game-selector')}
                        className="mt-4 px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
                    >
                        Back to Games
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className={`h-screen flex flex-col ${isDarkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
            {/* Header */}
            <div className={`flex items-center justify-between p-4 border-b ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
                }`}>
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => navigate('/game-selector')}
                        className={`p-2 rounded-lg transition-colors ${isDarkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'
                            }`}
                    >
                        <ArrowLeft className={isDarkMode ? 'text-white' : 'text-gray-900'} size={24} />
                    </button>
                    <div>
                        <h1 className={`text-xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                            {game.name}
                        </h1>
                        <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                            {game.description}
                        </p>
                    </div>
                </div>
                <a
                    href={game.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${isDarkMode
                            ? 'bg-gray-700 hover:bg-gray-600 text-white'
                            : 'bg-gray-100 hover:bg-gray-200 text-gray-900'
                        }`}
                >
                    <ExternalLink size={18} />
                    <span>Open Fullscreen</span>
                </a>
            </div>

            {/* Game iframe */}
            <div className="flex-1 w-full">
                <iframe
                    src={game.link}
                    title={game.name}
                    className="w-full h-full border-0"
                    allowFullScreen
                />
            </div>
        </div>
    );
};

export default GamePage;
