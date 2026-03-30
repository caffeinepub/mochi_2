import { ArrowLeft } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useCallback, useEffect, useRef, useState } from "react";

const BUBBLE_COLORS = [
  "radial-gradient(circle at 35% 30%, oklch(0.92 0.06 355), oklch(0.80 0.10 330))",
  "radial-gradient(circle at 35% 30%, oklch(0.90 0.07 280), oklch(0.78 0.10 260))",
  "radial-gradient(circle at 35% 30%, oklch(0.90 0.07 215), oklch(0.80 0.09 200))",
  "radial-gradient(circle at 35% 30%, oklch(0.90 0.07 130), oklch(0.80 0.09 150))",
  "radial-gradient(circle at 35% 30%, oklch(0.92 0.07 60), oklch(0.82 0.10 40))",
  "radial-gradient(circle at 35% 30%, oklch(0.90 0.06 175), oklch(0.80 0.09 185))",
];

interface Bubble {
  id: number;
  x: number;
  size: number;
  speed: number;
  colorIndex: number;
  delay: number;
  popped: boolean;
  spawning: boolean;
}

const BUBBLE_COUNT = 14;

function makeBubble(id: number, fromBottom = false): Bubble {
  return {
    id,
    x: 5 + Math.random() * 85,
    size: 38 + Math.random() * 46,
    speed: 14 + Math.random() * 14,
    colorIndex: Math.floor(Math.random() * BUBBLE_COLORS.length),
    delay: fromBottom ? 0 : Math.random() * -20,
    popped: false,
    spawning: false,
  };
}

export default function BubblePopGame({ onBack }: { onBack: () => void }) {
  const [bubbles, setBubbles] = useState<Bubble[]>(() =>
    Array.from({ length: BUBBLE_COUNT }, (_, i) => makeBubble(i)),
  );
  const [popped, setPopped] = useState(0);
  const [bursting, setBursting] = useState<
    { id: number; x: number; y: number }[]
  >([]);
  const nextId = useRef(BUBBLE_COUNT);

  const handlePop = useCallback(
    (e: React.MouseEvent | React.TouchEvent, bubble: Bubble) => {
      if (bubble.popped || bubble.spawning) return;
      e.preventDefault();
      const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
      setBursting((prev) => [
        ...prev,
        {
          id: bubble.id,
          x: rect.left + rect.width / 2,
          y: rect.top + rect.height / 2,
        },
      ]);
      setBubbles((prev) =>
        prev.map((b) => (b.id === bubble.id ? { ...b, popped: true } : b)),
      );
      setPopped((p) => p + 1);

      // Respawn after delay
      setTimeout(() => {
        const newId = nextId.current++;
        setBubbles((prev) => [
          ...prev.filter((b) => b.id !== bubble.id),
          { ...makeBubble(newId, true), spawning: true },
        ]);
        setTimeout(() => {
          setBubbles((prev) =>
            prev.map((b) => (b.id === newId ? { ...b, spawning: false } : b)),
          );
        }, 300);
      }, 1200);

      setTimeout(() => {
        setBursting((prev) => prev.filter((b) => b.id !== bubble.id));
      }, 500);
    },
    [],
  );

  // Remove bubbles that floated off screen — respawn them
  useEffect(() => {
    const interval = setInterval(() => {
      setBubbles((prev) => {
        const toRespawn = prev.filter(
          (b) => !b.popped && b.delay !== 0 && b.delay < -b.speed - 5,
        );
        if (toRespawn.length === 0) return prev;
        return prev.map((b) =>
          toRespawn.find((r) => r.id === b.id)
            ? { ...makeBubble(nextId.current++, true) }
            : b,
        );
      });
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col overflow-hidden select-none"
      style={{
        background:
          "linear-gradient(180deg, oklch(0.96 0.025 260), oklch(0.94 0.03 310), oklch(0.97 0.02 355))",
      }}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 pt-12 pb-2 relative z-10">
        <button
          type="button"
          data-ocid="bubble.close_button"
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
            Bubble Pop 🫧
          </p>
          <motion.p
            key={popped}
            initial={{ scale: 1.3, opacity: 0.6 }}
            animate={{ scale: 1, opacity: 1 }}
            className="text-xs font-bold"
            style={{ color: "oklch(0.55 0.08 300)" }}
          >
            Popped: {popped}
          </motion.p>
        </div>
        <div className="w-9" />
      </div>

      {/* Bubbles */}
      <div className="flex-1 relative">
        {bubbles
          .filter((b) => !b.popped)
          .map((bubble) => (
            <motion.button
              key={bubble.id}
              type="button"
              data-ocid="bubble.canvas_target"
              className="absolute rounded-full cursor-pointer focus:outline-none"
              style={{
                width: bubble.size,
                height: bubble.size,
                left: `${bubble.x}%`,
                background: BUBBLE_COLORS[bubble.colorIndex],
                boxShadow:
                  "inset -4px -4px 8px oklch(1 0 0 / 0.3), inset 2px 2px 6px oklch(1 0 0 / 0.5), 0 4px 12px oklch(0 0 0 / 0.08)",
                translateX: "-50%",
              }}
              initial={{ y: "110vh", opacity: 0 }}
              animate={{
                y: bubble.spawning ? "110vh" : "-15vh",
                opacity: bubble.spawning ? 0 : 1,
              }}
              transition={{
                y: {
                  duration: bubble.speed,
                  ease: "linear",
                  delay: bubble.delay < 0 ? 0 : bubble.delay,
                  repeat: Number.POSITIVE_INFINITY,
                  repeatType: "loop",
                },
                opacity: { duration: 0.4 },
              }}
              onClick={(e) => handlePop(e, bubble)}
              onTouchStart={(e) => handlePop(e, bubble)}
              whileTap={{ scale: 0.85 }}
            >
              {/* Bubble shine */}
              <div
                className="absolute rounded-full"
                style={{
                  top: "18%",
                  left: "22%",
                  width: "30%",
                  height: "20%",
                  background: "oklch(1 0 0 / 0.55)",
                  filter: "blur(1.5px)",
                }}
              />
            </motion.button>
          ))}

        {/* Burst animations */}
        <AnimatePresence>
          {bursting.map((burst) => (
            <motion.div
              key={`burst-${burst.id}`}
              className="fixed pointer-events-none"
              style={{ left: burst.x, top: burst.y, zIndex: 60 }}
              initial={{ scale: 0, opacity: 1 }}
              animate={{ scale: 2.5, opacity: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.45, ease: "easeOut" }}
            >
              <div
                className="w-10 h-10 rounded-full"
                style={{
                  background:
                    "radial-gradient(circle, oklch(0.90 0.08 330 / 0.7), transparent)",
                  transform: "translate(-50%, -50%)",
                }}
              />
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Bottom hint */}
      <p
        className="text-center text-xs pb-6 font-medium"
        style={{ color: "oklch(0.60 0.07 280)" }}
      >
        Tap the bubbles to pop them 🫧
      </p>
    </div>
  );
}
