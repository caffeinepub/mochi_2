import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";

const MOCHI_IMG =
  "/assets/file_0000000044cc72089f5bf3d9c00c79db-019d3fa6-47c7-720f-91f8-b7ac04a7f42a.png";

const STEPS = [
  {
    id: "welcome",
    emoji: "🎉",
    title: "Namaste! Main hoon Mochi! 🍡",
    desc: "Tera account ready hai aur humne tujhe 50 bonus points diye hain — welcome gift! 🎁 Yeh points tera safar shuru karte hain!",
    showPoints: true,
    accent: "from-violet-500 to-pink-500",
  },
  {
    id: "home",
    emoji: "🏠",
    title: "Home Feed",
    desc: "Yahan apni feelings share kar, doston ke posts ko like aur comment kar! Aur agar kabhi zaroorat pade, SOS button tujhe instant help dega 🆘",
    showPoints: false,
    accent: "from-sky-500 to-indigo-500",
  },
  {
    id: "friends",
    emoji: "💜",
    title: "AI Friends",
    desc: "Friends tab mein Luna, Sunny, Milo aur Nova hamesha online hain — real bestie vibes, 24/7! Photo aur video bhi bhej sakte ho 📸",
    showPoints: false,
    accent: "from-purple-500 to-violet-500",
  },
  {
    id: "mood",
    emoji: "🎮",
    title: "Mood & Games",
    desc: "Har roz mood check-in kar, weekly chart dekh, aur stress relief games se dimag fresh kar 🌈 Apna emotional journey track kar!",
    showPoints: false,
    accent: "from-emerald-500 to-teal-500",
  },
  {
    id: "profile",
    emoji: "✨",
    title: "Your Profile",
    desc: "Profile mein apna naam, bio aur avatar badal. Points earn kar, badges unlock kar, aur language bhi choose kar! Sab kuch tere haath mein hai 💪",
    showPoints: false,
    accent: "from-amber-500 to-rose-500",
  },
];

interface Props {
  onClose: () => void;
}

export default function MochiOnboarding({ onClose }: Props) {
  const [step, setStep] = useState(0);
  const [dir, setDir] = useState(1);

  const current = STEPS[step];
  const isLast = step === STEPS.length - 1;

  function goNext() {
    if (isLast) {
      onClose();
      return;
    }
    setDir(1);
    setStep((s) => s + 1);
  }

  function goSkip() {
    onClose();
  }

  const slideVariants = {
    enter: (d: number) => ({ x: d > 0 ? 60 : -60, opacity: 0, scale: 0.95 }),
    center: { x: 0, opacity: 1, scale: 1 },
    exit: (d: number) => ({ x: d > 0 ? -60 : 60, opacity: 0, scale: 0.95 }),
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{
        background:
          "linear-gradient(135deg, oklch(0.72 0.11 355 / 0.85), oklch(0.62 0.10 268 / 0.90), oklch(0.68 0.14 270 / 0.85))",
        backdropFilter: "blur(12px)",
      }}
    >
      {/* Decorative blobs */}
      <div
        className="absolute top-10 left-8 w-40 h-40 rounded-full opacity-30 blur-3xl pointer-events-none"
        style={{
          background:
            "radial-gradient(circle, oklch(0.85 0.12 355), transparent)",
        }}
      />
      <div
        className="absolute bottom-16 right-6 w-52 h-52 rounded-full opacity-25 blur-3xl pointer-events-none"
        style={{
          background:
            "radial-gradient(circle, oklch(0.80 0.14 270), transparent)",
        }}
      />

      <div
        className="relative w-full max-w-[360px] rounded-3xl overflow-hidden shadow-2xl"
        style={{
          background: "rgba(255,255,255,0.92)",
          backdropFilter: "blur(24px)",
          border: "1.5px solid rgba(255,255,255,0.7)",
        }}
      >
        {/* Top gradient strip */}
        <div className={`h-1.5 w-full bg-gradient-to-r ${current.accent}`} />

        <AnimatePresence mode="wait" custom={dir}>
          <motion.div
            key={step}
            custom={dir}
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.35, ease: [0.25, 0.46, 0.45, 0.94] }}
            className="px-6 pt-6 pb-4"
          >
            {/* Mascot */}
            <div className="flex justify-center mb-4">
              <motion.div
                initial={{ scale: 0.6, y: 20, opacity: 0 }}
                animate={{ scale: 1, y: 0, opacity: 1 }}
                transition={{
                  type: "spring",
                  stiffness: 280,
                  damping: 18,
                  delay: 0.1,
                }}
                className="relative"
              >
                <motion.img
                  src={MOCHI_IMG}
                  alt="Mochi mascot"
                  className="w-[140px] h-[140px] object-contain drop-shadow-xl"
                  animate={{ y: [0, -8, 0] }}
                  transition={{
                    repeat: Number.POSITIVE_INFINITY,
                    duration: 2.4,
                    ease: "easeInOut",
                  }}
                />
                {/* Glow ring */}
                <div
                  className={`absolute inset-0 rounded-full blur-xl opacity-40 bg-gradient-to-br ${current.accent} -z-10 scale-75`}
                />
              </motion.div>
            </div>

            {/* Speech bubble */}
            <div
              className="relative mb-4 px-4 py-3 rounded-2xl text-center"
              style={{
                background:
                  "linear-gradient(135deg, oklch(0.96 0.03 355 / 0.9), oklch(0.94 0.04 268 / 0.8))",
                border: "1px solid rgba(160, 100, 220, 0.2)",
              }}
            >
              {/* Bubble tail */}
              <div
                className="absolute -top-2 left-1/2 -translate-x-1/2 w-4 h-4 rotate-45 rounded-sm"
                style={{
                  background: "oklch(0.96 0.03 355 / 0.9)",
                  border: "1px solid rgba(160, 100, 220, 0.2)",
                  clipPath: "polygon(0 0, 100% 0, 0 100%)",
                }}
              />
              <span className="text-2xl block mb-1">{current.emoji}</span>
              <h2 className="font-black text-base text-gray-800 leading-snug mb-1">
                {current.title}
              </h2>
              <p className="text-xs text-gray-600 leading-relaxed">
                {current.desc}
              </p>

              {/* Points badge */}
              {current.showPoints && (
                <motion.div
                  initial={{ scale: 0, rotate: -10 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{
                    type: "spring",
                    stiffness: 320,
                    damping: 16,
                    delay: 0.4,
                  }}
                  className="mt-3 inline-flex items-center gap-2 px-4 py-2 rounded-full text-white font-black text-sm shadow-lg"
                  style={{
                    background:
                      "linear-gradient(135deg, oklch(0.72 0.11 355), oklch(0.62 0.10 268))",
                    boxShadow:
                      "0 4px 20px oklch(0.72 0.11 355 / 0.5), 0 0 30px oklch(0.72 0.11 355 / 0.3)",
                  }}
                >
                  <span className="text-lg">⭐</span>
                  <span>+50 Points</span>
                  <span className="text-xs opacity-80">Welcome Gift!</span>
                </motion.div>
              )}
            </div>
          </motion.div>
        </AnimatePresence>

        {/* Progress dots */}
        <div className="flex items-center justify-center gap-2 pb-4">
          {STEPS.map((s, i) => (
            <motion.div
              key={s.id}
              animate={{
                width: i === step ? 24 : 8,
                opacity: i === step ? 1 : 0.35,
              }}
              transition={{ duration: 0.3 }}
              className={`h-2 rounded-full bg-gradient-to-r ${current.accent}`}
            />
          ))}
        </div>

        {/* Buttons */}
        <div className="px-6 pb-6 flex gap-3">
          <button
            type="button"
            data-ocid="onboarding.cancel_button"
            onClick={goSkip}
            className="flex-1 py-3 rounded-2xl text-sm font-bold text-gray-500 hover:bg-gray-100 transition-colors border border-gray-200"
          >
            Skip
          </button>
          <motion.button
            type="button"
            data-ocid="onboarding.primary_button"
            onClick={goNext}
            whileTap={{ scale: 0.96 }}
            className={`flex-[2] py-3 rounded-2xl text-sm font-black text-white shadow-lg transition-all bg-gradient-to-r ${current.accent}`}
            style={{
              boxShadow: "0 6px 24px oklch(0.72 0.11 355 / 0.4)",
            }}
          >
            {isLast ? "Let's Go! 🚀" : "Aage Badho →"}
          </motion.button>
        </div>
      </div>
    </motion.div>
  );
}
