import { AnimatePresence, motion, useAnimation } from "motion/react";
import { useEffect, useRef, useState } from "react";

const MESSAGES = [
  "Heyy! Kya haal hai? 🥰",
  "Tu bohot accha hai yaar! 💖",
  "Aaj ka din tera hai! ✨",
  "Chill maar, sab theek hoga 🌸",
  "Mochi loves you! 🍡💕",
  "Khush reh, hamesha! 😊",
  "Tu strong hai bhai! 💪",
  "Apna khayal rakh! 🌷",
  "Smile karo na pls 😄",
  "You are enough! 🌟",
];

interface Sparkle {
  id: number;
  x: number;
  y: number;
}

export default function FloatingMochi() {
  const [pos, setPos] = useState({ x: 80, y: 120 });
  const [message, setMessage] = useState("");
  const [showMsg, setShowMsg] = useState(false);
  const [sparkles, setSparkles] = useState<Sparkle[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const sparkleId = useRef(0);
  const msgTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const controls = useAnimation();

  // Auto-float animation
  useEffect(() => {
    let cancelled = false;
    const float = async () => {
      while (!cancelled) {
        const vw = window.innerWidth > 430 ? 430 : window.innerWidth;
        const vh = window.innerHeight;
        const nx = 20 + Math.random() * (Math.min(vw, 430) - 80);
        const ny = 60 + Math.random() * (vh - 200);
        if (!isDragging) {
          await controls.start({
            x: nx,
            y: ny,
            transition: {
              duration: 3 + Math.random() * 3,
              ease: "easeInOut",
            },
          });
          setPos({ x: nx, y: ny });
        }
        await new Promise((r) => setTimeout(r, 500 + Math.random() * 1000));
      }
    };
    float();
    return () => {
      cancelled = true;
    };
  }, [controls, isDragging]);

  const addSparkles = (x: number, y: number) => {
    const newSparkles: Sparkle[] = Array.from({ length: 6 }).map((_, _i) => ({
      id: sparkleId.current++,
      x: x + (Math.random() - 0.5) * 60,
      y: y + (Math.random() - 0.5) * 60,
    }));
    setSparkles((s) => [...s, ...newSparkles]);
    setTimeout(() => {
      setSparkles((s) =>
        s.filter((sp) => !newSparkles.find((n) => n.id === sp.id)),
      );
    }, 800);
  };

  const handleTap = () => {
    const msg = MESSAGES[Math.floor(Math.random() * MESSAGES.length)];
    setMessage(msg);
    setShowMsg(true);
    addSparkles(pos.x, pos.y);
    if (msgTimeout.current) clearTimeout(msgTimeout.current);
    msgTimeout.current = setTimeout(() => setShowMsg(false), 2500);
  };

  return (
    <div
      ref={containerRef}
      className="pointer-events-none fixed inset-0 z-40"
      style={{ maxWidth: 430, margin: "0 auto" }}
    >
      {/* Sparkles */}
      {sparkles.map((sp) => (
        <motion.div
          key={sp.id}
          className="pointer-events-none absolute text-lg"
          initial={{ opacity: 1, scale: 1, x: sp.x, y: sp.y }}
          animate={{
            opacity: 0,
            scale: 0,
            y: sp.y - 40,
            x: sp.x + (Math.random() - 0.5) * 40,
          }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          style={{ position: "absolute", top: 0, left: 0 }}
        >
          {["✨", "💖", "🌸", "⭐", "💫"][Math.floor(Math.random() * 5)]}
        </motion.div>
      ))}

      {/* Mochi Character */}
      <motion.div
        animate={controls}
        initial={{ x: 80, y: 120 }}
        drag
        dragMomentum={false}
        onDragStart={() => setIsDragging(true)}
        onDragEnd={(_, info) => {
          setIsDragging(false);
          setPos({ x: pos.x + info.offset.x, y: pos.y + info.offset.y });
        }}
        onTap={handleTap}
        className="pointer-events-auto absolute cursor-pointer select-none"
        style={{ top: 0, left: 0, width: 56, height: 56 }}
        whileHover={{ scale: 1.2 }}
        whileTap={{ scale: 0.9 }}
      >
        {/* Glow ring */}
        <motion.div
          className="absolute inset-0 rounded-full"
          style={{
            background:
              "radial-gradient(circle, rgba(255,182,255,0.5) 0%, transparent 70%)",
            transform: "scale(1.8)",
          }}
          animate={{ scale: [1.6, 2, 1.6], opacity: [0.4, 0.8, 0.4] }}
          transition={{
            duration: 2,
            repeat: Number.POSITIVE_INFINITY,
            ease: "easeInOut",
          }}
        />

        {/* Mochi body */}
        <motion.div
          className="relative w-14 h-14 rounded-full flex items-center justify-center shadow-lg overflow-hidden"
          style={{
            background:
              "linear-gradient(135deg, #ffd6f0 0%, #e8b4f8 50%, #b4d4f8 100%)",
            boxShadow: "0 4px 20px rgba(200,100,255,0.4)",
          }}
          animate={{
            rotate: [-5, 5, -5],
            y: [0, -4, 0],
          }}
          transition={{
            rotate: {
              duration: 2,
              repeat: Number.POSITIVE_INFINITY,
              ease: "easeInOut",
            },
            y: {
              duration: 1.5,
              repeat: Number.POSITIVE_INFINITY,
              ease: "easeInOut",
            },
          }}
        >
          <img
            src="/assets/generated/mochi-mascot-transparent.dim_400x400.png"
            alt="Mochi"
            className="w-full h-full object-contain"
            onError={(e) => {
              (e.currentTarget as HTMLImageElement).style.display = "none";
              const parent = e.currentTarget.parentElement;
              if (parent) parent.textContent = "🍡";
            }}
          />
        </motion.div>

        {/* Wings */}
        <motion.div
          className="absolute -left-3 top-3 text-lg"
          animate={{ rotate: [-20, 20, -20], scaleX: [1, 1.2, 1] }}
          transition={{ duration: 0.4, repeat: Number.POSITIVE_INFINITY }}
          style={{ transformOrigin: "right center" }}
        >
          🪽
        </motion.div>
        <motion.div
          className="absolute -right-3 top-3 text-lg"
          animate={{ rotate: [20, -20, 20], scaleX: [1, 1.2, 1] }}
          transition={{ duration: 0.4, repeat: Number.POSITIVE_INFINITY }}
          style={{ transformOrigin: "left center" }}
        >
          🪽
        </motion.div>

        {/* Message bubble */}
        <AnimatePresence>
          {showMsg && (
            <motion.div
              initial={{ opacity: 0, scale: 0.7, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.7, y: 10 }}
              transition={{ type: "spring", stiffness: 400, damping: 20 }}
              className="absolute -top-14 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-2xl px-3 py-1.5 text-xs font-semibold shadow-lg"
              style={{
                background: "rgba(255,255,255,0.95)",
                color: "#c44dff",
                border: "1.5px solid #e8b4f8",
                backdropFilter: "blur(8px)",
                maxWidth: 160,
                whiteSpace: "normal",
                textAlign: "center",
              }}
            >
              {message}
              {/* Bubble tail */}
              <div
                className="absolute -bottom-2 left-1/2 -translate-x-1/2"
                style={{
                  width: 0,
                  height: 0,
                  borderLeft: "6px solid transparent",
                  borderRight: "6px solid transparent",
                  borderTop: "8px solid rgba(255,255,255,0.95)",
                }}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
