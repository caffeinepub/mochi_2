import { ArrowLeft, RefreshCw } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useState } from "react";

type Phase = "inhale" | "hold" | "exhale" | "rest";

const PHASES: { phase: Phase; label: string; duration: number }[] = [
  { phase: "inhale", label: "Inhale", duration: 4000 },
  { phase: "hold", label: "Hold", duration: 2000 },
  { phase: "exhale", label: "Exhale", duration: 4000 },
  { phase: "rest", label: "Rest...", duration: 1500 },
];

const TOTAL_ROUNDS = 5;
const ROUND_KEYS = ["r0", "r1", "r2", "r3", "r4"];

export default function BreathingGame({ onBack }: { onBack: () => void }) {
  const [phaseIndex, setPhaseIndex] = useState(0);
  const [round, setRound] = useState(1);
  const [done, setDone] = useState(false);
  const [running, setRunning] = useState(false);

  const currentPhase = PHASES[phaseIndex];

  useEffect(() => {
    if (!running || done) return;
    const timer = setTimeout(() => {
      const nextIndex = (phaseIndex + 1) % PHASES.length;
      if (nextIndex === 0) {
        if (round >= TOTAL_ROUNDS) {
          setDone(true);
          setRunning(false);
          return;
        }
        setRound((r) => r + 1);
      }
      setPhaseIndex(nextIndex);
    }, currentPhase.duration);
    return () => clearTimeout(timer);
  }, [running, done, phaseIndex, round, currentPhase.duration]);

  const circleScale =
    currentPhase.phase === "inhale"
      ? 1.4
      : currentPhase.phase === "hold"
        ? 1.4
        : 0.85;
  const circleDuration = currentPhase.duration / 1000;

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col"
      style={{
        background:
          "linear-gradient(160deg, oklch(0.96 0.02 300), oklch(0.94 0.03 340), oklch(0.97 0.015 220))",
      }}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 pt-12 pb-4">
        <button
          type="button"
          data-ocid="breathing.close_button"
          onPointerDown={onBack}
          className="p-2 rounded-full bg-white/60 backdrop-blur-sm hover:bg-white/80 transition-colors"
        >
          <ArrowLeft
            className="w-5 h-5"
            style={{ color: "oklch(0.45 0.10 300)" }}
          />
        </button>
        <div className="text-center">
          <p
            className="text-sm font-bold"
            style={{ color: "oklch(0.45 0.10 300)" }}
          >
            4-2-4 Breathing
          </p>
          {!done && (
            <p className="text-xs" style={{ color: "oklch(0.55 0.07 300)" }}>
              {running ? `Round ${round} of ${TOTAL_ROUNDS}` : "Tap to begin"}
            </p>
          )}
        </div>
        <button
          type="button"
          data-ocid="breathing.secondary_button"
          onPointerDown={() => {
            setDone(false);
            setRound(1);
            setPhaseIndex(0);
            setRunning(false);
          }}
          className="p-2 rounded-full bg-white/60 backdrop-blur-sm hover:bg-white/80 transition-colors"
        >
          <RefreshCw
            className="w-5 h-5"
            style={{ color: "oklch(0.45 0.10 300)" }}
          />
        </button>
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col items-center justify-center gap-8 px-6">
        <AnimatePresence mode="wait">
          {done ? (
            <motion.div
              key="done"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center"
            >
              <div className="text-6xl mb-4">🌸</div>
              <h2
                className="text-2xl font-black mb-2"
                style={{ color: "oklch(0.40 0.12 340)" }}
              >
                Well done!
              </h2>
              <p
                className="text-base font-medium leading-relaxed"
                style={{ color: "oklch(0.50 0.08 300)" }}
              >
                You feel calmer now 💜
              </p>
              <button
                type="button"
                data-ocid="breathing.primary_button"
                onPointerDown={() => {
                  setDone(false);
                  setRound(1);
                  setPhaseIndex(0);
                  setRunning(false);
                }}
                className="mt-6 px-6 py-2.5 rounded-full font-bold text-white text-sm transition-all active:scale-95"
                style={{
                  background:
                    "linear-gradient(135deg, oklch(0.72 0.11 355), oklch(0.62 0.10 268))",
                }}
              >
                Do it again
              </button>
            </motion.div>
          ) : (
            <motion.div key="game" className="flex flex-col items-center gap-8">
              {/* Breathing circle */}
              <button
                type="button"
                data-ocid="breathing.canvas_target"
                className="relative flex items-center justify-center cursor-pointer bg-transparent border-none p-0"
                onPointerDown={() => setRunning(true)}
                style={{ width: 260, height: 260 }}
              >
                {/* Outer glow ring */}
                {running && (
                  <motion.div
                    className="absolute rounded-full"
                    style={{
                      background: "oklch(0.80 0.08 330 / 0.25)",
                      width: 260,
                      height: 260,
                      top: 0,
                      left: 0,
                    }}
                    animate={{ scale: circleScale * 0.78 }}
                    transition={{
                      duration: circleDuration,
                      ease:
                        currentPhase.phase === "inhale"
                          ? "easeIn"
                          : currentPhase.phase === "exhale"
                            ? "easeOut"
                            : "linear",
                    }}
                  />
                )}

                {/* Main circle */}
                <motion.div
                  className="rounded-full flex flex-col items-center justify-center select-none"
                  style={{
                    width: 200,
                    height: 200,
                    background:
                      "radial-gradient(circle at 35% 35%, oklch(0.90 0.06 355), oklch(0.78 0.10 290))",
                    boxShadow: "0 8px 40px oklch(0.72 0.11 320 / 0.35)",
                  }}
                  animate={running ? { scale: circleScale } : { scale: 1 }}
                  transition={{
                    duration: circleDuration,
                    ease:
                      currentPhase.phase === "inhale"
                        ? "easeIn"
                        : currentPhase.phase === "exhale"
                          ? "easeOut"
                          : "linear",
                  }}
                >
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={currentPhase.phase}
                      initial={{ opacity: 0, y: 4 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -4 }}
                      transition={{ duration: 0.3 }}
                      className="text-center"
                    >
                      <p
                        className="text-xl font-black"
                        style={{ color: "oklch(0.30 0.12 320)" }}
                      >
                        {running ? currentPhase.label : "Tap me"}
                      </p>
                      {!running && (
                        <p
                          className="text-xs mt-1 font-medium"
                          style={{ color: "oklch(0.50 0.08 300)" }}
                        >
                          to start
                        </p>
                      )}
                    </motion.div>
                  </AnimatePresence>
                </motion.div>
              </button>

              {/* Round pills */}
              {running && (
                <div className="flex gap-2">
                  {ROUND_KEYS.map((key, i) => (
                    <div
                      key={key}
                      className="w-3 h-3 rounded-full transition-all duration-500"
                      style={{
                        background:
                          i < round - 1
                            ? "oklch(0.62 0.10 268)"
                            : i === round - 1
                              ? "oklch(0.72 0.11 355)"
                              : "oklch(0.88 0.04 300)",
                      }}
                    />
                  ))}
                </div>
              )}

              {!running && (
                <p
                  className="text-sm text-center leading-relaxed px-4 font-medium"
                  style={{ color: "oklch(0.50 0.07 300)" }}
                >
                  5 rounds of calming breathwork 🌬️
                </p>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
