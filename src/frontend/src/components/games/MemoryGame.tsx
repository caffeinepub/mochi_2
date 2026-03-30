import { ArrowLeft, RefreshCw } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useCallback, useState } from "react";

const EMOJIS = ["🌸", "🌟", "💜", "🌈", "🎵", "🦋", "🌙", "☁️"];

interface Card {
  id: number;
  emoji: string;
  flipped: boolean;
  matched: boolean;
}

function createDeck(): Card[] {
  const pairs = [...EMOJIS, ...EMOJIS];
  for (let i = pairs.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [pairs[i], pairs[j]] = [pairs[j], pairs[i]];
  }
  return pairs.map((emoji, i) => ({
    id: i,
    emoji,
    flipped: false,
    matched: false,
  }));
}

const CARD_COLORS = [
  "linear-gradient(135deg, oklch(0.88 0.06 355), oklch(0.84 0.08 330))",
  "linear-gradient(135deg, oklch(0.88 0.06 280), oklch(0.84 0.07 260))",
  "linear-gradient(135deg, oklch(0.88 0.06 215), oklch(0.84 0.07 200))",
  "linear-gradient(135deg, oklch(0.88 0.06 130), oklch(0.84 0.07 150))",
  "linear-gradient(135deg, oklch(0.90 0.07 60), oklch(0.84 0.08 40))",
  "linear-gradient(135deg, oklch(0.88 0.06 175), oklch(0.84 0.07 185))",
  "linear-gradient(135deg, oklch(0.88 0.07 305), oklch(0.84 0.09 290))",
  "linear-gradient(135deg, oklch(0.90 0.06 85), oklch(0.84 0.08 100))",
];

function getCardColor(emoji: string): string {
  const idx = EMOJIS.indexOf(emoji);
  return CARD_COLORS[idx >= 0 ? idx : 0];
}

export default function MemoryGame({ onBack }: { onBack: () => void }) {
  const [cards, setCards] = useState<Card[]>(createDeck);
  const [flippedIds, setFlippedIds] = useState<number[]>([]);
  const [moves, setMoves] = useState(0);
  const [locked, setLocked] = useState(false);

  const matchedCount = cards.filter((c) => c.matched).length / 2;
  const allMatched = matchedCount === EMOJIS.length;

  const newGame = useCallback(() => {
    setCards(createDeck());
    setFlippedIds([]);
    setMoves(0);
    setLocked(false);
  }, []);

  const handleFlip = (card: Card) => {
    if (locked || card.flipped || card.matched || flippedIds.length >= 2)
      return;

    const newFlippedIds = [...flippedIds, card.id];

    // Flip this card
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
          onClick={onBack}
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
          <p className="text-xs" style={{ color: "oklch(0.55 0.07 290)" }}>
            {matchedCount}/{EMOJIS.length} matched · {moves} moves
          </p>
        </div>
        <button
          type="button"
          data-ocid="memory.secondary_button"
          onClick={newGame}
          className="p-2 rounded-full bg-white/60 backdrop-blur-sm hover:bg-white/80 transition-colors"
        >
          <RefreshCw
            className="w-5 h-5"
            style={{ color: "oklch(0.45 0.10 280)" }}
          />
        </button>
      </div>

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
              Amazing! 🌟 You matched all in {moves} moves!
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Grid */}
      <div className="flex-1 flex items-center justify-center px-4">
        <div className="grid grid-cols-4 gap-2.5 w-full max-w-xs">
          {cards.map((card, idx) => (
            <motion.button
              key={card.id}
              type="button"
              data-ocid={`memory.item.${idx + 1}`}
              onClick={() => handleFlip(card)}
              className="relative aspect-square rounded-2xl focus:outline-none"
              style={{ perspective: 600 }}
              whileTap={!card.matched && !card.flipped ? { scale: 0.92 } : {}}
            >
              <motion.div
                className="w-full h-full relative"
                animate={{ rotateY: card.flipped || card.matched ? 180 : 0 }}
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
                  <span className="text-2xl">{card.emoji}</span>
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
    </div>
  );
}
