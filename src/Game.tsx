import { useEffect, useState, useRef, useCallback } from "react";
import Background from "./Backgroud";
import Bread from "./Bread";
import FirePipe from "./FirePipe";
import { getVisibleInsets } from "./getVisibleInsets";

// Baseline dimensions the game was originally designed for
const BASELINE_HEIGHT = 900;
const BASELINE_WIDTH = 600;

// Design-time constants (will be scaled at runtime)
const BASE_GRAVITY = 0.5;
const BASE_JUMP_VELOCITY = -10;
const BASE_PIPE_WIDTH = 80;
const BASE_PIPE_HEIGHT = 500;
const BASE_GAP_SIZE = 200;
const BASE_PIPE_SPEED = 3;
const BASE_PIPE_SPAWN_DIST = 400;
const BASE_PIPE_CLEANUP = -500;
const BASE_BREAD_WIDTH = 112; // w-28 = 7rem = 112px at default font size

function Game() {
  const [backgroundDimensions, setBackgroundDimensions] = useState({ width: 0, height: 0 });
  const [breadDimensions, setBreadDimensions] = useState({ width: 0, height: 0 });
  const [breadY, setBreadY] = useState(0);
  const [gameStarted, setGameStarted] = useState(false);
  const [gamePaused, setGamePaused] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [pipes, setPipes] = useState<{ x: number; gapY: number; scored: boolean }[]>([]);
  const [score, setScore] = useState(0);
  const [isMobile, setIsMobile] = useState(false);
  const velocityRef = useRef(0);
  const breadRef = useRef<HTMLDivElement>(null);
  const pipeContainerRef = useRef<HTMLDivElement>(null);
  const gameAreaRef = useRef<HTMLDivElement>(null);

  // Audio refs
  const fireSoundRef = useRef<HTMLAudioElement | null>(null);
  const jumpSoundRef = useRef<HTMLAudioElement | null>(null);
  const deathSoundRef = useRef<HTMLAudioElement | null>(null);
  const jumpTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Stores the visible insets (fraction of transparent padding) for bread and pipe PNGs
  const breadInsetsRef = useRef({ top: 0, bottom: 0, left: 0, right: 0 });
  const pipeInsetsRef = useRef({ top: 0, bottom: 0, left: 0, right: 0 });
  const [insetsReady, setInsetsReady] = useState(false);

  // Separate scale factors for vertical (height-based) and horizontal (width-based) things
  const vScale = backgroundDimensions.height > 0
    ? backgroundDimensions.height / BASELINE_HEIGHT
    : 1;
  const hScale = backgroundDimensions.width > 0
    ? backgroundDimensions.width / BASELINE_WIDTH
    : 1;

  // Vertical constants — scale with height
  const gravity = BASE_GRAVITY * vScale;
  const GAP_SIZE = BASE_GAP_SIZE * vScale;
  const PIPE_HEIGHT = BASE_PIPE_HEIGHT * vScale;
  // Horizontal constants — scale with width
  const PIPE_WIDTH = BASE_PIPE_WIDTH * hScale;
  const speedMultiplier = 1 + Math.min(score * 0.1 / 5, 1.5); // 10% faster every 5 pts, max 2.5x
  const PIPE_SPEED = BASE_PIPE_SPEED * hScale * speedMultiplier;
  const PIPE_SPAWN_DIST = BASE_PIPE_SPAWN_DIST * hScale;
  const PIPE_CLEANUP = BASE_PIPE_CLEANUP * hScale;
  const BREAD_WIDTH = BASE_BREAD_WIDTH * hScale;
  const backgroundTop = -(backgroundDimensions.height) - (breadDimensions.height / 3);
  const backgroundBottom = -(breadDimensions.height) + (breadDimensions.height / 5);

  // Detect mobile
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  // Initialize audio
  useEffect(() => {
    const fire = new Audio("/fire sound.mp3");
    fire.volume = 0.015; // 🔊 Fire volume: 0.0 (silent) to 1.0 (max)
    // Loop the fire sound but skip the last second for a clean loop
    fire.addEventListener("timeupdate", () => {
      if (fire.duration && fire.currentTime >= fire.duration - 1) {
        fire.currentTime = 0;
      }
    });
    fireSoundRef.current = fire;

    const jump = new Audio("/jump sound.mp3");
    jump.volume = 0.1;
    jumpSoundRef.current = jump;

    const death = new Audio("/death sound.mp3");
    death.volume = 0.2;
    deathSoundRef.current = death;

    return () => {
      fire.pause();
      jump.pause();
      death.pause();
    };
  }, []);

  // Scan PNG images once they load to find actual visible bounds
  useEffect(() => {
    const breadImg = new Image();
    breadImg.crossOrigin = "anonymous";
    breadImg.src = "/bread.png";
    breadImg.onload = () => {
      breadInsetsRef.current = getVisibleInsets(breadImg);
    };

    const pipeImg = new Image();
    pipeImg.crossOrigin = "anonymous";
    pipeImg.src = "/Fire pipe.png";
    pipeImg.onload = () => {
      pipeInsetsRef.current = getVisibleInsets(pipeImg);
      setInsetsReady(true);
    };
  }, []);

  const jump = () => {
    velocityRef.current = BASE_JUMP_VELOCITY * vScale;

    // Play first 1 second of jump sound
    const snd = jumpSoundRef.current;
    if (snd) {
      if (jumpTimeoutRef.current) clearTimeout(jumpTimeoutRef.current);
      snd.currentTime = 0;
      snd.play().catch(() => {});
      jumpTimeoutRef.current = setTimeout(() => snd.pause(), 1000);
    }
  };

  const startGame = () => {
    setGameStarted(true);
    setGameOver(false);
    // Start fire background sound
    fireSoundRef.current?.play().catch(() => {});
  };

  const endGame = useCallback(() => {
    setGameStarted(false);
    setGameOver(true);
    setGamePaused(false);
    velocityRef.current = 0;
    setPipes([]);
    // Stop fire sound, play death sound
    fireSoundRef.current?.pause();
    deathSoundRef.current!.currentTime = 0.5; // ⏱️ Death sound start: seconds (0.2 = 200ms)
    deathSoundRef.current?.play().catch(() => {});
  }, []);

  const restartGame = useCallback(() => {
    setGameOver(false);
    setGameStarted(false);
    setGamePaused(false);
    velocityRef.current = 0;
    setBreadY(-(backgroundDimensions.height / 2) - (breadDimensions.height / 2));
    setPipes([]);
    setScore(0);
  }, [backgroundDimensions.height, breadDimensions.height]);

  const togglePause = () => {
    setGamePaused((prev) => !prev);
  };

  // Handle jump input (shared between keyboard, touch, and click)
  const handleJumpInput = useCallback(() => {
    if (gameOver) return;
    if (!gameStarted) {
      startGame();
      jump();
    } else {
      jump();
    }
  }, [gameStarted, gameOver, vScale]);

  useEffect(() => {
    if (backgroundDimensions.height > 0) {
      const startBreadY = -(backgroundDimensions.height / 2) - (breadDimensions.height / 2);
      setBreadY(startBreadY);
    }
  }, [backgroundDimensions.height, breadDimensions.height]);

  // Keyboard controls
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.code === "Space") {
        event.preventDefault();
        handleJumpInput();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [handleJumpInput]);

  // Touch / pointer controls for mobile
  useEffect(() => {
    const el = gameAreaRef.current;
    if (!el) return;

    const handleTouch = (e: TouchEvent) => {
      // Let button taps through (game-over "Play Again", etc.)
      const target = e.target as HTMLElement;
      if (target.closest("button")) return;

      e.preventDefault();
      handleJumpInput();
    };

    el.addEventListener("touchstart", handleTouch, { passive: false });
    return () => {
      el.removeEventListener("touchstart", handleTouch);
    };
  }, [handleJumpInput]);

  const SpawPipes = () => {
    return (
      <div>
        {pipes.map((pipe, index) => {
          const topPipeY = pipe.gapY - GAP_SIZE / 2 - PIPE_HEIGHT;
          const bottomPipeY = pipe.gapY + GAP_SIZE / 2;
          return (
            <div key={index}>
              <FirePipe angle={180} x={pipe.x} y={topPipeY} height={PIPE_HEIGHT} />
              <FirePipe angle={0} x={pipe.x} y={bottomPipeY} height={PIPE_HEIGHT} />
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

          pipeImages.forEach((pipeImg) => {
            const rawPipe = pipeImg.getBoundingClientRect();
            const pipeRect = getTrimmedRect(rawPipe, pipeInsetsRef.current);

            // AABB overlap check on the TRIMMED rectangles
            if (
              breadRect.left < pipeRect.right &&
              breadRect.right > pipeRect.left &&
              breadRect.top < pipeRect.bottom &&
              breadRect.bottom > pipeRect.top
            ) {
              isDead = true;
            }
          });
        }
      }

      if (isDead) {
        endGame();
        return;
      }

      // Move pipes and check for scoring
      setPipes((prevPipes) => {
        let newPipes = prevPipes.map((pipe) => {
          const newX = pipe.x - PIPE_SPEED;
          // Score when pipe's right edge passes the bread (at x ≈ 0)
          if (!pipe.scored && newX + PIPE_WIDTH < 0) {
            setScore((s) => s + 1);
            return { ...pipe, x: newX, scored: true };
          }
          return { ...pipe, x: newX };
        });
        newPipes = newPipes.filter((pipe) => pipe.x > PIPE_CLEANUP);

        if (
          newPipes.length === 0 ||
          newPipes[newPipes.length - 1].x < backgroundDimensions.width - PIPE_SPAWN_DIST
        ) {
          // Clamp gapY so both pipes always extend off-screen (no exploitable gaps)
          const minGap = PIPE_HEIGHT + GAP_SIZE / 2;
          const maxGap = backgroundDimensions.height - PIPE_HEIGHT - GAP_SIZE / 2;
          const safeMin = Math.min(minGap, maxGap);
          const safeMax = Math.max(minGap, maxGap);
          const randomGapY = Math.floor(Math.random() * (safeMax - safeMin)) + safeMin;
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
  }, [gameStarted, gamePaused, backgroundDimensions, pipes, breadY, backgroundBottom, backgroundTop, breadDimensions, endGame, insetsReady, vScale, hScale, gravity, PIPE_WIDTH, PIPE_HEIGHT, GAP_SIZE, PIPE_SPEED, PIPE_SPAWN_DIST, PIPE_CLEANUP]);

  // Game Over overlay
  const GameOverScreen = () => {
    if (!gameOver) return null;
    return (
      <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
        <div className="bg-gray-900 rounded-2xl px-8 py-10 border border-amber-500/40 shadow-2xl shadow-amber-500/20 text-center max-w-xs mx-4">
          <p className="text-amber-400 text-sm font-mono tracking-widest uppercase mb-1">Game Over</p>
          <p className="text-white text-6xl font-bold font-mono mb-2">{score}</p>
          <p className="text-gray-400 text-xs mb-6">points</p>
          <button
            className="w-full px-6 py-3 rounded-lg font-bold text-base transition-all
              bg-amber-500 hover:bg-amber-400 text-black shadow-md
              active:scale-95 cursor-pointer"
            onClick={restartGame}
          >
            🔃 Play Again
          </button>
        </div>
      </div>
    );
  };

  // Tap-to-start overlay (shown when game hasn't started and not game over)
  const StartScreen = () => {
    if (gameStarted || gameOver) return null;
    return (
      <div className="absolute inset-0 z-40 flex items-center justify-center">
        <div className="text-center animate-pulse">
          <p className="text-white text-2xl font-bold drop-shadow-lg mb-2">
            {isMobile ? "Tap to Start" : "Press Space to Start"}
          </p>
          <p className="text-gray-300 text-sm drop-shadow">
            {isMobile ? "Tap to flap" : "Space to flap"}
          </p>
        </div>
      </div>
    );
  };

  return (
    <div className="flex items-center justify-center h-dvh bg-black overflow-hidden">
      <div className={`flex ${isMobile ? "flex-col" : "flex-row"} items-start gap-4 md:gap-6`}>
        {/* Control Panel — desktop only */}
        {!isMobile && (
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
              onClick={restartGame}
            >
              🔃 Reset
            </button>
          </div>
        )}

        {/* Game Area */}
        <div ref={gameAreaRef} className="relative overflow-hidden select-none touch-none">
          <Background onDimensionChange={setBackgroundDimensions} />
          <div ref={breadRef}>
            {backgroundDimensions.height > 0 && (
              <Bread y={breadY} width={BREAD_WIDTH} onDimensionChange={setBreadDimensions} />
            )}
          </div>
          <div ref={pipeContainerRef}>{SpawPipes()}</div>

          {/* Mobile: floating score during gameplay */}
          {isMobile && gameStarted && !gameOver && (
            <div className="absolute top-4 left-1/2 -translate-x-1/2 z-30">
              <p className="text-white text-5xl font-bold font-mono drop-shadow-lg"
                style={{ textShadow: "0 2px 8px rgba(0,0,0,0.7)" }}>
                {score}
              </p>
            </div>
          )}

          <StartScreen />
          <GameOverScreen />
        </div>
      </div>
    </div>
  );
}

export default Game;
