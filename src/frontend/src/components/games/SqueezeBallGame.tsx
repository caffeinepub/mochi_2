import { ArrowLeft, RefreshCw } from "lucide-react";
import { AnimatePresence, motion, useAnimation } from "motion/react";
import { useCallback, useEffect, useRef, useState } from "react";

const PARTICLE_EMOJIS = ["✨", "🌸", "💜", "💫", "🎉", "🌈", "⭐", "🎊"];

interface Particle {
  id: number;
  emoji: string;
  x: number;
  y: number;
}

export default function SqueezeBallGame({ onBack }: { onBack: () => void }) {
  const [squeezeCount, setSqueezeCount] = useState(0);
  const [isSqueezing, setIsSqueezing] = useState(false);
  const [celebrated, setCelebrated] = useState(false);
  const [particles, setParticles] = useState<Particle[]>([]);
  const controls = useAnimation();
  const particleId = useRef(0);
  const GOAL = 20;

  const stressLevel = Math.max(0, 100 - (squeezeCount / GOAL) * 100);

  const handleSqueeze = useCallback(() => {
    if (celebrated) return;
    setIsSqueezing(true);
    controls.start({
      scaleX: 0.78,
      scaleY: 0.88,
      borderRadius: ["50%", "60% 40% 60% 40% / 50% 50% 50% 50%"],
      transition: { duration: 0.12, ease: "easeIn" },
    });
  }, [celebrated, controls]);

  const handleRelease = useCallback(() => {
    if (!isSqueezing) return;
    setIsSqueezing(false);
    controls.start({
      scaleX: 1,
      scaleY: 1,
      borderRadius: "50%",
      transition: { type: "spring", stiffness: 500, damping: 18 },
    });
    setSqueezeCount((prev) => {
      const next = prev + 1;
      if (next >= GOAL && !celebrated) {
        setCelebrated(true);
        const newParticles: Particle[] = Array.from({ length: 18 }, (_, i) => ({
          id: particleId.current++,
          emoji: PARTICLE_EMOJIS[i % PARTICLE_EMOJIS.length],
          x: 20 + Math.random() * 60,
          y: 20 + Math.random() * 60,
        }));
        setParticles(newParticles);
      }
      return next;
    });
  }, [isSqueezing, celebrated, controls]);

  const handleReset = useCallback(() => {
    setSqueezeCount(0);
    setCelebrated(false);
    setParticles([]);
  }, []);

  // Cleanup particles after animation
  useEffect(() => {
    if (particles.length > 0) {
      const timer = setTimeout(() => setParticles([]), 2500);
      return () => clearTimeout(timer);
    }
  }, [particles]);

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col overflow-hidden select-none"
      style={{
        background:
          "linear-gradient(160deg, oklch(0.97 0.03 355), oklch(0.95 0.04 290), oklch(0.97 0.02 260))",
      }}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 pt-12 pb-2 relative z-10">
        <button
          type="button"
          data-ocid="squeezeball.close_button"
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
            className="text-sm font-bold"
            style={{ color: "oklch(0.40 0.10 290)" }}
          >
            Squeeze Ball 🔴
          </p>
          <motion.p
            key={squeezeCount}
            initial={{ scale: 1.3, opacity: 0.6 }}
            animate={{ scale: 1, opacity: 1 }}
            className="text-xs font-bold"
            style={{ color: "oklch(0.55 0.08 300)" }}
          >
            {celebrated
              ? "Stress Released! 🎉"
              : `${squeezeCount} / ${GOAL} squeezes`}
          </motion.p>
        </div>
        <button
          type="button"
          data-ocid="squeezeball.secondary_button"
          onClick={handleReset}
          className="p-2 rounded-full bg-white/60 backdrop-blur-sm hover:bg-white/80 transition-colors"
          style={{ touchAction: "manipulation" }}
        >
          <RefreshCw
            className="w-5 h-5"
            style={{ color: "oklch(0.45 0.10 280)" }}
          />
        </button>
      </div>

      {/* Stress bar */}
      <div className="px-8 pt-2 pb-4">
        <div className="flex items-center justify-between mb-1.5">
          <span
            className="text-xs font-bold"
            style={{ color: "oklch(0.55 0.08 290)" }}
          >
            Stress Level
          </span>
          <span
            className="text-xs font-black"
            style={{ color: "oklch(0.50 0.12 355)" }}
          >
            {Math.round(stressLevel)}%
          </span>
        </div>
        <div className="h-3 rounded-full bg-white/50 overflow-hidden shadow-inner">
          <motion.div
            className="h-full rounded-full"
            animate={{ width: `${stressLevel}%` }}
            transition={{ duration: 0.4, ease: "easeOut" }}
            style={{
              background:
                stressLevel > 60
                  ? "linear-gradient(90deg, oklch(0.78 0.14 355), oklch(0.72 0.16 355))"
                  : stressLevel > 30
                    ? "linear-gradient(90deg, oklch(0.80 0.12 60), oklch(0.76 0.14 355))"
                    : "linear-gradient(90deg, oklch(0.72 0.12 150), oklch(0.76 0.10 200))",
            }}
          />
        </div>
      </div>

      {/* Ball area */}
      <div
        className="flex-1 flex flex-col items-center justify-center gap-8"
        style={{ touchAction: "none" }}
      >
        {/* Counter */}
        <motion.div
          key={squeezeCount}
          initial={{ scale: 1.2, y: -4 }}
          animate={{ scale: 1, y: 0 }}
          className="text-center"
        >
          <p
            className="text-6xl font-black"
            style={{ color: "oklch(0.42 0.12 290)" }}
          >
            {squeezeCount}
          </p>
          <p
            className="text-sm font-bold mt-1"
            style={{ color: "oklch(0.60 0.07 290)" }}
          >
            squeezes
          </p>
        </motion.div>

        {/* The Ball */}
        <div className="relative" style={{ touchAction: "none" }}>
          {/* Glow behind ball */}
          <div
            className="absolute inset-0 rounded-full"
            style={{
              background:
                "radial-gradient(circle, oklch(0.88 0.12 355 / 0.5), transparent 70%)",
              transform: "scale(1.4)",
              filter: "blur(20px)",
            }}
          />

          <motion.div
            animate={controls}
            initial={{ scaleX: 1, scaleY: 1, borderRadius: "50%" }}
            onPointerDown={handleSqueeze}
            onPointerUp={handleRelease}
            onPointerLeave={handleRelease}
            data-ocid="squeezeball.canvas_target"
            style={{
              width: 200,
              height: 200,
              background:
                "radial-gradient(circle at 35% 30%, oklch(0.95 0.08 355), oklch(0.82 0.14 330), oklch(0.72 0.16 310))",
              boxShadow:
                "inset -8px -8px 20px oklch(0.60 0.18 310 / 0.4), inset 6px 6px 16px oklch(1 0 0 / 0.4), 0 16px 48px oklch(0.70 0.14 340 / 0.35)",
              cursor: "pointer",
              touchAction: "none",
              userSelect: "none",
            }}
          >
            {/* Shine */}
            <div
              className="absolute rounded-full"
              style={{
                top: "18%",
                left: "22%",
                width: "32%",
                height: "22%",
                background: "oklch(1 0 0 / 0.55)",
                filter: "blur(4px)",
              }}
            />
          </motion.div>

          {/* Floating particles */}
          <AnimatePresence>
            {particles.map((p) => (
              <motion.div
                key={p.id}
                className="fixed pointer-events-none text-2xl"
                style={{ left: `${p.x}vw`, top: `${p.y}vh`, zIndex: 60 }}
                initial={{ opacity: 1, scale: 0, y: 0 }}
                animate={{
                  opacity: 0,
                  scale: 1.5,
                  y: -80 - Math.random() * 60,
                }}
                exit={{ opacity: 0 }}
                transition={{
                  duration: 1.5 + Math.random() * 1,
                  ease: "easeOut",
                }}
              >
                {p.emoji}
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        <div className="text-center px-8">
          {celebrated ? (
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="flex flex-col items-center gap-3"
            >
              <p
                className="text-lg font-black"
                style={{ color: "oklch(0.42 0.12 150)" }}
              >
                Amazing! You released all that stress! 🎉
              </p>
              <button
                type="button"
                data-ocid="squeezeball.primary_button"
                onClick={handleReset}
                className="px-8 py-3 rounded-2xl font-bold text-white shadow-lg active:scale-95 transition-transform"
                style={{
                  background:
                    "linear-gradient(135deg, oklch(0.72 0.15 355), oklch(0.70 0.14 290))",
                  touchAction: "manipulation",
                }}
              >
                Squeeze Again 🔴
              </button>
            </motion.div>
          ) : (
            <p
              className="text-sm font-medium"
              style={{ color: "oklch(0.60 0.07 290)" }}
            >
              {isSqueezing
                ? "Hold it... 💪"
                : "Press & hold the ball to squeeze! 👆"}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
