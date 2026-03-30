import { ArrowLeft, RefreshCw } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useCallback, useEffect, useRef, useState } from "react";

const BUBBLE_COLORS = [
  {
    bg: "radial-gradient(circle at 35% 30%, oklch(0.92 0.06 355), oklch(0.80 0.10 330))",
    particle: "#f9a8d4",
  },
  {
    bg: "radial-gradient(circle at 35% 30%, oklch(0.90 0.07 280), oklch(0.78 0.10 260))",
    particle: "#c4b5fd",
  },
  {
    bg: "radial-gradient(circle at 35% 30%, oklch(0.90 0.07 215), oklch(0.80 0.09 200))",
    particle: "#7dd3fc",
  },
  {
    bg: "radial-gradient(circle at 35% 30%, oklch(0.90 0.07 130), oklch(0.80 0.09 150))",
    particle: "#86efac",
  },
  {
    bg: "radial-gradient(circle at 35% 30%, oklch(0.92 0.07 60), oklch(0.82 0.10 40))",
    particle: "#fcd34d",
  },
  {
    bg: "radial-gradient(circle at 35% 30%, oklch(0.90 0.06 175), oklch(0.80 0.09 185))",
    particle: "#6ee7b7",
  },
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
  colorIndex: number;
}

function makeBubble(id: number, delay = 0): Bubble {
  return {
    id,
    x: 5 + Math.random() * 88,
    size: 44 + Math.random() * 36,
    duration: 7 + Math.random() * 8,
    delay,
    colorIndex: Math.floor(Math.random() * BUBBLE_COLORS.length),
  };
}

function playPopSound() {
  try {
    const ctx = new (
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext })
        .webkitAudioContext
    )();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.type = "sine";
    osc.frequency.setValueAtTime(600, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(200, ctx.currentTime + 0.12);
    gain.gain.setValueAtTime(0.3, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.15);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.15);
    setTimeout(() => ctx.close(), 300);
  } catch (_) {
    // Audio not supported, silently skip
  }
}

const INITIAL_COUNT = 12;

export default function BubblePopGame({ onBack }: { onBack: () => void }) {
  const [bubbles, setBubbles] = useState<Bubble[]>(() =>
    Array.from({ length: INITIAL_COUNT }, (_, i) =>
      makeBubble(i, -Math.random() * 8),
    ),
  );
  const [bursts, setBursts] = useState<BurstParticle[]>([]);
  const [count, setCount] = useState(0);
  const nextId = useRef(INITIAL_COUNT);

  // Inject CSS keyframe for bubble rise
  useEffect(() => {
    const styleId = "bubble-rise-keyframe";
    if (!document.getElementById(styleId)) {
      const style = document.createElement("style");
      style.id = styleId;
      style.textContent = `
        @keyframes bubbleRise {
          0%   { transform: translateX(-50%) translateY(0)   scale(1); opacity: 0.85; }
          5%   { opacity: 1; }
          90%  { opacity: 0.9; }
          100% { transform: translateX(-50%) translateY(-110vh) scale(0.85); opacity: 0; }
        }
      `;
      document.head.appendChild(style);
    }
  }, []);

  const handlePop = useCallback((e: React.PointerEvent, bubble: Bubble) => {
    e.stopPropagation();
    e.preventDefault();

    playPopSound();

    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const burstId = Date.now() + Math.random();

    setBursts((prev) => [
      ...prev,
      {
        id: burstId,
        x: rect.left + rect.width / 2,
        y: rect.top + rect.height / 2,
        colorIndex: bubble.colorIndex,
      },
    ]);

    setBubbles((prev) => {
      const filtered = prev.filter((b) => b.id !== bubble.id);
      const newId = nextId.current++;
      return [...filtered, makeBubble(newId, 0)];
    });

    setCount((c) => c + 1);

    setTimeout(() => {
      setBursts((prev) => prev.filter((b) => b.id !== burstId));
    }, 600);
  }, []);

  const handleRestart = useCallback(() => {
    nextId.current = INITIAL_COUNT;
    setBubbles(
      Array.from({ length: INITIAL_COUNT }, (_, i) =>
        makeBubble(i, -Math.random() * 8),
      ),
    );
    setBursts([]);
    setCount(0);
  }, []);

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col"
      style={{
        background:
          "linear-gradient(160deg, oklch(0.97 0.03 215), oklch(0.95 0.04 270), oklch(0.97 0.02 330))",
        touchAction: "none",
        overflow: "hidden",
      }}
    >
      {/* Header */}
      <div className="relative z-20 flex items-center justify-between px-4 pt-12 pb-2 shrink-0">
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
        <div className="flex items-center gap-2">
          <div className="flex flex-col items-center min-w-[40px]">
            <span
              className="text-2xl font-extrabold leading-none"
              style={{ color: "oklch(0.60 0.12 270)" }}
            >
              {count}
            </span>
            <span className="text-[10px] text-muted-foreground">popped</span>
          </div>
          <button
            type="button"
            data-ocid="bubblepop.secondary_button"
            onPointerDown={handleRestart}
            className="p-2 rounded-full bg-white/60 backdrop-blur-sm hover:bg-white/80 transition-colors"
          >
            <RefreshCw
              className="w-4 h-4"
              style={{ color: "oklch(0.45 0.10 270)" }}
            />
          </button>
        </div>
      </div>

      {/* Bubble field */}
      <div className="relative flex-1 w-full" style={{ overflow: "hidden" }}>
        {bubbles.map((bubble) => (
          <div
            key={bubble.id}
            onPointerDown={(e) => handlePop(e, bubble)}
            style={{
              position: "absolute",
              left: `${bubble.x}%`,
              bottom: 0,
              width: bubble.size,
              height: bubble.size,
              background: BUBBLE_COLORS[bubble.colorIndex].bg,
              borderRadius: "50%",
              cursor: "pointer",
              boxShadow:
                "inset -3px -3px 8px rgba(255,255,255,0.5), 0 2px 12px rgba(0,0,0,0.10)",
              touchAction: "none",
              userSelect: "none",
              animation: `bubbleRise ${bubble.duration}s ${bubble.delay < 0 ? bubble.delay : 0}s linear infinite`,
            }}
          >
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

      {/* Burst particles */}
      <AnimatePresence>
        {bursts.map((burst) => (
          <motion.div
            key={burst.id}
            initial={{ opacity: 1 }}
            animate={{ opacity: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
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
            {[0, 45, 90, 135, 180, 225, 270, 315].map((angle) => (
              <motion.div
                key={angle}
                initial={{ x: 0, y: 0, opacity: 1, scale: 1 }}
                animate={{
                  x: Math.cos((angle * Math.PI) / 180) * 38,
                  y: Math.sin((angle * Math.PI) / 180) * 38,
                  opacity: 0,
                  scale: 0.5,
                }}
                transition={{ duration: 0.5, ease: "easeOut" }}
                style={{
                  position: "absolute",
                  left: 26,
                  top: 26,
                  width: 8,
                  height: 8,
                  borderRadius: "50%",
                  background: BUBBLE_COLORS[burst.colorIndex].particle,
                  pointerEvents: "none",
                }}
              />
            ))}
          </motion.div>
        ))}
      </AnimatePresence>

      <div className="relative z-20 text-center text-xs text-muted-foreground pb-4 pt-1 shrink-0">
        Tap bubbles to pop them and feel the calm 🌸
      </div>
    </div>
  );
}
