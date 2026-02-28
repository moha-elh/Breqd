import Background from "./Backgroud";
import Bread from "./Bread";
import FirePipe from "./FirePipe";
import { useState, useEffect, useRef } from "react";

function Game() {
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  const [breadY, setBreadY] = useState(-345);
  const [velocity, setVelocity] = useState(0);
  const [gameStarted, setGameStarted] = useState(false);
  const gravity = 0.08;

  //Jumping mechanism
  const jump = () => {
    setVelocity(-4);
  };

  //trigger forjumping and starting the game added once after mounting coz of the []
  useEffect(() => {
    if (!gameStarted) {
      window.addEventListener("keydown", (event) => {
        if (event.code == "Space") {
          event.preventDefault();
          startGame();
        }
      });
      console.log("click pressed for starting game");
    }
    window.addEventListener("keydown", (event) => {
      if (event.code === "Space") {
        event.preventDefault();
        jump();
      }
    });
    console.log("click pressed for Jumping");

    return () => {
      window.removeEventListener("keydown", (event) => {
        if (event.code == "space") {
          event.preventDefault();
          startGame();
        }
      });
      window.removeEventListener("keydow", (event) => {
        if (event.code === "space") {
          event.preventDefault();
          jump();
        }
      });
      console.log("jump removed");
      console.log("Game Ended");
    };
  }, [gameStarted]);

  const startGame = () => {
    setGameStarted(true);
  };

  const endGame = () => {
    setGameStarted(false);
    setBreadY(-800);
    return "game ended";
  };

  //game loop
  useEffect(() => {
    if (gameStarted) {
      // Background dimension
      console.log("the dimension of the background is ", dimensions);
      console.log("the position of the bread is  :", dimensions.height / 2);
      console.log("Bread starting point", breadY);
      gameLoop();
    }
  }, [gameStarted]);

  function gameLoop() {
    if (gameStarted) {
      setVelocity((prevVelocity) => {
        const newVelocity = prevVelocity + gravity;
        setBreadY((prevBreadY) => prevBreadY + newVelocity);
        return newVelocity;
      });

      requestAnimationFrame(gameLoop);
    }
  }

  return (
    <div className="flex items-center justify-center h-screen bg-black">
      <div className="relative">
        <div>
          <button className="bg-blue-500" onClick={endGame}>
            end
          </button>
        </div>
        <Background onDimensionChange={setDimensions}></Background>
        <Bread y={breadY}></Bread>
      </div>
    </div>
  );
}

export default Game;
