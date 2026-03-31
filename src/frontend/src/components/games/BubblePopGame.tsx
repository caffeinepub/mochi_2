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

interface BubbleData {
  id: number;
  x: number;
  y: number;
  size: number;
  speed: number;
  colorIndex: number;
}

interface BurstParticle {
  id: number;
  x: number;
  y: number;
  colorIndex: number;
}

const BUBBLE_COUNT = 12;
let globalBubbleId = 0;

function makeBubbleData(h: number, randomY = false): BubbleData {
  return {
    id: ++globalBubbleId,
    x: 5 + Math.random() * 88,
    y: randomY ? Math.random() * h : h + 20 + Math.random() * 100,
    size: 44 + Math.random() * 36,
    speed: 0.7 + Math.random() * 0.9,
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
    // Audio not supported
  }
}

export default function BubblePopGame({ onBack }: { onBack: () => void }) {
  const [bubbles, setBubbles] = useState<BubbleData[]>([]);
  const [bursts, setBursts] = useState<BurstParticle[]>([]);
  const [count, setCount] = useState(0);

  const containerRef = useRef<HTMLDivElement>(null);
  const rafRef = useRef<number | null>(null);
  const positionsRef = useRef<Map<number, BubbleData>>(new Map());
  const domRefs = useRef<Map<number, HTMLDivElement>>(new Map());
  const poppedRef = useRef<Set<number>>(new Set());

  const startLoop = useCallback(() => {
    const container = containerRef.current;
    const tick = () => {
      const h = (container?.offsetHeight ?? window.innerHeight) - 100;
      positionsRef.current.forEach((data, id) => {
        if (poppedRef.current.has(id)) return;
        data.y -= data.speed;
        if (data.y < -data.size) {
          data.y = h + 20;
          data.x = 5 + Math.random() * 88;
        }
        const el = domRefs.current.get(id);
        if (el) {
          el.style.top = `${data.y}px`;
          el.style.left = `${data.x}%`;
        }
      });
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
  }, []);

  useEffect(() => {
    const h = (containerRef.current?.offsetHeight ?? window.innerHeight) - 100;
    const initial = Array.from({ length: BUBBLE_COUNT }, () =>
      makeBubbleData(h, true),
    );
    for (const b of initial) {
      positionsRef.current.set(b.id, { ...b });
    }
    setBubbles(initial);
    startLoop();
    return () => {
      if (rafRef.current != null) cancelAnimationFrame(rafRef.current);
    };
  }, [startLoop]);

  const handlePop = useCallback((e: React.PointerEvent, bubble: BubbleData) => {
    e.stopPropagation();
    e.preventDefault();
    if (poppedRef.current.has(bubble.id)) return;
    poppedRef.current.add(bubble.id);
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

    positionsRef.current.delete(bubble.id);
    domRefs.current.delete(bubble.id);
    const h = (containerRef.current?.offsetHeight ?? window.innerHeight) - 100;
    const newB = makeBubbleData(h, false);
    positionsRef.current.set(newB.id, { ...newB });
    setBubbles((prev) => [...prev.filter((b) => b.id !== bubble.id), newB]);
    setCount((c) => c + 1);
    setTimeout(() => {
      setBursts((prev) => prev.filter((b) => b.id !== burstId));
      poppedRef.current.delete(bubble.id);
    }, 600);
  }, []);

  const handleRestart = useCallback(() => {
    if (rafRef.current != null) cancelAnimationFrame(rafRef.current);
    positionsRef.current.clear();
    domRefs.current.clear();
    poppedRef.current.clear();
    const h = (containerRef.current?.offsetHeight ?? window.innerHeight) - 100;
    const initial = Array.from({ length: BUBBLE_COUNT }, () =>
      makeBubbleData(h, true),
    );
    for (const b of initial) {
      positionsRef.current.set(b.id, { ...b });
    }
    setBubbles(initial);
    setBursts([]);
    setCount(0);
    startLoop();
  }, [startLoop]);

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
      <div className="relative z-20 flex items-center justify-between px-4 pt-12 pb-2 shrink-0">
        <button
          type="button"
          onPointerDown={onBack}
          style={{ touchAction: "manipulation" }}
          className="w-9 h-9 flex items-center justify-center rounded-full bg-white/60 backdrop-blur shadow"
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
            style={{ touchAction: "manipulation" }}
            className="p-2 rounded-full bg-white/60 backdrop-blur-sm hover:bg-white/80 transition-colors"
          >
            <RefreshCw
              className="w-4 h-4"
              style={{ color: "oklch(0.45 0.10 270)" }}
            />
          </button>
        </div>
      </div>

      <div
        ref={containerRef}
        className="relative flex-1 w-full"
        style={{ overflow: "hidden" }}
      >
        {bubbles.map((bubble) => (
          <div
            key={bubble.id}
            ref={(el) => {
              if (el) {
                domRefs.current.set(bubble.id, el);
                const data = positionsRef.current.get(bubble.id);
                if (data) {
                  el.style.top = `${data.y}px`;
                  el.style.left = `${data.x}%`;
                }
              } else {
                domRefs.current.delete(bubble.id);
              }
            }}
            onPointerDown={(e) => handlePop(e, bubble)}
            style={{
              position: "absolute",
              width: bubble.size,
              height: bubble.size,
              background: BUBBLE_COLORS[bubble.colorIndex].bg,
              borderRadius: "50%",
              cursor: "pointer",
              boxShadow:
                "inset -3px -3px 8px rgba(255,255,255,0.5), 0 2px 12px rgba(0,0,0,0.10)",
              touchAction: "none",
              userSelect: "none",
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
