import { ArrowLeft } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useCallback, useEffect, useRef, useState } from "react";

type Difficulty = "easy" | "medium" | "hard";

const DIFFICULTY_CONFIG: Record<
  Difficulty,
  { size: number; label: string; emoji: string }
> = {
  easy: { size: 3, label: "Easy", emoji: "😊" },
  medium: { size: 4, label: "Medium", emoji: "🤔" },
  hard: { size: 5, label: "Hard", emoji: "🔥" },
};

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function buildGrid(size: number): number[] {
  return shuffle(Array.from({ length: size * size }, (_, i) => i + 1));
}

export default function NumberOrderGame({ onBack }: { onBack: () => void }) {
  const [difficulty, setDifficulty] = useState<Difficulty | null>(null);
  const [grid, setGrid] = useState<number[]>([]);
  const [nextTarget, setNextTarget] = useState(1);
  const [cleared, setCleared] = useState<Set<number>>(new Set());
  const [shaking, setShaking] = useState<number | null>(null);
  const [elapsed, setElapsed] = useState(0);
  const [finished, setFinished] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const startGame = useCallback((diff: Difficulty) => {
    const { size } = DIFFICULTY_CONFIG[diff];
    setDifficulty(diff);
    setGrid(buildGrid(size));
    setNextTarget(1);
    setCleared(new Set());
    setElapsed(0);
    setFinished(false);
    setShaking(null);
  }, []);

  // Timer
  useEffect(() => {
    if (!difficulty || finished) return;
    timerRef.current = setInterval(() => setElapsed((e) => e + 1), 1000);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [difficulty, finished]);

  const handleTap = useCallback(
    (num: number) => {
      if (cleared.has(num) || finished) return;
      if (num === nextTarget) {
        const newCleared = new Set(cleared).add(num);
        setCleared(newCleared);
        const size = DIFFICULTY_CONFIG[difficulty!].size;
        const total = size * size;
        if (num === total) {
          setFinished(true);
          if (timerRef.current) clearInterval(timerRef.current);
        } else {
          setNextTarget(num + 1);
        }
      } else {
        setShaking(num);
        setTimeout(() => setShaking(null), 400);
      }
    },
    [cleared, finished, nextTarget, difficulty],
  );

  const formatTime = (s: number) =>
    `${Math.floor(s / 60)
      .toString()
      .padStart(2, "0")}:${(s % 60).toString().padStart(2, "0")}`;

  if (!difficulty) {
    return (
      <div
        className="fixed inset-0 z-50 flex flex-col overflow-hidden"
        style={{
          background:
            "linear-gradient(160deg, oklch(0.97 0.025 130), oklch(0.95 0.03 200), oklch(0.97 0.02 260))",
        }}
      >
        <div className="flex items-center justify-between px-4 pt-12 pb-2">
          <button
            type="button"
            data-ocid="numberorder.close_button"
            onClick={onBack}
            className="p-2 rounded-full bg-white/60 backdrop-blur-sm"
            style={{ touchAction: "manipulation" }}
          >
            <ArrowLeft
              className="w-5 h-5"
              style={{ color: "oklch(0.45 0.10 280)" }}
            />
          </button>
          <p
            className="text-sm font-bold"
            style={{ color: "oklch(0.40 0.10 200)" }}
          >
            Number Rush 🔢
          </p>
          <div className="w-9" />
        </div>

        <div className="flex-1 flex flex-col items-center justify-center px-6 gap-5">
          <div className="text-center mb-4">
            <p className="text-5xl mb-3">🔢</p>
            <h2
              className="text-2xl font-black"
              style={{ color: "oklch(0.35 0.10 200)" }}
            >
              Number Rush
            </h2>
            <p
              className="text-sm mt-2"
              style={{ color: "oklch(0.55 0.07 200)" }}
            >
              Tap numbers 1 → N in order as fast as you can!
            </p>
          </div>

          {(["easy", "medium", "hard"] as Difficulty[]).map((diff) => {
            const cfg = DIFFICULTY_CONFIG[diff];
            return (
              <motion.button
                key={diff}
                type="button"
                data-ocid={`numberorder.${diff}.button`}
                whileTap={{ scale: 0.96 }}
                onPointerDown={() => startGame(diff)}
                className="w-full max-w-xs py-4 rounded-2xl font-bold text-white shadow-lg"
                style={{
                  background:
                    diff === "easy"
                      ? "linear-gradient(135deg, oklch(0.72 0.12 150), oklch(0.68 0.10 200))"
                      : diff === "medium"
                        ? "linear-gradient(135deg, oklch(0.72 0.12 60), oklch(0.68 0.10 40))"
                        : "linear-gradient(135deg, oklch(0.72 0.15 355), oklch(0.68 0.14 330))",
                  touchAction: "manipulation",
                }}
              >
                {cfg.emoji} {cfg.label} ({cfg.size}×{cfg.size})
              </motion.button>
            );
          })}
        </div>
      </div>
    );
  }

  const size = DIFFICULTY_CONFIG[difficulty].size;

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col overflow-hidden select-none"
      style={{
        background:
          "linear-gradient(160deg, oklch(0.97 0.025 130), oklch(0.95 0.03 200), oklch(0.97 0.02 260))",
      }}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 pt-12 pb-2">
        <button
          type="button"
          data-ocid="numberorder.close_button"
          onClick={() => setDifficulty(null)}
          className="p-2 rounded-full bg-white/60 backdrop-blur-sm"
          style={{ touchAction: "manipulation" }}
        >
          <ArrowLeft
            className="w-5 h-5"
            style={{ color: "oklch(0.45 0.10 280)" }}
          />
        </button>
        <div className="text-center">
          <p
            className="text-sm font-bold"
            style={{ color: "oklch(0.40 0.10 200)" }}
          >
            Number Rush 🔢
          </p>
          <p
            className="text-xs font-bold"
            style={{ color: "oklch(0.55 0.07 200)" }}
          >
            {DIFFICULTY_CONFIG[difficulty].label} · Next:{" "}
            <span style={{ color: "oklch(0.50 0.14 355)" }}>{nextTarget}</span>
          </p>
        </div>
        <div
          className="text-sm font-black px-3 py-1 rounded-full bg-white/60"
          style={{ color: "oklch(0.40 0.08 200)" }}
        >
          ⏱ {formatTime(elapsed)}
        </div>
      </div>

      {/* Grid */}
      <div
        className="flex-1 flex items-center justify-center px-4"
        style={{ touchAction: "none" }}
      >
        <div
          className="grid gap-2"
          style={{
            gridTemplateColumns: `repeat(${size}, 1fr)`,
            width: "min(90vw, 380px)",
          }}
        >
          <AnimatePresence>
            {grid.map((num) => {
              const isCleared = cleared.has(num);
              const isShaking = shaking === num;
              return (
                <motion.button
                  key={num}
                  type="button"
                  data-ocid="numberorder.canvas_target"
                  animate={isShaking ? { x: [0, -6, 6, -4, 4, 0] } : { x: 0 }}
                  exit={{ scale: 0, opacity: 0 }}
                  transition={{ duration: 0.35 }}
                  onPointerDown={() => !isCleared && handleTap(num)}
                  whileTap={!isCleared ? { scale: 0.88 } : {}}
                  className="aspect-square rounded-2xl font-black text-lg flex items-center justify-center shadow-sm transition-all"
                  style={{
                    background: isCleared
                      ? "linear-gradient(135deg, oklch(0.78 0.12 150), oklch(0.72 0.12 170))"
                      : num === nextTarget
                        ? "linear-gradient(135deg, oklch(0.96 0.08 60), oklch(0.92 0.10 40))"
                        : "oklch(0.97 0.02 200 / 0.9)",
                    color: isCleared
                      ? "white"
                      : num === nextTarget
                        ? "oklch(0.40 0.12 40)"
                        : "oklch(0.45 0.08 200)",
                    border: isCleared
                      ? "none"
                      : num === nextTarget
                        ? "2px solid oklch(0.80 0.12 60)"
                        : "1px solid oklch(0.88 0.04 200 / 0.6)",
                    opacity: isCleared ? 0.4 : 1,
                    touchAction: "manipulation",
                    pointerEvents: isCleared ? "none" : "auto",
                  }}
                >
                  {isCleared ? "✓" : num}
                </motion.button>
              );
            })}
          </AnimatePresence>
        </div>
      </div>

      {/* Finished overlay */}
      <AnimatePresence>
        {finished && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 flex flex-col items-center justify-center"
            style={{
              background: "rgba(255,255,255,0.88)",
              backdropFilter: "blur(14px)",
              zIndex: 10,
            }}
          >
            <motion.div
              initial={{ scale: 0.7, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              className="text-center px-8"
            >
              <div className="text-6xl mb-4">🏆</div>
              <p
                className="font-black text-2xl mb-2"
                style={{ color: "oklch(0.35 0.12 200)" }}
              >
                Nice work!
              </p>
              <p
                className="text-base font-bold mb-1"
                style={{ color: "oklch(0.50 0.10 150)" }}
              >
                {formatTime(elapsed)}
              </p>
              <p
                className="text-sm mb-6"
                style={{ color: "oklch(0.55 0.07 200)" }}
              >
                {elapsed < 30
                  ? "Lightning fast! ⚡"
                  : elapsed < 60
                    ? "Super speedy! 🚀"
                    : "Keep practicing, you're getting there! 💪"}
              </p>
              <div className="flex gap-3 justify-center">
                <button
                  type="button"
                  data-ocid="numberorder.primary_button"
                  onPointerDown={() => startGame(difficulty)}
                  className="px-6 py-3 rounded-2xl font-bold text-white shadow-lg"
                  style={{
                    background:
                      "linear-gradient(135deg, oklch(0.72 0.12 150), oklch(0.68 0.12 200))",
                    touchAction: "manipulation",
                  }}
                >
                  Play Again 🔢
                </button>
                <button
                  type="button"
                  data-ocid="numberorder.secondary_button"
                  onPointerDown={() => setDifficulty(null)}
                  className="px-6 py-3 rounded-2xl font-bold shadow-lg"
                  style={{
                    background: "oklch(0.95 0.03 200)",
                    color: "oklch(0.40 0.10 200)",
                    touchAction: "manipulation",
                  }}
                >
                  Change Level
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <p
        className="text-center text-xs pb-6 font-medium"
        style={{ color: "oklch(0.60 0.07 200)" }}
      >
        Tap numbers in order 1 → {size * size} 🔢
      </p>
    </div>
  );
}
