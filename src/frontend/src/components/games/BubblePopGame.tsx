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
  duration: number;
  delay: number;
  colorIndex: number;
}

interface BurstParticle {
  id: number;
  x: number;
  y: number;
}

const BUBBLE_COUNT = 14;

function makeBubble(id: number, fresh = false): Bubble {
  return {
    id,
    x: 5 + Math.random() * 85,
    size: 40 + Math.random() * 40,
    duration: 12 + Math.random() * 10,
    delay: fresh ? 0 : Math.random() * -20,
    colorIndex: Math.floor(Math.random() * BUBBLE_COLORS.length),
  };
}

export default function BubblePopGame({ onBack }: { onBack: () => void }) {
  const [bubbles, setBubbles] = useState<Bubble[]>(() =>
    Array.from({ length: BUBBLE_COUNT }, (_, i) => makeBubble(i)),
  );
  const [poppedIds, setPoppedIds] = useState<Set<number>>(new Set());
  const [bursts, setBursts] = useState<BurstParticle[]>([]);
  const [count, setCount] = useState(0);
  const nextId = useRef(BUBBLE_COUNT);

  // Inject CSS keyframes once
  useEffect(() => {
    const style = document.createElement("style");
    style.id = "bubble-float-keyframes";
    style.textContent = `
      @keyframes bubbleFloat {
        0%   { transform: translateY(0) scale(1); opacity: 0.9; }
        10%  { opacity: 1; }
        90%  { opacity: 0.85; }
        100% { transform: translateY(-120vh) scale(0.85); opacity: 0; }
      }
    `;
    if (!document.getElementById("bubble-float-keyframes")) {
      document.head.appendChild(style);
    }
    return () => {
      const el = document.getElementById("bubble-float-keyframes");
      if (el) el.remove();
    };
  }, []);

  const handlePop = useCallback(
    (e: React.PointerEvent, bubble: Bubble) => {
      if (poppedIds.has(bubble.id)) return;
      e.stopPropagation();
      e.preventDefault();

      const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
      const burstId = bubble.id;
      setBursts((prev) => [
        ...prev,
        {
          id: burstId,
          x: rect.left + rect.width / 2,
          y: rect.top + rect.height / 2,
        },
      ]);
      setPoppedIds((prev) => new Set(prev).add(bubble.id));
      setCount((c) => c + 1);

      // Remove burst after animation
      setTimeout(() => {
        setBursts((prev) => prev.filter((b) => b.id !== burstId));
      }, 500);

      // Spawn new bubble from bottom after delay
      setTimeout(() => {
        const newId = nextId.current++;
        const newBubble = makeBubble(newId, true);
        setBubbles((prev) => [
          ...prev.filter((b) => b.id !== bubble.id),
          newBubble,
        ]);
        setPoppedIds((prev) => {
          const next = new Set(prev);
          next.delete(bubble.id);
          return next;
        });
      }, 1000);
    },
    [poppedIds],
  );

  return (
    <div
      className="relative flex flex-col h-full overflow-hidden bg-gradient-to-b from-sky-100/60 via-purple-50/40 to-pink-100/60 dark:from-slate-900/80 dark:via-purple-900/30 dark:to-slate-800/60"
      style={{ touchAction: "none" }}
    >
      {/* Header */}
      <div className="relative z-20 flex items-center justify-between px-4 pt-4 pb-2">
        <button
          type="button"
          onPointerDown={onBack}
          className="w-9 h-9 flex items-center justify-center rounded-full bg-white/60 dark:bg-white/10 backdrop-blur shadow"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="flex flex-col items-center">
          <span className="text-xl font-bold tracking-tight">
            🫧 Bubble Pop
          </span>
          <span className="text-xs text-muted-foreground">
            Tap the bubbles!
          </span>
        </div>
        <div className="flex flex-col items-center min-w-[56px]">
          <span className="text-2xl font-extrabold text-purple-500 dark:text-purple-300 leading-none">
            {count}
          </span>
          <span className="text-[10px] text-muted-foreground">popped</span>
        </div>
      </div>

      {/* Bubble field */}
      <div className="relative flex-1 w-full overflow-hidden">
        {bubbles.map((bubble) => (
          <div
            key={bubble.id}
            onPointerDown={(e) => handlePop(e, bubble)}
            style={{
              position: "absolute",
              left: `${bubble.x}%`,
              bottom: "-100px",
              width: bubble.size,
              height: bubble.size,
              background: BUBBLE_COLORS[bubble.colorIndex],
              borderRadius: "50%",
              cursor: "pointer",
              boxShadow:
                "inset -3px -3px 8px rgba(255,255,255,0.5), 0 2px 12px rgba(0,0,0,0.10)",
              animation: `bubbleFloat ${bubble.duration}s ${bubble.delay}s linear infinite`,
              opacity: poppedIds.has(bubble.id) ? 0 : 1,
              transition: "opacity 0.1s",
              touchAction: "none",
              userSelect: "none",
            }}
          >
            {/* Shine highlight */}
            <div
              style={{
                position: "absolute",
                top: "15%",
                left: "20%",
                width: "30%",
                height: "20%",
                background: "rgba(255,255,255,0.55)",
                borderRadius: "50%",
                filter: "blur(2px)",
                pointerEvents: "none",
              }}
            />
          </div>
        ))}
      </div>

      {/* Burst particles — rendered in fixed coords */}
      <AnimatePresence>
        {bursts.map((burst) => (
          <motion.div
            key={burst.id}
            initial={{ opacity: 1, scale: 0.5 }}
            animate={{ opacity: 0, scale: 2.5 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.45, ease: "easeOut" }}
            style={{
              position: "fixed",
              left: burst.x - 30,
              top: burst.y - 30,
              width: 60,
              height: 60,
              pointerEvents: "none",
              zIndex: 50,
            }}
          >
            {[0, 60, 120, 180, 240, 300].map((angle) => (
              <motion.div
                key={angle}
                initial={{ x: 0, y: 0, opacity: 1 }}
                animate={{
                  x: Math.cos((angle * Math.PI) / 180) * 35,
                  y: Math.sin((angle * Math.PI) / 180) * 35,
                  opacity: 0,
                }}
                transition={{ duration: 0.4 }}
                style={{
                  position: "absolute",
                  left: 26,
                  top: 26,
                  width: 8,
                  height: 8,
                  borderRadius: "50%",
                  background: BUBBLE_COLORS[burst.id % BUBBLE_COLORS.length],
                  pointerEvents: "none",
                }}
              />
            ))}
          </motion.div>
        ))}
      </AnimatePresence>

      {/* Instructions */}
      <div className="relative z-20 text-center text-xs text-muted-foreground pb-4 pt-1">
        Tap bubbles to pop them and feel the calm 🌸
      </div>
    </div>
  );
}
