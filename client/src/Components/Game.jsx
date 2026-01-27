import React from 'react';
import { axiosClient } from "../axios";

function Game() {
  const runGame = (game) => {
    axiosClient.get(`https://apparent-wolf-obviously.ngrok-free.app/run-game/${game}`)
      .then(response => {
        alert(response.data.message);
      })
      .catch(error => {
        console.error('Error running game:', error);
      });
  };

  return (
    <div style={{ textAlign: 'center', marginTop: '50px' }}>
      <h1>Python Games</h1>
      <button onClick={() => runGame('game1')}>Run Game 1</button>
      <br /><br />
      <button onClick={() => runGame('game2')}>Run Game 2</button>
    </div>
  );
}

export default Game;
