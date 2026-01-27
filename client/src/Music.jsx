import Sidebar from './Components/Sidebar';
import React, { useContext } from 'react';
import { ThemeContext } from './Components/ThemeContext';

function Music(showIframe) {
    const { isDarkMode } = useContext(ThemeContext)
    return (
        <div className={`min-h-screen italic relative ${isDarkMode ? "bg-gray-900 text-white" : "bg-white text-gray-800"}`}>
            <Sidebar />
            <div>
                {showIframe && (
                    <iframe
                        src="https://music-player-amber-zeta.vercel.app/"
                        width="100%"
                        height="765px"
                        title="Music Project"
                    ></iframe>
                )}

            </div>

        </div>
    );
}

export default Music;
