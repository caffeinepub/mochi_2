import { ArrowLeft, Heart, RefreshCw } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useCallback, useEffect, useRef, useState } from "react";

const LEVEL_CONFIG = [
  { spawnMs: 2200, liveMs: 2800, maxShapes: 2, pointsNeeded: 20 },
  { spawnMs: 1800, liveMs: 2400, maxShapes: 3, pointsNeeded: 20 },
  { spawnMs: 1400, liveMs: 2000, maxShapes: 3, pointsNeeded: 20 },
  { spawnMs: 1100, liveMs: 1600, maxShapes: 4, pointsNeeded: 20 },
  { spawnMs: 800, liveMs: 1300, maxShapes: 5, pointsNeeded: 20 },
];

const COLORS = [
  { bg: "oklch(0.88 0.08 355)", shadow: "oklch(0.70 0.12 355 / 0.4)" },
  { bg: "oklch(0.86 0.07 290)", shadow: "oklch(0.68 0.11 290 / 0.4)" },
  { bg: "oklch(0.88 0.07 215)", shadow: "oklch(0.70 0.10 215 / 0.4)" },
  { bg: "oklch(0.90 0.10 60)", shadow: "oklch(0.72 0.13 60 / 0.4)" },
  { bg: "oklch(0.88 0.08 150)", shadow: "oklch(0.70 0.11 150 / 0.4)" },
];

const SHAPES = ["circle", "circle", "circle", "square", "triangle"] as const;
type Shape = (typeof SHAPES)[number];

interface TapShape {
  id: number;
  x: number;
  y: number;
  size: number;
  colorIdx: number;
  shape: Shape;
  createdAt: number;
  liveMs: number;
}

let shapeIdCounter = 0;

export default function ZenTapGame({ onBack }: { onBack: () => void }) {
  const [level, setLevel] = useState(0);
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(3);
  const [shapes, setShapes] = useState<TapShape[]>([]);
  const [phase, setPhase] = useState<"playing" | "levelup" | "gameover">(
    "playing",
  );
  const gameAreaRef = useRef<HTMLDivElement>(null);
  const spawnTimer = useRef<ReturnType<typeof setInterval> | null>(null);
  const tickTimer = useRef<ReturnType<typeof setInterval> | null>(null);

  const cfg = LEVEL_CONFIG[level] ?? LEVEL_CONFIG[LEVEL_CONFIG.length - 1];

  const spawnShape = useCallback(() => {
    if (!gameAreaRef.current) return;
    const rect = gameAreaRef.current.getBoundingClientRect();
    const size = 52 + Math.random() * 24;
    const x = Math.random() * (rect.width - size - 16) + 8;
    const y = Math.random() * (rect.height - size - 16) + 8;
    const shape: TapShape = {
      id: ++shapeIdCounter,
      x,
      y,
      size,
      colorIdx: Math.floor(Math.random() * COLORS.length),
      shape: SHAPES[Math.floor(Math.random() * SHAPES.length)],
      createdAt: Date.now(),
      liveMs: cfg.liveMs,
    };
    setShapes((prev) => {
      if (prev.length >= cfg.maxShapes) return prev;
      return [...prev, shape];
    });
  }, [cfg]);

  // Tick: remove expired shapes, deduct lives
  useEffect(() => {
    if (phase !== "playing") return;
    tickTimer.current = setInterval(() => {
      const now = Date.now();
      setShapes((prev) => {
        const expired = prev.filter((s) => now - s.createdAt > s.liveMs);
        if (expired.length > 0) {
          setLives((l) => {
            const next = l - expired.length;
            if (next <= 0) {
              setPhase("gameover");
              return 0;
            }
            return next;
          });
          return prev.filter((s) => now - s.createdAt <= s.liveMs);
        }
        return prev;
      });
    }, 200);
    return () => {
      if (tickTimer.current) clearInterval(tickTimer.current);
    };
  }, [phase]);

  // Spawn timer
  useEffect(() => {
    if (phase !== "playing") return;
    spawnShape();
    spawnTimer.current = setInterval(spawnShape, cfg.spawnMs);
    return () => {
      if (spawnTimer.current) clearInterval(spawnTimer.current);
    };
  }, [phase, cfg.spawnMs, spawnShape]);

  const handleTap = useCallback(
    (id: number) => {
      setShapes((prev) => prev.filter((s) => s.id !== id));
      setScore((s) => {
        const next = s + 1;
        if (next >= cfg.pointsNeeded) {
          if (level >= LEVEL_CONFIG.length - 1) {
            setPhase("gameover"); // won!
          } else {
            setPhase("levelup");
          }
        }
        return next;
      });
    },
    [cfg.pointsNeeded, level],
  );

  const nextLevel = useCallback(() => {
    setLevel((l) => l + 1);
    setScore(0);
    setLives(3);
    setShapes([]);
    setPhase("playing");
  }, []);

  const restart = useCallback(() => {
    setLevel(0);
    setScore(0);
    setLives(3);
    setShapes([]);
    setPhase("playing");
  }, []);

  const isWon = phase === "gameover" && score >= cfg.pointsNeeded;

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col"
      style={{
        background:
          "linear-gradient(160deg, oklch(0.97 0.015 60), oklch(0.95 0.025 355), oklch(0.97 0.015 290))",
      }}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 pt-12 pb-2">
        <button
          type="button"
          data-ocid="zentap.close_button"
          onClick={onBack}
          className="p-2 rounded-full bg-white/60 backdrop-blur-sm hover:bg-white/80 transition-colors"
          style={{ touchAction: "manipulation" }}
        >
          <ArrowLeft
            className="w-5 h-5"
            style={{ color: "oklch(0.45 0.10 280)" }}
          />
        </button>
        <div className="text-center">
          <p
            className="text-sm font-black"
            style={{ color: "oklch(0.40 0.10 290)" }}
          >
            Zen Tap 🎯
          </p>
          <p className="text-xs" style={{ color: "oklch(0.55 0.07 290)" }}>
            Level {level + 1}/5 · Score {score}/{cfg.pointsNeeded}
          </p>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="flex gap-0.5">
            {[0, 1, 2].map((i) => (
              <Heart
                key={i}
                className={`w-4 h-4 transition-all ${i < lives ? "fill-current" : "opacity-20"}`}
                style={{ color: "oklch(0.65 0.18 355)" }}
              />
            ))}
          </div>
          <button
            type="button"
            data-ocid="zentap.secondary_button"
            onPointerDown={restart}
            className="p-1.5 rounded-full bg-white/60 backdrop-blur-sm hover:bg-white/80 transition-colors"
            style={{ touchAction: "manipulation" }}
          >
            <RefreshCw
              className="w-4 h-4"
              style={{ color: "oklch(0.45 0.10 280)" }}
            />
          </button>
        </div>
      </div>

      {/* Score bar */}
      <div className="px-6 mb-2">
        <div className="h-2 rounded-full bg-white/40 overflow-hidden">
          <motion.div
            className="h-full rounded-full"
            style={{
              background:
                "linear-gradient(90deg, oklch(0.80 0.12 355), oklch(0.78 0.12 290))",
            }}
            animate={{ width: `${(score / cfg.pointsNeeded) * 100}%` }}
            transition={{ duration: 0.25 }}
          />
        </div>
      </div>

      {/* Game area */}
      <div
        ref={gameAreaRef}
        className="flex-1 relative overflow-hidden"
        style={{ touchAction: "none" }}
      >
        <AnimatePresence>
          {shapes.map((shape) => {
            const color = COLORS[shape.colorIdx];
            const elapsed = Date.now() - shape.createdAt;
            const progress = Math.min(elapsed / shape.liveMs, 1);

            return (
              <motion.button
                key={shape.id}
                type="button"
                data-ocid="zentap.canvas_target"
                initial={{ opacity: 0, scale: 0.4 }}
                animate={{ opacity: 1 - progress * 0.3, scale: 1 }}
                exit={{ opacity: 0, scale: 1.3 }}
                transition={{ duration: 0.2 }}
                onPointerDown={() => handleTap(shape.id)}
                onClick={() => handleTap(shape.id)}
                style={{
                  position: "absolute",
                  left: shape.x,
                  top: shape.y,
                  width: shape.size,
                  height: shape.size,
                  background: color.bg,
                  boxShadow: `0 4px 20px ${color.shadow}`,
                  borderRadius:
                    shape.shape === "circle"
                      ? "50%"
                      : shape.shape === "square"
                        ? "16px"
                        : "50% 50% 50% 50% / 40% 40% 60% 60%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  cursor: "pointer",
                  border: "none",
                  outline: "none",
                  touchAction: "none",
                  transform:
                    shape.shape === "triangle" ? "rotate(180deg)" : undefined,
                }}
                whileTap={{ scale: 0.7 }}
              />
            );
          })}
        </AnimatePresence>

        {/* Overlay for level up / game over */}
        <AnimatePresence>
          {phase !== "playing" && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 flex flex-col items-center justify-center"
              style={{
                background: "rgba(255,255,255,0.85)",
                backdropFilter: "blur(12px)",
              }}
            >
              <motion.div
                initial={{ scale: 0.7, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                className="text-center px-8"
              >
                <div className="text-6xl mb-4">
                  {phase === "levelup" ? "🎉" : isWon ? "🏆" : "💔"}
                </div>
                <p
                  className="font-black text-2xl mb-2"
                  style={{ color: "oklch(0.35 0.12 290)" }}
                >
                  {phase === "levelup"
                    ? `Level ${level + 1} Clear!`
                    : isWon
                      ? "You conquered all levels!"
                      : "Game Over"}
                </p>
                <p
                  className="text-sm mb-6"
                  style={{ color: "oklch(0.55 0.07 280)" }}
                >
                  {phase === "levelup"
                    ? `Ready for Level ${level + 2}? It gets faster! 🔥`
                    : isWon
                      ? "Your focus is incredible! 🌟"
                      : "Stay calm and try again 🧘"}
                </p>
                <button
                  type="button"
                  data-ocid="zentap.primary_button"
                  onClick={phase === "levelup" ? nextLevel : restart}
                  className="px-8 py-3.5 rounded-2xl font-bold text-white shadow-xl active:scale-95 transition-transform"
                  style={{
                    background:
                      "linear-gradient(135deg, oklch(0.72 0.15 355), oklch(0.70 0.14 290))",
                    touchAction: "manipulation",
                  }}
                >
                  {phase === "levelup" ? "Next Level →" : "Play Again 🎯"}
                </button>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <p
        className="text-center text-xs pb-6 font-medium"
        style={{ color: "oklch(0.60 0.07 280)" }}
      >
        Tap shapes before they vanish! 🎯
      </p>
    </div>
  );
}
