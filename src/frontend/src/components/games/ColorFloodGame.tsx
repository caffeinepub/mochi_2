import { ArrowLeft } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useCallback, useRef, useState } from "react";

const GRID_SIZE = 8;
const MAX_MOVES = 25;
const NUM_COLORS = 5;

// Pastel OKLCH colors
const COLORS = [
  { bg: "oklch(0.88 0.09 355)", label: "pink" },
  { bg: "oklch(0.84 0.08 290)", label: "lavender" },
  { bg: "oklch(0.88 0.09 150)", label: "mint" },
  { bg: "oklch(0.90 0.10 60)", label: "peach" },
  { bg: "oklch(0.88 0.09 215)", label: "sky" },
];

// Stable cell IDs — positions never reorder, epoch resets on new game
function buildCells(epoch: number): { id: string; color: number }[] {
  return Array.from({ length: GRID_SIZE * GRID_SIZE }, (_, i) => ({
    id: `cell-${epoch}-${i}`,
    color: Math.floor(Math.random() * NUM_COLORS),
  }));
}

function floodFill(
  cells: { id: string; color: number }[],
  targetColor: number,
): { id: string; color: number }[] {
  const newCells = cells.map((c) => ({ ...c }));
  const baseColor = newCells[0].color;
  if (baseColor === targetColor) return newCells;

  const stack = [0];
  const visited = new Set<number>();

  while (stack.length > 0) {
    const idx = stack.pop()!;
    if (visited.has(idx)) continue;
    visited.add(idx);
    if (newCells[idx].color !== baseColor) continue;
    newCells[idx] = { ...newCells[idx], color: targetColor };

    const row = Math.floor(idx / GRID_SIZE);
    const col = idx % GRID_SIZE;
    if (row > 0) stack.push(idx - GRID_SIZE);
    if (row < GRID_SIZE - 1) stack.push(idx + GRID_SIZE);
    if (col > 0) stack.push(idx - 1);
    if (col < GRID_SIZE - 1) stack.push(idx + 1);
  }

  return newCells;
}

function checkWon(cells: { id: string; color: number }[]): boolean {
  return cells.every((c) => c.color === cells[0].color);
}

export default function ColorFloodGame({ onBack }: { onBack: () => void }) {
  const epochRef = useRef(0);
  const [cells, setCells] = useState(() => buildCells(epochRef.current));
  const [movesLeft, setMovesLeft] = useState(MAX_MOVES);
  const [won, setWon] = useState(false);
  const [lost, setLost] = useState(false);
  const [movesTaken, setMovesTaken] = useState(0);

  const handleColorPick = useCallback(
    (colorIdx: number) => {
      if (won || lost) return;
      const newCells = floodFill(cells, colorIdx);
      const newMovesLeft = movesLeft - 1;
      const newMovesTaken = movesTaken + 1;

      setCells(newCells);
      setMovesLeft(newMovesLeft);
      setMovesTaken(newMovesTaken);

      if (checkWon(newCells)) {
        setWon(true);
      } else if (newMovesLeft <= 0) {
        setLost(true);
      }
    },
    [cells, movesLeft, movesTaken, won, lost],
  );

  const handleReset = useCallback(() => {
    epochRef.current += 1;
    setCells(buildCells(epochRef.current));
    setMovesLeft(MAX_MOVES);
    setWon(false);
    setLost(false);
    setMovesTaken(0);
  }, []);

  const currentColor = cells[0]?.color ?? 0;
  const cellSize = Math.floor(
    Math.min(360, window.innerWidth - 32) / GRID_SIZE,
  );

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col overflow-hidden select-none"
      style={{
        background:
          "linear-gradient(160deg, oklch(0.97 0.03 60), oklch(0.95 0.04 355), oklch(0.97 0.02 290))",
      }}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 pt-12 pb-2">
        <button
          type="button"
          data-ocid="colorflood.close_button"
          onPointerDown={onBack}
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
            style={{ color: "oklch(0.40 0.10 355)" }}
          >
            Color Flood 🎨
          </p>
          <p
            className="text-xs font-bold"
            style={{ color: "oklch(0.55 0.08 355)" }}
          >
            {movesLeft} moves left
          </p>
        </div>
        <button
          type="button"
          data-ocid="colorflood.secondary_button"
          onPointerDown={handleReset}
          className="text-xs font-bold px-3 py-1.5 rounded-full bg-white/60"
          style={{ color: "oklch(0.45 0.10 355)", touchAction: "manipulation" }}
        >
          New
        </button>
      </div>

      {/* Moves bar */}
      <div className="px-6 pb-3">
        <div className="h-2.5 rounded-full bg-white/40 overflow-hidden">
          <motion.div
            className="h-full rounded-full"
            animate={{ width: `${(movesLeft / MAX_MOVES) * 100}%` }}
            transition={{ duration: 0.3 }}
            style={{
              background:
                movesLeft > 10
                  ? "linear-gradient(90deg, oklch(0.78 0.14 150), oklch(0.76 0.12 200))"
                  : movesLeft > 5
                    ? "linear-gradient(90deg, oklch(0.80 0.14 60), oklch(0.76 0.14 40))"
                    : "linear-gradient(90deg, oklch(0.72 0.16 355), oklch(0.68 0.16 330))",
            }}
          />
        </div>
      </div>

      {/* Grid */}
      <div className="flex-1 flex flex-col items-center justify-center gap-5">
        <div
          className="rounded-2xl overflow-hidden shadow-xl"
          style={{
            display: "grid",
            gridTemplateColumns: `repeat(${GRID_SIZE}, ${cellSize}px)`,
            gap: 2,
            padding: 6,
            background: "oklch(0.95 0.02 290 / 0.6)",
            backdropFilter: "blur(8px)",
          }}
        >
          {cells.map((cell) => (
            <motion.div
              key={cell.id}
              animate={{ backgroundColor: COLORS[cell.color].bg }}
              transition={{ duration: 0.2 }}
              style={{
                width: cellSize,
                height: cellSize,
                borderRadius: 4,
                backgroundColor: COLORS[cell.color].bg,
              }}
            />
          ))}
        </div>

        {/* Color picker */}
        <div className="flex gap-3">
          {COLORS.map((color, idx) => (
            <motion.button
              key={color.label}
              type="button"
              data-ocid="colorflood.canvas_target"
              whileTap={{ scale: 0.88 }}
              onPointerDown={() => handleColorPick(idx)}
              className="rounded-full shadow-lg transition-all"
              style={{
                width: 52,
                height: 52,
                background: color.bg,
                border:
                  currentColor === idx
                    ? "3px solid oklch(0.35 0.12 290)"
                    : "3px solid transparent",
                boxShadow:
                  currentColor === idx
                    ? `0 0 0 2px white, 0 4px 12px ${color.bg}`
                    : `0 3px 10px ${color.bg}`,
                touchAction: "manipulation",
              }}
            />
          ))}
        </div>
      </div>

      {/* Win/Lose overlay */}
      <AnimatePresence>
        {(won || lost) && (
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
              <div className="text-6xl mb-4">{won ? "🌈" : "😢"}</div>
              <p
                className="font-black text-2xl mb-2"
                style={{ color: "oklch(0.35 0.12 290)" }}
              >
                {won ? "You Win! 🌈" : "Out of moves!"}
              </p>
              <p
                className="text-sm mb-6"
                style={{ color: "oklch(0.55 0.07 280)" }}
              >
                {won
                  ? `Completed in ${movesTaken} moves! ${
                      movesTaken <= 15
                        ? "Incredible! 🏆"
                        : movesTaken <= 20
                          ? "Well done! ⭐"
                          : "Nice job! 🎨"
                    }`
                  : "So close! Try again and plan your moves carefully 🤔"}
              </p>
              <button
                type="button"
                data-ocid="colorflood.primary_button"
                onPointerDown={handleReset}
                className="px-8 py-3.5 rounded-2xl font-bold text-white shadow-xl"
                style={{
                  background:
                    "linear-gradient(135deg, oklch(0.72 0.15 355), oklch(0.70 0.14 290))",
                  touchAction: "manipulation",
                }}
              >
                Play Again 🎨
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <p
        className="text-center text-xs pb-6 font-medium"
        style={{ color: "oklch(0.60 0.07 290)" }}
      >
        Flood the whole board with one color! 🎨
      </p>
    </div>
  );
}
