import { useEffect, useState, useRef, useCallback } from "react";
import Background from "./Backgroud";
import Bread from "./Bread";
import FirePipe from "./FirePipe";
import { getVisibleInsets } from "./getVisibleInsets";

function Game() {
  const [backgroundDimensions, setBackgroundDimensions] = useState({ width: 0, height: 0 });
  const [breadDimensions, setBreadDimensions] = useState({ width: 0, height: 0 });
  const [breadY, setBreadY] = useState(0);
  const [gameStarted, setGameStarted] = useState(false);
  const [gamePaused, setGamePaused] = useState(false);
  const [pipes, setPipes] = useState<{ x: number; gapY: number; scored: boolean }[]>([]);
  const [score, setScore] = useState(0);
  const velocityRef = useRef(0);
  const breadRef = useRef<HTMLDivElement>(null);
  const pipeContainerRef = useRef<HTMLDivElement>(null);

  // Stores the visible insets (fraction of transparent padding) for bread and pipe PNGs
  const breadInsetsRef = useRef({ top: 0, bottom: 0, left: 0, right: 0 });
  const pipeInsetsRef = useRef({ top: 0, bottom: 0, left: 0, right: 0 });
  const [insetsReady, setInsetsReady] = useState(false);

  const gravity = 0.5;
  const PIPE_WIDTH = 80;  // approximate width of the visible pipe
  const PIPE_HEIGHT = 400;
  const GAP_SIZE = 200;
  const backgroundTop = -(backgroundDimensions.height) - (breadDimensions.height / 3);
  const backgroundBottom = -(breadDimensions.height) + (breadDimensions.height / 5);

  // Scan PNG images once they load to find actual visible bounds
  useEffect(() => {
    const breadImg = new Image();
    breadImg.crossOrigin = "anonymous";
    breadImg.src = "/bread.png";
    breadImg.onload = () => {
      breadInsetsRef.current = getVisibleInsets(breadImg);
      console.log("Bread visible insets (fractions):", breadInsetsRef.current);
    };

    const pipeImg = new Image();
    pipeImg.crossOrigin = "anonymous";
    pipeImg.src = "/Fire pipe.png";
    pipeImg.onload = () => {
      pipeInsetsRef.current = getVisibleInsets(pipeImg);
      console.log("Pipe visible insets (fractions):", pipeInsetsRef.current);
      setInsetsReady(true);
    };
  }, []);

  const jump = () => {
    velocityRef.current = -10;
  };

  const startGame = () => {
    setGameStarted(true);
    console.log("Game Started !");
  };

  const endGame = useCallback(() => {
    setGameStarted(false);
    setGamePaused(false);
    velocityRef.current = 0;
    setBreadY(-(backgroundDimensions.height / 2) - (breadDimensions.height / 2));
    setPipes([]);
    setScore(0);
    console.log("Game Ended !");
  }, [backgroundDimensions.height, breadDimensions.height]);

  const togglePause = () => {
    setGamePaused((prev) => !prev);
  };

  useEffect(() => {
    if (backgroundDimensions.height > 0) {
      const startBreadY = -(backgroundDimensions.height / 2) - (breadDimensions.height / 2);
      setBreadY(startBreadY);
    }
  }, [backgroundDimensions.height, breadDimensions.height]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.code === "Space") {
        event.preventDefault();
        if (!gameStarted) {
          startGame();
          jump();
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

  const SpawPipes = () => {
    return (
      <div>
        {pipes.map((pipe, index) => {
          const topPipeY = pipe.gapY - GAP_SIZE / 2 - PIPE_HEIGHT;
          const bottomPipeY = pipe.gapY + GAP_SIZE / 2;
          return (
            <div key={index}>
              <FirePipe angle={180} x={pipe.x} y={topPipeY}></FirePipe>
              <FirePipe angle={0} x={pipe.x} y={bottomPipeY}></FirePipe>
            </div>
          );
        })}
      </div>
    );
  };

  // Helper: shrink a DOMRect by the pre-calculated inset fractions
  const getTrimmedRect = (
    rect: DOMRect,
    insets: { top: number; bottom: number; left: number; right: number }
  ) => {
    const w = rect.width;
    const h = rect.height;
    return {
      left: rect.left + w * insets.left,
      right: rect.right - w * insets.right,
      top: rect.top + h * insets.top,
      bottom: rect.bottom - h * insets.bottom,
    };
  };

  // Game loop
  useEffect(() => {
    if (!gameStarted) return;

    let animationFrameId: number;

    const gameLoop = () => {
      if (gamePaused) {
        animationFrameId = requestAnimationFrame(gameLoop);
        return;
      }

      let isDead = false;

      // 1. Floor Collision
      if (breadY > backgroundBottom) {
        isDead = true;
      }

      // 2. Pipe Collision using canvas-scanned visible bounds
      if (breadRef.current && pipeContainerRef.current && insetsReady) {
        const breadImg = breadRef.current.querySelector("img");
        if (breadImg) {
          const rawBread = breadImg.getBoundingClientRect();
          const breadRect = getTrimmedRect(rawBread, breadInsetsRef.current);

          const pipeImages = pipeContainerRef.current.querySelectorAll("img");

          pipeImages.forEach((pipeImg, i) => {
            const rawPipe = pipeImg.getBoundingClientRect();
            const pipeRect = getTrimmedRect(rawPipe, pipeInsetsRef.current);

            // AABB overlap check on the TRIMMED rectangles
            if (
              breadRect.left < pipeRect.right &&
              breadRect.right > pipeRect.left &&
              breadRect.top < pipeRect.bottom &&
              breadRect.bottom > pipeRect.top
            ) {
              console.log(`🔴 HIT pipe #${i}!`);
              console.log(`  Bread VISIBLE box: L=${breadRect.left.toFixed(0)} R=${breadRect.right.toFixed(0)} T=${breadRect.top.toFixed(0)} B=${breadRect.bottom.toFixed(0)}`);
              console.log(`  Pipe  VISIBLE box: L=${pipeRect.left.toFixed(0)} R=${pipeRect.right.toFixed(0)} T=${pipeRect.top.toFixed(0)} B=${pipeRect.bottom.toFixed(0)}`);
              isDead = true;
            }
          });
        }
      }

      if (isDead) {
        // FREEZE for debugging — change to endGame() when collision feels right
        console.log("💀 FROZEN! Inspect positions. Press End to reset.");
        return;
      }

      // Move pipes and check for scoring
      setPipes((prevPipes) => {
        let newPipes = prevPipes.map((pipe) => {
          const newX = pipe.x - 3;
          // Score when pipe's right edge passes the bread (at x ≈ 0)
          if (!pipe.scored && newX + PIPE_WIDTH < 0) {
            setScore((s) => s + 1/2);
            return { ...pipe, x: newX, scored: true };
          }
          return { ...pipe, x: newX };
        });
        newPipes = newPipes.filter((pipe) => pipe.x > -500); // let it fully slide off the left edge

        if (
          newPipes.length === 0 ||
          newPipes[newPipes.length - 1].x < backgroundDimensions.width - 400
        ) {
          // Keep gapY centered enough that both pipes are mostly visible
          const minGap = GAP_SIZE + 50;  // far enough from top
          const maxGap = backgroundDimensions.height - GAP_SIZE - 50;  // far enough from bottom
          const randomGapY = Math.floor(Math.random() * (maxGap - minGap)) + minGap;
          newPipes.push({ x: backgroundDimensions.width, gapY: randomGapY, scored: false });
        }
        return newPipes;
      });

      // Apply gravity
      velocityRef.current += gravity;
      setBreadY((prev) => {
        let nextY = prev + velocityRef.current;
        if (nextY < backgroundTop) {
          nextY = backgroundTop;
          velocityRef.current = 0;
        }
        return nextY;
      });

      animationFrameId = requestAnimationFrame(gameLoop);
    };

    animationFrameId = requestAnimationFrame(gameLoop);

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [gameStarted, gamePaused, backgroundDimensions, pipes, breadY, backgroundBottom, backgroundTop, breadDimensions, endGame, insetsReady]);

  return (
    <div className="flex items-center justify-center h-screen bg-black overflow-hidden">
      <div className="flex items-start gap-6">
        {/* Control Panel — LEFT side, outside the game */}
        <div className="flex flex-col gap-3 min-w-[160px] pt-4">
          {/* Score */}
          <div className="bg-gray-900 rounded-xl px-5 py-3 border border-amber-500/30 shadow-lg shadow-amber-500/10">
            <p className="text-amber-400 text-xs font-mono tracking-widest uppercase">Score</p>
            <p className="text-white text-4xl font-bold font-mono mt-1">{score}</p>
          </div>
          {/* Buttons */}
          <button
            className="w-full px-4 py-2.5 rounded-lg font-bold text-sm transition-all
              bg-amber-500 hover:bg-amber-400 text-black shadow-md
              active:scale-95 cursor-pointer"
            onClick={togglePause}
          >
            {gamePaused ? "▶ Resume" : "⏸ Pause"}
          </button>
          <button
            className="w-full px-4 py-2.5 rounded-lg font-bold text-sm transition-all
              bg-red-600 hover:bg-red-500 text-white shadow-md
              active:scale-95 cursor-pointer"
            onClick={endGame}
          >
            🔃 Reset
          </button>
          {/* Debug info */}
          <div className="bg-gray-900/80 rounded-lg px-3 py-2 border border-gray-700 text-xs text-gray-400 font-mono">
            <p>breadY: {breadY.toFixed(0)}</p>
            <p>pipes: {pipes.length}</p>
            <p>{gameStarted ? (gamePaused ? "⏸ PAUSED" : "▶ RUNNING") : "⏹ STOPPED"}</p>
          </div>
        </div>

        {/* Game Area — overflow hidden clips pipes to the background */}
        <div className="relative overflow-hidden">
          <Background onDimensionChange={setBackgroundDimensions}></Background>
          <div ref={breadRef}>
            {backgroundDimensions.height > 0 && (
              <Bread y={breadY} onDimensionChange={setBreadDimensions}></Bread>
            )}
          </div>
          <div ref={pipeContainerRef}>{SpawPipes()}</div>
        </div>
      </div>
    </div>
  );
}
export default Game;
