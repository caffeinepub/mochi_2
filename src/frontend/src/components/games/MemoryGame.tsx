import { ArrowLeft, RefreshCw } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useCallback, useState } from "react";

const ALL_EMOJIS = [
  "🌸",
  "🌟",
  "💜",
  "🌈",
  "🎵",
  "🦋",
  "🌙",
  "☁️",
  "🍀",
  "🎯",
  "🔮",
  "🌺",
];

type Level = "easy" | "medium" | "hard";

const LEVEL_CONFIG: Record<
  Level,
  { pairs: number; cols: number; label: string; emoji: string }
> = {
  easy: { pairs: 4, cols: 4, label: "Easy", emoji: "🌸" },
  medium: { pairs: 8, cols: 4, label: "Medium", emoji: "🌟" },
  hard: { pairs: 12, cols: 4, label: "Hard", emoji: "🔥" },
};

interface Card {
  id: number;
  emoji: string;
  flipped: boolean;
  matched: boolean;
}

function createDeck(pairs: number): Card[] {
  const emojis = ALL_EMOJIS.slice(0, pairs);
  const arr = [...emojis, ...emojis];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr.map((emoji, i) => ({
    id: i,
    emoji,
    flipped: false,
    matched: false,
  }));
}

function getCardColor(emoji: string): string {
  const idx = ALL_EMOJIS.indexOf(emoji);
  const colors = [
    "linear-gradient(135deg, oklch(0.88 0.06 355), oklch(0.84 0.08 330))",
    "linear-gradient(135deg, oklch(0.88 0.06 280), oklch(0.84 0.07 260))",
    "linear-gradient(135deg, oklch(0.88 0.06 215), oklch(0.84 0.07 200))",
    "linear-gradient(135deg, oklch(0.88 0.06 130), oklch(0.84 0.07 150))",
    "linear-gradient(135deg, oklch(0.90 0.07 60), oklch(0.84 0.08 40))",
    "linear-gradient(135deg, oklch(0.88 0.06 175), oklch(0.84 0.07 185))",
    "linear-gradient(135deg, oklch(0.88 0.07 305), oklch(0.84 0.09 290))",
    "linear-gradient(135deg, oklch(0.90 0.06 85), oklch(0.84 0.08 100))",
    "linear-gradient(135deg, oklch(0.88 0.06 345), oklch(0.84 0.08 10))",
    "linear-gradient(135deg, oklch(0.88 0.08 30), oklch(0.84 0.07 50))",
    "linear-gradient(135deg, oklch(0.88 0.07 265), oklch(0.84 0.09 285))",
    "linear-gradient(135deg, oklch(0.88 0.06 160), oklch(0.84 0.07 175))",
  ];
  return colors[idx >= 0 ? idx % colors.length : 0];
}

export default function MemoryGame({ onBack }: { onBack: () => void }) {
  const [selectedLevel, setSelectedLevel] = useState<Level | null>(null);
  const [cards, setCards] = useState<Card[]>([]);
  const [flippedIds, setFlippedIds] = useState<number[]>([]);
  const [moves, setMoves] = useState(0);
  const [locked, setLocked] = useState(false);

  const startGame = useCallback((level: Level) => {
    setSelectedLevel(level);
    setCards(createDeck(LEVEL_CONFIG[level].pairs));
    setFlippedIds([]);
    setMoves(0);
    setLocked(false);
  }, []);

  const cfg = selectedLevel ? LEVEL_CONFIG[selectedLevel] : null;
  const matchedCount = cards.filter((c) => c.matched).length / 2;
  const allMatched = cfg !== null && matchedCount === (cfg?.pairs ?? 0);

  const newGame = useCallback(() => {
    setSelectedLevel(null);
    setCards([]);
    setFlippedIds([]);
    setMoves(0);
    setLocked(false);
  }, []);

  const handleFlip = (card: Card) => {
    if (
      !selectedLevel ||
      locked ||
      card.flipped ||
      card.matched ||
      flippedIds.length >= 2
    )
      return;

    const newFlippedIds = [...flippedIds, card.id];
    setCards((prev) =>
      prev.map((c) => (c.id === card.id ? { ...c, flipped: true } : c)),
    );

    if (newFlippedIds.length === 2) {
      setFlippedIds(newFlippedIds);
      setMoves((m) => m + 1);
      setLocked(true);
      const firstId = newFlippedIds[0];
      const firstCard = cards.find((c) => c.id === firstId);
      const isMatch = firstCard?.emoji === card.emoji;
      if (isMatch) {
        setTimeout(() => {
          setCards((prev) =>
            prev.map((c) =>
              c.id === firstId || c.id === card.id
                ? { ...c, matched: true, flipped: true }
                : c,
            ),
          );
          setFlippedIds([]);
          setLocked(false);
        }, 400);
      } else {
        setTimeout(() => {
          setCards((prev) =>
            prev.map((c) =>
              c.id === firstId || c.id === card.id
                ? { ...c, flipped: false }
                : c,
            ),
          );
          setFlippedIds([]);
          setLocked(false);
        }, 900);
      }
    } else {
      setFlippedIds(newFlippedIds);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col"
      style={{
        background:
          "linear-gradient(160deg, oklch(0.97 0.015 280), oklch(0.95 0.025 330), oklch(0.97 0.015 60))",
      }}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 pt-12 pb-4">
        <button
          type="button"
          data-ocid="memory.close_button"
          onPointerDown={selectedLevel ? newGame : onBack}
          style={{ touchAction: "manipulation" }}
          className="p-2 rounded-full bg-white/60 backdrop-blur-sm hover:bg-white/80 transition-colors"
        >
          <ArrowLeft
            className="w-5 h-5"
            style={{ color: "oklch(0.45 0.10 280)" }}
          />
        </button>
        <div className="text-center">
          <p
            className="text-sm font-bold"
            style={{ color: "oklch(0.40 0.10 290)" }}
          >
            Memory Match 🧠
          </p>
          {selectedLevel && (
            <p className="text-xs" style={{ color: "oklch(0.55 0.07 290)" }}>
              {LEVEL_CONFIG[selectedLevel].label} · {matchedCount}/{cfg?.pairs}{" "}
              matched · {moves} moves
            </p>
          )}
        </div>
        <button
          type="button"
          data-ocid="memory.secondary_button"
          onPointerDown={
            selectedLevel ? () => startGame(selectedLevel) : onBack
          }
          style={{ touchAction: "manipulation" }}
          className="p-2 rounded-full bg-white/60 backdrop-blur-sm hover:bg-white/80 transition-colors"
        >
          <RefreshCw
            className="w-5 h-5"
            style={{ color: "oklch(0.45 0.10 280)" }}
          />
        </button>
      </div>

      <AnimatePresence mode="wait">
        {!selectedLevel ? (
          /* Level Select Screen */
          <motion.div
            key="level-select"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="flex-1 flex flex-col items-center justify-center px-6 gap-5"
          >
            <div className="text-center mb-2">
              <p
                className="text-2xl font-black"
                style={{ color: "oklch(0.38 0.12 290)" }}
              >
                Choose Difficulty
              </p>
              <p
                className="text-sm mt-1"
                style={{ color: "oklch(0.58 0.07 280)" }}
              >
                How sharp is your memory? 🧠
              </p>
            </div>
            {(["easy", "medium", "hard"] as Level[]).map((lvl) => {
              const lc = LEVEL_CONFIG[lvl];
              return (
                <button
                  key={lvl}
                  type="button"
                  data-ocid={`memory.${lvl}.button`}
                  onPointerDown={() => startGame(lvl)}
                  className="w-full max-w-xs rounded-3xl p-5 flex items-center gap-4 active:scale-95 transition-transform"
                  style={{
                    touchAction: "manipulation",
                    background: "rgba(255,255,255,0.65)",
                    backdropFilter: "blur(16px)",
                    boxShadow: "0 4px 20px oklch(0.72 0.10 300 / 0.15)",
                  }}
                >
                  <span className="text-3xl">{lc.emoji}</span>
                  <div className="text-left">
                    <p
                      className="font-black text-base"
                      style={{ color: "oklch(0.38 0.12 290)" }}
                    >
                      {lc.label}
                    </p>
                    <p
                      className="text-xs"
                      style={{ color: "oklch(0.58 0.07 280)" }}
                    >
                      {lc.pairs} pairs · {lc.pairs * 2} cards
                    </p>
                  </div>
                </button>
              );
            })}
          </motion.div>
        ) : (
          /* Game Screen */
          <motion.div
            key="game"
            initial={{ opacity: 0, scale: 0.97 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            className="flex-1 flex flex-col"
          >
            {/* Victory */}
            <AnimatePresence>
              {allMatched && (
                <motion.div
                  initial={{ opacity: 0, y: -20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="mx-4 mb-3 rounded-2xl p-3 text-center"
                  style={{
                    background:
                      "linear-gradient(135deg, oklch(0.90 0.07 130), oklch(0.88 0.06 175))",
                  }}
                >
                  <p
                    className="font-black text-sm"
                    style={{ color: "oklch(0.28 0.12 150)" }}
                  >
                    Amazing! 🌟 {moves} moves to match them all!
                  </p>
                  {selectedLevel !== "hard" && (
                    <button
                      type="button"
                      data-ocid="memory.next_level_button"
                      onPointerDown={() =>
                        startGame(selectedLevel === "easy" ? "medium" : "hard")
                      }
                      className="mt-2 px-5 py-1.5 rounded-full text-xs font-bold text-white"
                      style={{ background: "oklch(0.52 0.14 150)" }}
                    >
                      Next Level →
                    </button>
                  )}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Grid */}
            <div className="flex-1 flex items-center justify-center px-3">
              <div
                className="grid gap-2 w-full"
                style={{
                  gridTemplateColumns: `repeat(${cfg?.cols ?? 4}, minmax(0, 1fr))`,
                  maxWidth: cfg && cfg.pairs > 8 ? "360px" : "300px",
                }}
              >
                {cards.map((card, idx) => (
                  <motion.button
                    key={card.id}
                    type="button"
                    data-ocid={`memory.item.${idx + 1}`}
                    onPointerDown={() => handleFlip(card)}
                    className="relative aspect-square rounded-2xl focus:outline-none"
                    style={{ perspective: 600, touchAction: "manipulation" }}
                    whileTap={
                      !card.matched && !card.flipped ? { scale: 0.92 } : {}
                    }
                  >
                    <motion.div
                      className="w-full h-full relative"
                      animate={{
                        rotateY: card.flipped || card.matched ? 180 : 0,
                      }}
                      transition={{ duration: 0.35, ease: "easeInOut" }}
                      style={{ transformStyle: "preserve-3d" }}
                    >
                      {/* Back face */}
                      <div
                        className="absolute inset-0 rounded-2xl flex items-center justify-center"
                        style={{
                          backfaceVisibility: "hidden",
                          background:
                            "linear-gradient(135deg, oklch(0.80 0.07 280), oklch(0.72 0.10 300))",
                          boxShadow: "0 2px 8px oklch(0.72 0.10 300 / 0.25)",
                        }}
                      >
                        <span
                          className="text-lg font-black"
                          style={{ color: "oklch(0.96 0.02 290)" }}
                        >
                          ?
                        </span>
                      </div>
                      {/* Front face */}
                      <div
                        className="absolute inset-0 rounded-2xl flex items-center justify-center"
                        style={{
                          backfaceVisibility: "hidden",
                          transform: "rotateY(180deg)",
                          background: card.matched
                            ? getCardColor(card.emoji)
                            : "oklch(0.96 0.02 60)",
                          boxShadow: card.matched
                            ? "0 3px 12px oklch(0.72 0.10 320 / 0.3), 0 0 0 2px oklch(0.72 0.10 280 / 0.35)"
                            : "0 2px 6px oklch(0 0 0 / 0.08)",
                        }}
                      >
                        <span
                          className={
                            cfg && cfg.pairs > 8 ? "text-xl" : "text-2xl"
                          }
                        >
                          {card.emoji}
                        </span>
                      </div>
                    </motion.div>
                  </motion.button>
                ))}
              </div>
            </div>

            <p
              className="text-center text-xs pb-6 font-medium"
              style={{ color: "oklch(0.60 0.07 280)" }}
            >
              Flip cards to find matching pairs 💜
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
