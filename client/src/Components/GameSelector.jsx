import React, { useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import logo1 from '../assets/game1.png';
import logo2 from '../assets/game2.png';
import logo3 from '../assets/game3.png';
import logo4 from '../assets/game4.png';
import logo5 from '../assets/game5.png';
import logo6 from '../assets/game6.png';
import { ThemeContext } from './ThemeContext';

const GameSelector = () => {
  const navigate = useNavigate();
  const { isDarkMode } = useContext(ThemeContext);

  const games = [
    { id: 1, image: logo1, name: "Bunny Runner", description: "Help the bunny jump through platforms" },
    { id: 2, image: logo2, name: "Cozy Home", description: "Explore an interactive mini home" },
    { id: 3, image: logo3, name: "Forest Adventure", description: "Physics-based forest exploration" },
    { id: 4, image: logo4, name: "Domino Effect", description: "Watch the satisfying domino chain" },
    { id: 5, image: logo5, name: "Pig Island", description: "Fun interactions on the island" },
    { id: 6, image: logo6, name: "Kids Playground", description: "Interactive playground physics" },
  ];

  const handleGameClick = (gameId) => {
    navigate(`/game/${gameId}`);
  };

  return (
    <div className={`min-h-screen ${isDarkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
      {/* Header */}
      <div className="py-8">
        <h1 className={`text-center text-4xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
          🎮 Select a Game
        </h1>
        <p className={`text-center mt-2 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
          Choose a relaxing game to play
        </p>
      </div>

      {/* Games Grid */}
      <div className="max-w-6xl mx-auto px-4 pb-10">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {games.map((game) => (
            <div
              key={game.id}
              onClick={() => handleGameClick(game.id)}
              className={`rounded-2xl overflow-hidden shadow-lg transition-all duration-300 
                transform hover:-translate-y-2 hover:shadow-2xl cursor-pointer
                ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`}
            >
              {/* Image */}
              <div className="relative overflow-hidden">
                <img
                  src={game.image}
                  alt={game.name}
                  className="w-full h-48 object-cover transition-transform duration-300 hover:scale-110"
                />
                {/* Gradient overlay */}
                <div className={`absolute inset-0 bg-gradient-to-t ${isDarkMode ? 'from-gray-800' : 'from-white'
                  } to-transparent opacity-60`} />
              </div>

              {/* Info */}
              <div className="p-5">
                <h3 className={`text-xl font-bold mb-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                  {game.name}
                </h3>
                <p className={`text-sm mb-4 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                  {game.description}
                </p>
                <button
                  className="w-full py-2 px-4 bg-gradient-to-r from-purple-500 to-pink-500 
                    text-white font-semibold rounded-lg hover:from-purple-600 hover:to-pink-600 
                    transition-all shadow-md hover:shadow-lg"
                >
                  Play Now →
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default GameSelector;