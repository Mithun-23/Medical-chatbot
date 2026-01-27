import React, { useContext, useState } from 'react'
import Sidebar from './Sidebar'
import logo1 from '../assets/game1.png'
import logo2 from '../assets/game2.png'
import logo3 from '../assets/game3.png'
import logo4 from '../assets/game4.png'
import logo5 from '../assets/game5.png'
import logo6 from '../assets/game6.png'
import { ThemeContext } from './ThemeContext'

const GameSelector = () => {
  const [selectedGame, setSelectedGame] = useState(null);
  const {isDarkMode} = useContext(ThemeContext);

  const games = [
    { id: 1, image: logo1, name: "Game 1", description: "Action-packed adventure", link: "https://my.spline.design/platformerrabbitcopy-40e708c7abbfe2d6c57b4b6af8db1fe5/" },
    { id: 2, image: logo2, name: "Game 2", description: "Strategic puzzle game", link: "https://my.spline.design/minihomeconditionallogiccopy-519248274fab05e2570787ecd2ccd538/" },
    { id: 3, image: logo3, name: "Game 3", description: "Epic RPG experience", link: "https://my.spline.design/forestphysicscopy-cc561d8feb6bcd5dc2b39d277201aaa4/" },
    { id: 4, image: logo4, name: "Game 4", description: "Multiplayer battle arena", link: "https://my.spline.design/dominoeffectphysicscopy-77bdb140db0193f11d6697ce5d8379b7/" },
    { id: 5, image: logo5, name: "Game 5", description: "Racing simulation", link: "https://my.spline.design/pigislandcopy-9f52f63911346dc68c2b3cd90032c479/" },
    { id: 6, image: logo6, name: "Game 6", description: "Survival horror", link: "https://my.spline.design/kidsplaygroundphysicscopy-fdab4a5561b96f5874c8d5dca23aa7cb/" },
  ];

  const handleGameClick = (game) => {
    setSelectedGame(game);
  };

  const closeIframe = () => {
    setSelectedGame(null);
  };

  return (
    <div className="min-h-screen relative italic">
      <div>
        <Sidebar />
      </div>

      <div className="py-8  shadow-sm">
        <h1 className={`text-center ${isDarkMode ? "text-white": "text-black"}  text-4xl font-bold`}>
          Select The Game You Like
        </h1>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-10">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {games.map((game) => (
            <div
              key={game.id}
              className=" rounded-lg overflow-hidden shadow-md hover:shadow-xl transition-shadow duration-300 transform hover:-translate-y-1 transition-transform duration-300 cursor-pointer"
              onClick={() => handleGameClick(game)}
            >
              <div className="relative group">
                <img
                  src={game.image}
                  alt={game.name}
                  className="w-full h-64 object-cover transition-transform duration-300 group-hover:scale-105"
                />
                <div className="absolute inset-0  bg-opacity-0 group-hover:bg-opacity-60 transition-opacity duration-300 flex items-end">
                  <div className="p-4 text-black opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <h3 className="text-xl font-semibold mb-1">{game.name}</h3>
                    <p className="text-sm">{game.description}</p>
                    <p className="text-xs mt-2 text-blue-300">Click to play</p>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

     
      {selectedGame && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
          <div className="relative bg-white rounded-lg w-full max-w-5xl h-5/6 flex flex-col">
            <div className="p-3 flex justify-between items-center border-b">
              <h3 className="text-lg font-semibold">{selectedGame.name}</h3>
              <button
                onClick={closeIframe}
                className="text-gray-500 hover:text-gray-700 focus:outline-none"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="flex-1 w-full">
              <iframe
                src={selectedGame.link}
                title={selectedGame.name}
                className="w-full h-full border-0"
                allowFullScreen
              ></iframe>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default GameSelector