import { useEffect, useState, useRef, type KeyboardEvent } from "react";
import Background from "./Backgroud";
import Bread from "./Bread";

function Game() {
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  const [breadY, setBreadY] = useState(-345);
  const [gameStarted, setGameStarted] = useState(false);
  const velocityRef = useRef(0);
  const requestAnimationRef = useRef<number>(0);
  
  const gravity = 0.5;

  //Jumping mechanism
  const jump = () => {
    velocityRef.current= -10;
  };
  const startGame = () => {
    setGameStarted(true);
  };
  const endGame = () => {
    setGameStarted(false);
    setBreadY(-345);
  };

  //central event listener
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.code === "Space") {
        event.preventDefault();
        if (!gameStarted) {
          startGame();
          jump(); // Jump on the first press too!
        } else {
          jump();
        }
      }
    };
      window.addEventListener("keydown", handleKeyDown);
      return () => {
      window.removeEventListener("keydown", handleKeyDown);
      };
  }, [gameStarted]);

  //game loop
  useEffect(()=>{
    const gameLoop =()=>{
    velocityRef.current += gravity;
    setBreadY((prev)=> prev+velocityRef.current);
    requestAnimationRef.current = requestAnimationFrame(gameLoop);
    };
    if(gameStarted){
       requestAnimationRef.current = requestAnimationFrame(gameLoop);
    }
    return ()=>{
      if(requestAnimationRef.current){
        cancelAnimationFrame(requestAnimationRef.current)
      }
    }
  })



  
  return (
    <div className="flex items-center justify-center h-screen bg-black">
      <div className="flex relative">
        <div>
          <button className="bg-blue-500" onClick={endGame}>
            end
          </button>
        </div>
        <div>
        <Background onDimensionChange={setDimensions}></Background>
        <Bread y={breadY}></Bread>
        </div>
      </div>
    </div>
  );
}
export default Game;
