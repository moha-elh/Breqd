import { useEffect, useState, useRef, type KeyboardEvent } from "react";
import Background from "./Backgroud";
import Bread from "./Bread";

function Game() {
  const [backgroundDimensions, setBackgroundDimensions] = useState({ width: 0, height: 0 });
  const [breadDimensions, setBreadDimensions] = useState({width:0, height:0});
  const [breadY, setBreadY] = useState(0);
  const [gameStarted, setGameStarted] = useState(false);
  const velocityRef = useRef(0);
  const requestAnimationRef = useRef<number>(0);
  
  const gravity = 0.5;
  const backgroundTop= -(backgroundDimensions.height) -(breadDimensions.height/3);
  const backgroundBottom = -(breadDimensions.height) +(breadDimensions.height/5);

  //Jumping mechanism
  const jump = () => {
    velocityRef.current= -10;
  };
  const startGame = () => {
    setGameStarted(true);
    console.log("Game Started !")

  };
  const endGame = () => {
    setGameStarted(false);
    setBreadY(-(backgroundDimensions.height/2) - (breadDimensions.height/2));
    console.log("Game Ended !")
  };
  //setting Bread Y once the background is loaded
  useEffect(()=>{
    if(backgroundDimensions.height > 0){
      const startBreadY = -(backgroundDimensions.height/2) - (breadDimensions.height/2)
    setBreadY(startBreadY);
    }
  },[backgroundDimensions.height, breadDimensions.height])

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
      console.log("bread position: ", breadY)
    if(breadY > backgroundBottom){
      endGame();
      console.log('you hit the floor !')
    }
    velocityRef.current += gravity;
    setBreadY((prev) => {
      if(prev+velocityRef.current < backgroundTop){
         console.log("you hit the top");
         setBreadY(backgroundTop);
      }
      else{
        prev+velocityRef.current;
      }
      return (prev+velocityRef.current);
    });
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
        <div className="size-50">
          <button className="bg-blue-500" onClick={endGame}>
            end
          </button>
        </div>
        <div>
        <Background onDimensionChange={setBackgroundDimensions}></Background>
        {backgroundDimensions.height > 0 && 
          (<Bread y={breadY} onDimensionChange ={setBreadDimensions}></Bread>)}

        </div>
      </div>
    </div>
  );
}
export default Game;
