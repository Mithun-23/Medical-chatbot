import React, { useContext } from 'react';
import { ThemeContext } from './Components/ThemeContext';

function Music({ showIframe }) {
    const { isDarkMode } = useContext(ThemeContext)
    return (
        <iframe
            src="https://music-player-amber-zeta.vercel.app/"
            width="100%"
            height="100%"
            title="Music Project"
        ></iframe>
    );
}

export default Music;
