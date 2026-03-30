import { ArrowLeft, CheckCircle2, RotateCcw } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

const WORD_BANKS: string[][] = [
  ["CALM", "HOPE", "LOVE", "GLOW", "PLAY", "CARE", "KIND", "REST"],
  ["BRAVE", "PEACE", "SHINE", "GRACE", "SMILE", "TRUST", "HAPPY", "RELAX"],
  [
    "GENTLE",
    "JOYFUL",
    "BRIGHT",
    "SERENE",
    "UPLIFT",
    "WARMTH",
    "GROWTH",
    "THRIVE",
  ],
  [
    "BALANCE",
    "FREEDOM",
    "HEALING",
    "COURAGE",
    "BLOSSOM",
    "HARMONY",
    "VIBRANT",
    "RAINBOW",
  ],
  [
    "SERENITY",
    "GRATITUDE",
    "STRENGTH",
    "WELLNESS",
    "POSITIVE",
    "MINDFULLY",
    "PEACEFULLY",
    "CELEBRATE",
  ],
];

const LEVEL_NAMES = ["Level 1", "Level 2", "Level 3", "Level 4", "Level 5"];
const WORDS_PER_LEVEL = 8;

function scramble(word: string): string {
  const arr = word.split("");
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  const result = arr.join("");
  return result === word ? scramble(word) : result;
}

interface GameState {
  level: number;
  wordIndex: number;
  score: number;
  scrambled: string;
  target: string;
  showCelebration: boolean;
  levelComplete: boolean;
  gameComplete: boolean;
}

function makeState(level: number, wordIndex: number, score: number): GameState {
  const bank = WORD_BANKS[level];
  const target = bank[wordIndex % bank.length];
  return {
    level,
    wordIndex,
    score,
    scrambled: scramble(target),
    target,
    showCelebration: false,
    levelComplete: false,
    gameComplete: false,
  };
}

export default function WordScrambleGame({ onBack }: { onBack: () => void }) {
  const [state, setState] = useState<GameState>(() => makeState(0, 0, 0));
  const [input, setInput] = useState("");
  const [shake, setShake] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const levelColor = useMemo(() => {
    const colors = [
      "from-pink-300 to-rose-300",
      "from-purple-300 to-indigo-300",
      "from-sky-300 to-blue-300",
      "from-emerald-300 to-teal-300",
      "from-amber-300 to-orange-300",
    ];
    return colors[state.level % colors.length];
  }, [state.level]);

  const handleSubmit = useCallback(() => {
    if (!input.trim()) return;
    const answer = input.trim().toUpperCase();
    if (answer === state.target) {
      const newScore = state.score + 1;
      const newWordIndex = state.wordIndex + 1;
      const isLevelComplete = newWordIndex >= WORDS_PER_LEVEL;
      const isGameComplete =
        isLevelComplete && state.level >= WORD_BANKS.length - 1;

      setState((prev) => ({
        ...prev,
        score: newScore,
        showCelebration: true,
        levelComplete: isLevelComplete,
        gameComplete: isGameComplete,
      }));
      setInput("");
    } else {
      setShake(true);
      setTimeout(() => setShake(false), 500);
    }
  }, [input, state]);

  const handleNext = useCallback(() => {
    if (state.gameComplete) {
      setState(makeState(0, 0, 0));
    } else if (state.levelComplete) {
      setState(makeState(state.level + 1, 0, state.score));
    } else {
      setState(makeState(state.level, state.wordIndex + 1, state.score));
    }
    setInput("");
    setTimeout(() => inputRef.current?.focus(), 100);
  }, [state]);

  const handleReset = useCallback(() => {
    setState(makeState(0, 0, 0));
    setInput("");
  }, []);

  // biome-ignore lint/correctness/useExhaustiveDependencies: intentional focus trigger
  useEffect(() => {
    inputRef.current?.focus();
  }, [state.wordIndex, state.level]);

  const wordProgress = state.wordIndex % WORDS_PER_LEVEL;

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col"
      style={{
        background:
          "linear-gradient(160deg, oklch(0.97 0.015 355), oklch(0.95 0.025 290), oklch(0.97 0.015 215))",
      }}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 pt-12 pb-4">
        <button
          type="button"
          data-ocid="wordscramble.close_button"
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
            className="text-sm font-black"
            style={{ color: "oklch(0.40 0.10 290)" }}
          >
            Word Scramble 🔤
          </p>
          <p className="text-xs" style={{ color: "oklch(0.55 0.07 290)" }}>
            {LEVEL_NAMES[state.level]} · Word {wordProgress + 1}/
            {WORDS_PER_LEVEL} · Score: {state.score}
          </p>
        </div>
        <button
          type="button"
          data-ocid="wordscramble.secondary_button"
          onClick={handleReset}
          className="p-2 rounded-full bg-white/60 backdrop-blur-sm hover:bg-white/80 transition-colors"
        >
          <RotateCcw
            className="w-5 h-5"
            style={{ color: "oklch(0.45 0.10 280)" }}
          />
        </button>
      </div>

      {/* Level progress bar */}
      <div className="px-6 mb-4">
        <div className="h-2 rounded-full bg-white/40 overflow-hidden">
          <motion.div
            className={`h-full rounded-full bg-gradient-to-r ${levelColor}`}
            animate={{ width: `${(wordProgress / WORDS_PER_LEVEL) * 100}%` }}
            transition={{ duration: 0.4 }}
          />
        </div>
      </div>

      {/* Main card */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 gap-6">
        <AnimatePresence mode="wait">
          {state.showCelebration ? (
            <motion.div
              key="celebration"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              className="text-center"
            >
              <div className="text-6xl mb-4">
                {state.gameComplete ? "🏆" : state.levelComplete ? "🎊" : "✅"}
              </div>
              <p
                className="font-black text-xl mb-2"
                style={{ color: "oklch(0.35 0.12 290)" }}
              >
                {state.gameComplete
                  ? "You completed all levels!"
                  : state.levelComplete
                    ? `${LEVEL_NAMES[state.level]} complete! 🌟`
                    : `"${state.target}" — Correct! 🌸`}
              </p>
              <p
                className="text-sm mb-6"
                style={{ color: "oklch(0.55 0.07 280)" }}
              >
                {state.gameComplete
                  ? `Amazing! Final score: ${state.score}`
                  : state.levelComplete
                    ? `Moving to ${LEVEL_NAMES[state.level + 1] ?? "the end"} 🚀`
                    : `Keep going, you're on fire!`}
              </p>
              <button
                type="button"
                data-ocid="wordscramble.primary_button"
                onClick={handleNext}
                className={`px-8 py-3 rounded-2xl font-bold text-white bg-gradient-to-r ${levelColor} shadow-lg active:scale-95 transition-transform`}
              >
                {state.gameComplete
                  ? "Play Again 🎉"
                  : state.levelComplete
                    ? "Next Level →"
                    : "Next Word →"}
              </button>
            </motion.div>
          ) : (
            <motion.div
              key={`word-${state.level}-${state.wordIndex}`}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="w-full"
            >
              <div
                className="rounded-3xl p-8 text-center mb-6 shadow-xl"
                style={{
                  background: "rgba(255,255,255,0.7)",
                  backdropFilter: "blur(20px)",
                }}
              >
                <p
                  className="text-xs font-semibold mb-4"
                  style={{ color: "oklch(0.60 0.07 280)" }}
                >
                  Unscramble this word:
                </p>
                <motion.div
                  animate={shake ? { x: [-8, 8, -8, 8, 0] } : {}}
                  transition={{ duration: 0.4 }}
                  className="flex justify-center gap-2 flex-wrap mb-2"
                >
                  {state.scrambled.split("").map((letter, i) => (
                    <div
                      // biome-ignore lint/suspicious/noArrayIndexKey: letter positions are order-dependent
                      key={i}
                      className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-lg bg-gradient-to-br ${levelColor} text-white shadow-md`}
                    >
                      {letter}
                    </div>
                  ))}
                </motion.div>
              </div>

              <div className="flex gap-3">
                <input
                  ref={inputRef}
                  type="text"
                  data-ocid="wordscramble.input"
                  value={input}
                  onChange={(e) => setInput(e.target.value.toUpperCase())}
                  onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
                  placeholder="Type your answer..."
                  maxLength={20}
                  className="flex-1 rounded-2xl px-5 py-3.5 text-base font-bold outline-none bg-white/70 backdrop-blur-sm shadow-sm focus:ring-2 ring-purple-300/50 tracking-widest"
                  style={{ color: "oklch(0.35 0.12 290)" }}
                />
                <button
                  type="button"
                  data-ocid="wordscramble.submit_button"
                  onClick={handleSubmit}
                  className={`px-5 py-3.5 rounded-2xl font-black text-white bg-gradient-to-br ${levelColor} shadow-md active:scale-95 transition-transform`}
                >
                  <CheckCircle2 className="w-5 h-5" />
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <p
        className="text-center text-xs pb-6 font-medium"
        style={{ color: "oklch(0.60 0.07 280)" }}
      >
        Wellness words to lift your spirit 🌸
      </p>
    </div>
  );
}
