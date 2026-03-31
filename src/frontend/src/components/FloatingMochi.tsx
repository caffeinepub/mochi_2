import { AnimatePresence, motion, useAnimation } from "motion/react";
import { useEffect, useRef, useState } from "react";

const MESSAGES = [
  "Bhai tune dekha? Main udd raha hoon! 🪽✨",
  "Teri profile pic mujhse better nahi hogi 😤",
  "Mujhe pakad nahi sakta! Catch me if you can! 🏃",
  "Bhai kya kar raha hai? Kaam kar! 😤",
  "Main toh free hoon, tu nahi 🤭",
  "Oye, itna mat ghooro! Sharam aati hai 🙈",
  "Tap mat kar yaar, tickle hoti hai! 😂",
  "Main celebrity hoon, autograph doon? ✍️",
  "Bhai main bhi thak gaya udne se 😮‍💨",
  "Kya scene hai scene hai! 🎭",
  "Tera mood kaisa hai? Main toh great hoon 💅",
  "Heyy! Kya haal hai? 🥰",
  "Tu bohot accha hai yaar! 💖",
  "Aaj ka din tera hai! ✨",
  "Chill maar, sab theek hoga 🌸",
  "Mochi loves you! 🍡💕",
  "Smile karo na pls 😄",
  "You are enough! 🌟",
  "Koi nahi dekh raha... phir bhi main udd raha hoon 😂",
  "Mujhe gravity se darr nahi lagta 🦸",
];

const GROW_MESSAGES = [
  "Aur dabao! 😈",
  "Main bada ho raha hoon! 😤",
  "Ruko mat! 🔥",
  "Itna mat badhao mujhe! 😅",
  "Almost wala point aa gaya... 👀",
  "BOOM hone waala hoon!! 💣",
];

const BURST_EMOJIS = [
  "💥",
  "✨",
  "🌸",
  "💫",
  "⭐",
  "💖",
  "🎉",
  "🪄",
  "🌟",
  "💎",
];
const FACE_EMOJIS = ["😂", "🤣", "😜", "🥴", "😵", "🫠", "🤪", "😝"];

const MAX_GROW_TAPS = 6; // burst after 6 taps
const GROW_PER_TAP = 0.22; // scale increase per tap

interface Sparkle {
  id: number;
  x: number;
  y: number;
}

interface WindPuff {
  id: number;
  x: number;
  y: number;
}

interface BurstParticle {
  id: number;
  emoji: string;
  angle: number;
  dist: number;
}

export default function FloatingMochi() {
  const [pos, setPos] = useState({ x: 80, y: 120 });
  const [message, setMessage] = useState("");
  const [showMsg, setShowMsg] = useState(false);
  const [sparkles, setSparkles] = useState<Sparkle[]>([]);
  const [windPuffs, setWindPuffs] = useState<WindPuff[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [tapCount, setTapCount] = useState(0);
  const [isSpinning, setIsSpinning] = useState(false);
  const [faceEmoji, setFaceEmoji] = useState("");
  const [showFace, setShowFace] = useState(false);
  const [isBurst, setIsBurst] = useState(false);
  const [caughtMsg, setCaughtMsg] = useState(false);

  // Grow-and-burst state
  const [growTaps, setGrowTaps] = useState(0);
  const [isBursting, setIsBursting] = useState(false);
  const [burstParticles, setBurstParticles] = useState<BurstParticle[]>([]);
  const burstId = useRef(0);

  const sparkleId = useRef(0);
  const windId = useRef(0);
  const floatCount = useRef(0);
  const msgTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const controls = useAnimation();

  // Current display scale based on grow taps (1.0 at 0 taps, up to ~2.3 at max)
  const growScale = 1 + growTaps * GROW_PER_TAP;

  // Auto-float animation
  useEffect(() => {
    let cancelled = false;
    const float = async () => {
      while (!cancelled) {
        const vw = window.innerWidth > 430 ? 430 : window.innerWidth;
        const vh = window.innerHeight;
        const nx = 20 + Math.random() * (Math.min(vw, 430) - 80);
        const ny = 60 + Math.random() * (vh - 200);
        floatCount.current += 1;
        const speedBurst = floatCount.current % 5 === 0;
        if (!isDragging) {
          if (speedBurst) setIsBurst(true);
          setPos((prev) => {
            const puff: WindPuff = {
              id: windId.current++,
              x: prev.x,
              y: prev.y,
            };
            setWindPuffs((w) => [...w, puff]);
            setTimeout(() => {
              setWindPuffs((w) => w.filter((wp) => wp.id !== puff.id));
            }, 600);
            return prev;
          });
          await controls.start({
            x: nx,
            y: ny,
            transition: {
              duration: speedBurst ? 0.5 : 3 + Math.random() * 3,
              ease: "easeInOut",
            },
          });
          setPos({ x: nx, y: ny });
          if (speedBurst) setTimeout(() => setIsBurst(false), 600);
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
    const newSparkles: Sparkle[] = Array.from({ length: 6 }).map(() => ({
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

  const playTapSound = () => {
    try {
      const ctx = new (
        window.AudioContext || (window as any).webkitAudioContext
      )();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = "sine";
      osc.frequency.setValueAtTime(600, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(300, ctx.currentTime + 0.08);
      gain.gain.setValueAtTime(0.2, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.1);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.1);
      setTimeout(() => ctx.close(), 300);
    } catch (_) {}
  };

  const playBurstSound = () => {
    try {
      const ctx = new (
        window.AudioContext || (window as any).webkitAudioContext
      )();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = "sine";
      osc.frequency.setValueAtTime(180, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(40, ctx.currentTime + 0.4);
      gain.gain.setValueAtTime(0.6, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.4);
      const bufSize = ctx.sampleRate * 0.15;
      const buf = ctx.createBuffer(1, bufSize, ctx.sampleRate);
      const data = buf.getChannelData(0);
      for (let i = 0; i < bufSize; i++) data[i] = Math.random() * 2 - 1;
      const source = ctx.createBufferSource();
      source.buffer = buf;
      const nGain = ctx.createGain();
      source.connect(nGain);
      nGain.connect(ctx.destination);
      nGain.gain.setValueAtTime(0.3, ctx.currentTime);
      nGain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.15);
      source.start(ctx.currentTime);
      setTimeout(() => ctx.close(), 600);
    } catch (_) {}
  };

  const triggerBurst = () => {
    setIsBursting(true);
    playBurstSound();
    // Generate burst particles in all directions
    const particles: BurstParticle[] = Array.from({ length: 12 }).map(
      (_, i) => ({
        id: burstId.current++,
        emoji: BURST_EMOJIS[Math.floor(Math.random() * BURST_EMOJIS.length)],
        angle: (i / 12) * 360 + (Math.random() - 0.5) * 20,
        dist: 60 + Math.random() * 60,
      }),
    );
    setBurstParticles(particles);
    // Reset after burst animation
    setTimeout(() => {
      setIsBursting(false);
      setGrowTaps(0);
      setBurstParticles([]);
    }, 700);
  };

  const handleTap = () => {
    if (isBursting) return;
    playTapSound();

    const newGrow = growTaps + 1;

    if (newGrow >= MAX_GROW_TAPS) {
      // Burst!
      setGrowTaps(newGrow);
      setMessage("BOOM!! 💥");
      setShowMsg(true);
      triggerBurst();
      addSparkles(pos.x, pos.y);
      if (msgTimeout.current) clearTimeout(msgTimeout.current);
      msgTimeout.current = setTimeout(() => setShowMsg(false), 2000);
      return;
    }

    setGrowTaps(newGrow);

    // Show grow message based on progress
    const growMsgIdx = Math.min(
      Math.floor((newGrow / MAX_GROW_TAPS) * GROW_MESSAGES.length),
      GROW_MESSAGES.length - 1,
    );
    const msg =
      newGrow === 1
        ? MESSAGES[Math.floor(Math.random() * MESSAGES.length)]
        : GROW_MESSAGES[growMsgIdx];
    setMessage(msg);
    setShowMsg(true);
    addSparkles(pos.x, pos.y);

    const newCount = tapCount + 1;
    setTapCount(newCount);

    const face = FACE_EMOJIS[Math.floor(Math.random() * FACE_EMOJIS.length)];
    setFaceEmoji(face);
    setShowFace(true);
    setTimeout(() => setShowFace(false), 1000);

    if (newCount % 3 === 0) {
      setIsSpinning(true);
      setTimeout(() => setIsSpinning(false), 600);
    }

    if (msgTimeout.current) clearTimeout(msgTimeout.current);
    msgTimeout.current = setTimeout(() => setShowMsg(false), 2500);
  };

  const handleDragEnd = (
    _: unknown,
    info: { offset: { x: number; y: number } },
  ) => {
    setIsDragging(false);
    setPos({ x: pos.x + info.offset.x, y: pos.y + info.offset.y });
    setCaughtMsg(true);
    addSparkles(pos.x + info.offset.x, pos.y + info.offset.y);
    setTimeout(() => setCaughtMsg(false), 2000);
  };

  const wingSpeed = isBurst ? 0.15 : 0.4;

  // Shake intensity grows with growTaps
  const shakeAmount = growTaps > 3 ? (growTaps - 3) * 3 : 0;

  return (
    <div
      ref={containerRef}
      className="pointer-events-none fixed inset-0 z-40"
      style={{ maxWidth: 430, margin: "0 auto" }}
    >
      {/* Wind trail puffs */}
      {windPuffs.map((wp) => (
        <motion.div
          key={wp.id}
          className="pointer-events-none absolute text-base"
          initial={{ opacity: 0.8, scale: 1, x: wp.x + 10, y: wp.y + 10 }}
          animate={{ opacity: 0, scale: 0.4, x: wp.x + 20, y: wp.y + 20 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          style={{ position: "absolute", top: 0, left: 0 }}
        >
          💨
        </motion.div>
      ))}

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

      {/* Burst particles */}
      <AnimatePresence>
        {isBursting &&
          burstParticles.map((p) => {
            const rad = (p.angle * Math.PI) / 180;
            const tx = Math.cos(rad) * p.dist;
            const ty = Math.sin(rad) * p.dist;
            return (
              <motion.div
                key={p.id}
                className="pointer-events-none absolute text-2xl"
                initial={{
                  opacity: 1,
                  scale: 1.5,
                  x: pos.x + 28,
                  y: pos.y + 28,
                }}
                animate={{
                  opacity: 0,
                  scale: 0.3,
                  x: pos.x + 28 + tx,
                  y: pos.y + 28 + ty,
                }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.6, ease: "easeOut" }}
                style={{ position: "absolute", top: 0, left: 0 }}
              >
                {p.emoji}
              </motion.div>
            );
          })}
      </AnimatePresence>

      {/* Mochi Character */}
      <motion.div
        animate={controls}
        initial={{ x: 80, y: 120 }}
        drag
        dragMomentum={false}
        onDragStart={() => setIsDragging(true)}
        onDragEnd={handleDragEnd}
        onTap={handleTap}
        className="pointer-events-auto absolute cursor-pointer select-none"
        style={{ top: 0, left: 0, width: 56, height: 56 }}
        whileHover={{ scale: growScale * 1.1 }}
      >
        {/* Glow ring — gets bigger with growth */}
        <motion.div
          className="absolute inset-0 rounded-full"
          style={{
            background:
              growTaps > 3
                ? "radial-gradient(circle, rgba(255,100,100,0.6) 0%, transparent 70%)"
                : "radial-gradient(circle, rgba(255,182,255,0.5) 0%, transparent 70%)",
            transform: `scale(${1.8 + growTaps * 0.15})`,
          }}
          animate={{
            scale: [
              1.6 + growTaps * 0.1,
              2 + growTaps * 0.15,
              1.6 + growTaps * 0.1,
            ],
            opacity: [0.4, 0.8, 0.4],
          }}
          transition={{
            duration: Math.max(0.5, 2 - growTaps * 0.25),
            repeat: Number.POSITIVE_INFINITY,
            ease: "easeInOut",
          }}
        />

        {/* Mochi body — grows with each tap, shakes near burst */}
        <motion.div
          className="relative w-14 h-14 rounded-full flex items-center justify-center shadow-lg overflow-hidden"
          style={{
            background:
              growTaps > 3
                ? "linear-gradient(135deg, #ffb4b4 0%, #f8b4ff 50%, #ffb4b4 100%)"
                : "linear-gradient(135deg, #ffd6f0 0%, #e8b4f8 50%, #b4d4f8 100%)",
            boxShadow:
              growTaps > 3
                ? `0 4px ${20 + growTaps * 6}px rgba(255,80,80,0.6)`
                : `0 4px ${20 + growTaps * 4}px rgba(200,100,255,0.4)`,
          }}
          animate={{
            scale: isBursting
              ? [growScale, growScale * 1.4, 0.1]
              : isSpinning
                ? [growScale, growScale]
                : growScale,
            rotate: isBursting
              ? [0, 30, -30, 0]
              : isSpinning
                ? [0, 180, 360]
                : shakeAmount > 0
                  ? [-shakeAmount, shakeAmount, -shakeAmount]
                  : [-5, 5, -5],
            y: isBursting ? [0, -20, 0] : [0, -4, 0],
          }}
          transition={{
            scale: isBursting
              ? { duration: 0.5, ease: "easeInOut" }
              : isSpinning
                ? { duration: 0 }
                : { duration: 0.3, ease: "easeOut" },
            rotate: isBursting
              ? { duration: 0.4, ease: "easeInOut" }
              : isSpinning
                ? { duration: 0.5, ease: "easeInOut" }
                : shakeAmount > 0
                  ? {
                      duration: 0.15,
                      repeat: Number.POSITIVE_INFINITY,
                      ease: "easeInOut",
                    }
                  : {
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
          transition={{
            duration: wingSpeed,
            repeat: Number.POSITIVE_INFINITY,
          }}
          style={{ transformOrigin: "right center" }}
        >
          🪽
        </motion.div>
        <motion.div
          className="absolute -right-3 top-3 text-lg"
          animate={{ rotate: [20, -20, 20], scaleX: [1, 1.2, 1] }}
          transition={{
            duration: wingSpeed,
            repeat: Number.POSITIVE_INFINITY,
          }}
          style={{ transformOrigin: "left center" }}
        >
          🪽
        </motion.div>

        {/* Grow progress indicator */}
        <AnimatePresence>
          {growTaps > 0 && !isBursting && (
            <motion.div
              key={growTaps}
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0, opacity: 0 }}
              className="absolute -top-2 -right-2 rounded-full text-white font-black"
              style={{
                background:
                  growTaps >= MAX_GROW_TAPS - 1
                    ? "linear-gradient(135deg, #ff3333, #ff0000)"
                    : growTaps >= MAX_GROW_TAPS / 2
                      ? "linear-gradient(135deg, #ff6b35, #ff3d00)"
                      : "linear-gradient(135deg, #ff6eb4, #c44dff)",
                fontSize: 9,
                minWidth: 18,
                height: 18,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                padding: "0 4px",
                boxShadow: "0 2px 8px rgba(255,50,50,0.5)",
              }}
            >
              {growTaps >= MAX_GROW_TAPS - 1 ? "💣" : `+${growTaps}`}
            </motion.div>
          )}
        </AnimatePresence>

        {/* BURST flash overlay */}
        <AnimatePresence>
          {isBursting && (
            <motion.div
              initial={{ opacity: 0.9, scale: 1 }}
              animate={{ opacity: 0, scale: 4 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.5, ease: "easeOut" }}
              className="absolute inset-0 rounded-full pointer-events-none"
              style={{
                background:
                  "radial-gradient(circle, rgba(255,255,200,1) 0%, rgba(255,180,0,0.6) 50%, transparent 80%)",
                zIndex: 10,
              }}
            />
          )}
        </AnimatePresence>

        {/* Random face emoji on tap */}
        <AnimatePresence>
          {showFace && (
            <motion.div
              key={faceEmoji + tapCount}
              initial={{ opacity: 1, scale: 1.4, y: 0, x: 30 }}
              animate={{ opacity: 0, scale: 0.8, y: -30, x: 40 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.9, ease: "easeOut" }}
              className="pointer-events-none absolute text-2xl"
              style={{ top: -10, left: 0 }}
            >
              {faceEmoji}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Message bubble */}
        <AnimatePresence>
          {(showMsg || caughtMsg) && (
            <motion.div
              key={caughtMsg ? "caught" : message}
              initial={{ opacity: 0, scale: 0.7, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.7, y: 10 }}
              transition={{ type: "spring", stiffness: 400, damping: 20 }}
              className="absolute -top-14 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-2xl px-3 py-1.5 text-xs font-semibold shadow-lg"
              style={{
                background: caughtMsg
                  ? "rgba(255,220,100,0.97)"
                  : isBursting
                    ? "rgba(255,100,50,0.97)"
                    : "rgba(255,255,255,0.95)",
                color: caughtMsg ? "#b45309" : isBursting ? "#fff" : "#c44dff",
                border: caughtMsg
                  ? "1.5px solid #fbbf24"
                  : isBursting
                    ? "1.5px solid #ff6b35"
                    : "1.5px solid #e8b4f8",
                backdropFilter: "blur(8px)",
                maxWidth: 170,
                whiteSpace: "normal",
                textAlign: "center",
              }}
            >
              {caughtMsg ? "Pakad liya! 🎉" : message}
              <div
                className="absolute -bottom-2 left-1/2 -translate-x-1/2"
                style={{
                  width: 0,
                  height: 0,
                  borderLeft: "6px solid transparent",
                  borderRight: "6px solid transparent",
                  borderTop: caughtMsg
                    ? "8px solid rgba(255,220,100,0.97)"
                    : "8px solid rgba(255,255,255,0.95)",
                }}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
