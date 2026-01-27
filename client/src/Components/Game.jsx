import React from 'react';

function Game (){
  const runGame = (game) => {
    fetch(`https://apparent-wolf-obviously.ngrok-free.app/run-game/${game}`)
      .then(response => response.json())
      .then(data => {
        alert(data.message);
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
