import { AnimatePresence, motion } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { toast } from "sonner";
import { useLanguage } from "../context/LanguageContext";
import { useAddMoodEntry } from "../hooks/useQueries";
import { addNotification } from "../lib/notifications";
import BreathingGame from "./games/BreathingGame";
import BubblePopGame from "./games/BubblePopGame";
import ColorFloodGame from "./games/ColorFloodGame";
import MemoryGame from "./games/MemoryGame";
import NumberOrderGame from "./games/NumberOrderGame";
import SqueezeBallGame from "./games/SqueezeBallGame";
import WordScrambleGame from "./games/WordScrambleGame";
import ZenTapGame from "./games/ZenTapGame";

const MOODS = [
  {
    emoji: "😢",
    label: "Rough",
    value: 1,
    color: "#93C5FD",
    barColor: "oklch(0.72 0.10 230)",
  },
  {
    emoji: "😟",
    label: "Low",
    value: 2,
    color: "#C4B5FD",
    barColor: "oklch(0.72 0.10 285)",
  },
  {
    emoji: "😐",
    label: "Okay",
    value: 3,
    color: "#E9D5FF",
    barColor: "oklch(0.82 0.06 285)",
  },
  {
    emoji: "🙂",
    label: "Good",
    value: 4,
    color: "#FBCFE8",
    barColor: "oklch(0.85 0.06 355)",
  },
  {
    emoji: "😄",
    label: "Great",
    value: 5,
    color: "#FCA5A5",
    barColor: "oklch(0.72 0.11 355)",
  },
];

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

const MOTIVATIONAL = [
  "Every small step counts. You're doing amazing! ✨",
  "Your feelings are valid. Keep going! 💜",
  "You showed up today. That's enough. 🌸",
  "Progress, not perfection. You've got this! 🌟",
  "Being honest about how you feel is brave. 💪",
];

const MONTH_NAMES = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

type GameId =
  | "bubble"
  | "memory"
  | "word"
  | "breathe"
  | "zen"
  | "color"
  | "number"
  | "squeeze";

const GAMES: {
  id: GameId;
  emoji: string;
  name: string;
  tagline: string;
  gradient: string;
}[] = [
  {
    id: "bubble",
    emoji: "🫧",
    name: "Bubble Pop",
    tagline: "Pop to de-stress",
    gradient:
      "linear-gradient(135deg, oklch(0.88 0.06 220), oklch(0.85 0.07 255))",
  },
  {
    id: "memory",
    emoji: "🧠",
    name: "Memory Match",
    tagline: "Train your brain",
    gradient:
      "linear-gradient(135deg, oklch(0.88 0.06 285), oklch(0.85 0.06 310))",
  },
  {
    id: "word",
    emoji: "📝",
    name: "Word Scramble",
    tagline: "Challenge yourself",
    gradient:
      "linear-gradient(135deg, oklch(0.88 0.06 130), oklch(0.85 0.06 160))",
  },
  {
    id: "breathe",
    emoji: "🌬️",
    name: "Breathing",
    tagline: "Calm down",
    gradient:
      "linear-gradient(135deg, oklch(0.88 0.05 195), oklch(0.85 0.06 220))",
  },
  {
    id: "zen",
    emoji: "🎯",
    name: "Zen Tap",
    tagline: "Find your flow",
    gradient:
      "linear-gradient(135deg, oklch(0.88 0.06 50), oklch(0.85 0.07 30))",
  },
  {
    id: "color",
    emoji: "🎨",
    name: "Color Flood",
    tagline: "Fill with color",
    gradient:
      "linear-gradient(135deg, oklch(0.88 0.06 355), oklch(0.85 0.07 20))",
  },
  {
    id: "number",
    emoji: "🔢",
    name: "Number Order",
    tagline: "Clear your mind",
    gradient:
      "linear-gradient(135deg, oklch(0.88 0.05 240), oklch(0.85 0.06 270))",
  },
  {
    id: "squeeze",
    emoji: "🟡",
    name: "Squeeze Ball",
    tagline: "Release tension",
    gradient:
      "linear-gradient(135deg, oklch(0.90 0.07 75), oklch(0.86 0.08 55))",
  },
];

function getDateKey(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `mochi_mood_${y}-${m}-${d}`;
}

function getStoredMood(date: Date): number | null {
  const key = getDateKey(date);
  const val = localStorage.getItem(key);
  if (val) {
    const n = Number.parseInt(val, 10);
    if (n >= 1 && n <= 5) return n;
  }
  return null;
}

function storeMood(date: Date, moodValue: number) {
  localStorage.setItem(getDateKey(date), String(moodValue));
}

function getMondayOfWeek(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

function buildWeekData(today: Date, todayMood: number | null) {
  const monday = getMondayOfWeek(today);
  return DAYS.map((day, i) => {
    const date = new Date(monday);
    date.setDate(monday.getDate() + i);
    const isToday = date.toDateString() === today.toDateString();
    const value = isToday ? todayMood : getStoredMood(date);
    return { day, value, isToday };
  });
}

function calcStreak(today: Date, loggedToday: boolean): number {
  let count = loggedToday ? 1 : 0;
  const d = new Date(today);
  d.setDate(d.getDate() - 1);
  for (let i = 0; i < 365; i++) {
    if (getStoredMood(d) !== null) {
      count++;
      d.setDate(d.getDate() - 1);
    } else {
      break;
    }
  }
  return count;
}

function generateInsight(
  weekData: { day: string; value: number | null; isToday: boolean }[],
): string {
  const values = weekData
    .map((d) => d.value)
    .filter((v): v is number => v !== null);
  if (values.length < 2) {
    return "Log your mood daily and I'll start spotting patterns for you! Every day matters. 💜";
  }
  const avg = values.reduce((a, b) => a + b, 0) / values.length;
  const first = values[0];
  const last = values[values.length - 1];
  const diff = last - first;
  const lowCount = values.filter((v) => v <= 2).length;

  if (diff >= 1.5) {
    return "Your mood has been improving this week! 🌟 Whatever you're doing — keep it up. You're growing stronger each day. 💜";
  }
  if (diff <= -1.5 || (lowCount >= 2 && avg < 2.5)) {
    return "It looks like this week has been tough. That's okay — bad days don't define you. Take a deep breath and be kind to yourself. 🫧";
  }
  if (avg >= 4) {
    return "You've been in great spirits this week! 😄 That positive energy is contagious — keep shining! ✨";
  }
  if (Math.abs(diff) < 1 && avg >= 2.5) {
    return "Your mood has been steady this week — consistency is underrated strength. 🌸 Little improvements add up!";
  }
  return "Your week has had its ups and downs — that's so human. Remember to be kind to yourself. 💜";
}

interface MonthlyReviewData {
  monthName: string;
  year: number;
  daysLogged: number;
  avgMood: number;
  moodDist: Record<string, number>;
  bestDay: number;
  worstDay: number;
}

function getPrevMonthMoodData(): MonthlyReviewData | null {
  const today = new Date();
  const prevMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1);
  const year = prevMonth.getFullYear();
  const month = prevMonth.getMonth(); // 0-indexed
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const entries: number[] = [];
  for (let d = 1; d <= daysInMonth; d++) {
    const date = new Date(year, month, d);
    const mood = getStoredMood(date);
    if (mood !== null) entries.push(mood);
  }

  if (entries.length < 3) return null;

  const avg = entries.reduce((a, b) => a + b, 0) / entries.length;
  const dist: Record<string, number> = {
    Rough: 0,
    Low: 0,
    Okay: 0,
    Good: 0,
    Great: 0,
  };
  for (const v of entries) {
    const label = MOODS.find((m) => m.value === v)?.label ?? "Okay";
    dist[label] = (dist[label] ?? 0) + 1;
  }

  return {
    monthName: MONTH_NAMES[month],
    year,
    daysLogged: entries.length,
    avgMood: avg,
    moodDist: dist,
    bestDay: Math.max(...entries),
    worstDay: Math.min(...entries),
  };
}

function checkAndSendMonthlyReview() {
  const today = new Date();
  const prevMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1);
  const year = prevMonth.getFullYear();
  const month = prevMonth.getMonth();
  const reviewKey = `mochi_monthly_review_${year}-${String(month + 1).padStart(2, "0")}`;

  if (localStorage.getItem(reviewKey) === "sent") return;

  const data = getPrevMonthMoodData();
  if (!data || data.daysLogged < 5) return;

  const avgMoodObj = MOODS.reduce((best, m) =>
    Math.abs(m.value - data.avgMood) < Math.abs(best.value - data.avgMood)
      ? m
      : best,
  );

  // Find the most frequent mood
  const topMoodLabel =
    Object.entries(data.moodDist).sort((a, b) => b[1] - a[1])[0]?.[0] ?? "Okay";
  const topMoodCount = data.moodDist[topMoodLabel] ?? 0;

  const text = `${data.monthName} ka mood review ready hai! 🌸 Tune ${data.daysLogged} din mood log kiya. Average mood: ${avgMoodObj.label} ${avgMoodObj.emoji}. Sabse zyada: ${topMoodLabel} (${topMoodCount} din). Keep it up babe 💜`;

  addNotification({ type: "monthly_review", text });
  localStorage.setItem(reviewKey, "sent");
}

export default function MoodTab() {
  const { t } = useLanguage();

  const [selectedMood, setSelectedMood] = useState<number | null>(() =>
    getStoredMood(new Date()),
  );
  const [logged, setLogged] = useState<boolean>(
    () => getStoredMood(new Date()) !== null,
  );
  const [activeGame, setActiveGame] = useState<GameId | null>(null);
  const addMoodEntry = useAddMoodEntry();
  const motivational =
    MOTIVATIONAL[Math.floor(Math.random() * MOTIVATIONAL.length)];

  useEffect(() => {
    const stored = getStoredMood(new Date());
    if (stored !== null) {
      setSelectedMood(stored);
      setLogged(true);
    } else {
      setSelectedMood(null);
      setLogged(false);
    }
    checkAndSendMonthlyReview();
  }, []);

  const today = new Date();
  const weekData = buildWeekData(today, selectedMood);
  const streak = calcStreak(today, logged);
  const insight = generateInsight(weekData);
  const monthlyData = getPrevMonthMoodData();

  const handleMoodSelect = (moodValue: number) => {
    const isUpdate = logged && selectedMood !== null;
    setSelectedMood(moodValue);
    setLogged(true);
    storeMood(new Date(), moodValue);
    addMoodEntry.mutate(BigInt(moodValue), {
      onSuccess: () => {
        toast.success(
          isUpdate ? "Mood updated! 💜" : "Mood logged! Keep it up 💜",
        );
      },
      onError: () => {
        if (isUpdate) toast.success("Mood updated! 💜");
      },
    });
  };

  return (
    <div className="flex flex-col">
      <header className="px-4 pt-12 pb-3">
        <h1 className="text-xl font-black text-foreground">Daily Mood</h1>
        <p className="text-sm text-muted-foreground">
          Check in with yourself every day 🌸
        </p>
      </header>

      {/* Streak badge */}
      <div className="mx-4 mb-4">
        <div
          className="flex items-center gap-2 px-4 py-2.5 rounded-2xl w-fit"
          style={{
            background:
              "linear-gradient(135deg, oklch(0.88 0.055 5), oklch(0.885 0.04 280))",
          }}
        >
          <span className="text-lg">🔥</span>
          <span className="font-bold text-sm text-foreground">
            {streak} day streak!
          </span>
          <span className="text-xs text-foreground/60 font-medium">
            Keep it up
          </span>
        </div>
      </div>

      {/* Mood selector card */}
      <div className="mx-4 mb-4 bg-card rounded-3xl p-5 shadow-card border border-border">
        <h2 className="text-base font-bold text-foreground text-center mb-1">
          {t("howAreYouFeeling")}
        </h2>
        <p className="text-xs text-muted-foreground text-center mb-4">
          {logged ? "Tap to change your mood" : "Log today's mood"}
        </p>

        <div className="flex justify-around items-end">
          {MOODS.map((mood) => {
            const isSelected = selectedMood === mood.value;
            return (
              <motion.button
                key={mood.value}
                data-ocid={`mood.checkbox.${mood.value}`}
                onClick={() => handleMoodSelect(mood.value)}
                whileTap={{ scale: 0.9 }}
                className="flex flex-col items-center gap-1 group"
                style={{ touchAction: "manipulation" }}
              >
                <motion.div
                  animate={{ scale: isSelected ? 1.2 : 1 }}
                  className={`text-3xl transition-all duration-200 ${
                    isSelected ? "" : "opacity-70 group-hover:opacity-100"
                  }`}
                >
                  {mood.emoji}
                </motion.div>
                <div
                  className={`w-8 h-8 rounded-full transition-all duration-200 flex items-center justify-center ${
                    isSelected ? "ring-2 ring-offset-2" : "opacity-40"
                  }`}
                  style={{ background: mood.barColor }}
                />
                <span
                  className={`text-[10px] font-bold ${
                    isSelected ? "text-foreground" : "text-muted-foreground"
                  }`}
                >
                  {mood.label}
                </span>
              </motion.button>
            );
          })}
        </div>

        <AnimatePresence>
          {logged && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 8 }}
              className="mt-4 rounded-2xl overflow-hidden"
              style={{
                background:
                  "linear-gradient(135deg, oklch(0.92 0.04 15 / 0.7), oklch(0.91 0.04 285 / 0.7))",
                border: "1px solid oklch(0.90 0.025 285 / 0.4)",
              }}
            >
              <div className="flex items-center justify-between px-4 py-3">
                <div
                  className="flex items-center gap-2.5"
                  data-ocid="mood.success_state"
                >
                  <span className="text-2xl">
                    {MOODS.find((m) => m.value === selectedMood)?.emoji}
                  </span>
                  <div>
                    <p className="text-sm font-black text-foreground leading-tight">
                      {MOODS.find((m) => m.value === selectedMood)?.label} day
                    </p>
                    <p className="text-xs text-muted-foreground font-medium">
                      Mood logged for today ✓
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  data-ocid="mood.edit_button"
                  onClick={() => {
                    setLogged(false);
                    setSelectedMood(null);
                  }}
                  className="text-xs font-bold px-3 py-1.5 rounded-full transition-all active:scale-95"
                  style={{
                    background:
                      "linear-gradient(135deg, oklch(0.72 0.11 355), oklch(0.62 0.10 268))",
                    color: "white",
                    touchAction: "manipulation",
                  }}
                >
                  Change
                </button>
              </div>
              <div
                className="px-4 py-2.5 border-t"
                style={{ borderColor: "oklch(0.88 0.03 285 / 0.5)" }}
              >
                <p className="text-xs text-foreground/70 leading-relaxed font-medium">
                  {motivational}
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Weekly Chart */}
      <div className="mx-4 mb-4 bg-card rounded-3xl p-5 shadow-card border border-border">
        <h3 className="font-bold text-sm text-foreground mb-4">
          This week's journey
        </h3>
        <div className="flex items-end justify-between gap-1 h-28">
          {weekData.map((day, i) => {
            const heightPct = day.value ? (day.value / 5) * 100 : 0;
            const moodData = MOODS.find((m) => m.value === day.value);
            return (
              <div
                key={day.day}
                className="flex flex-col items-center gap-1 flex-1"
              >
                <div className="flex-1 w-full flex items-end">
                  <motion.div
                    className="w-full rounded-t-lg"
                    animate={{ height: day.value ? `${heightPct}%` : "8%" }}
                    transition={{
                      duration: 0.6,
                      ease: "easeOut",
                      delay: i * 0.05,
                    }}
                    style={{
                      background: moodData?.barColor ?? "oklch(0.92 0.02 285)",
                      opacity: day.isToday && !day.value ? 0.3 : 1,
                      minHeight: "6px",
                    }}
                  />
                </div>
                <span
                  className={`text-[10px] font-bold ${
                    day.isToday ? "text-primary" : "text-muted-foreground"
                  }`}
                >
                  {day.day}
                </span>
                {day.value && (
                  <span className="text-sm">
                    {MOODS.find((m) => m.value === day.value)?.emoji}
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* AI Insight */}
      <div
        className="mx-4 mb-4 rounded-3xl p-4"
        style={{
          background:
            "linear-gradient(135deg, oklch(0.88 0.055 5), oklch(0.85 0.055 290), oklch(0.91 0.04 215))",
        }}
      >
        <div className="flex items-center gap-2 mb-2">
          <span className="text-xl">🤖</span>
          <span className="font-bold text-sm text-foreground">
            AI Mood Insight
          </span>
        </div>
        <p className="text-sm text-foreground/80 leading-relaxed">{insight}</p>
      </div>

      {/* Monthly Review Card */}
      {monthlyData && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="mx-4 mb-4 bg-card rounded-3xl p-5 shadow-card border border-border overflow-hidden"
          data-ocid="mood.card"
        >
          <div
            className="absolute inset-0 opacity-30 pointer-events-none"
            style={{
              background:
                "linear-gradient(135deg, oklch(0.82 0.08 285), oklch(0.85 0.07 355), oklch(0.88 0.05 50))",
            }}
          />
          <div className="relative">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-xl">📊</span>
              <div>
                <h3 className="font-black text-sm text-foreground">
                  {monthlyData.monthName} {monthlyData.year} Review
                </h3>
                <p className="text-xs text-muted-foreground">
                  Your last month's mood journey
                </p>
              </div>
            </div>

            <div className="flex items-center gap-4 mb-4">
              <div className="text-center">
                <div className="text-2xl">
                  {
                    MOODS.reduce((best, m) =>
                      Math.abs(m.value - monthlyData.avgMood) <
                      Math.abs(best.value - monthlyData.avgMood)
                        ? m
                        : best,
                    ).emoji
                  }
                </div>
                <p className="text-[10px] font-bold text-muted-foreground mt-0.5">
                  Avg Mood
                </p>
              </div>
              <div className="h-10 w-px bg-border" />
              <div className="text-center">
                <div className="text-xl font-black text-foreground">
                  {monthlyData.daysLogged}
                </div>
                <p className="text-[10px] font-bold text-muted-foreground">
                  Days Logged
                </p>
              </div>
              <div className="h-10 w-px bg-border" />
              <div className="text-center">
                <div className="text-xl">
                  {MOODS.find((m) => m.value === monthlyData.bestDay)?.emoji ??
                    "😄"}
                </div>
                <p className="text-[10px] font-bold text-muted-foreground">
                  Best Day
                </p>
              </div>
            </div>

            {/* Mood distribution */}
            <div className="space-y-1.5">
              {MOODS.slice()
                .reverse()
                .map((mood) => {
                  const count = monthlyData.moodDist[mood.label] ?? 0;
                  const pct =
                    monthlyData.daysLogged > 0
                      ? (count / monthlyData.daysLogged) * 100
                      : 0;
                  if (count === 0) return null;
                  return (
                    <div key={mood.label} className="flex items-center gap-2">
                      <span className="text-sm w-5">{mood.emoji}</span>
                      <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${pct}%` }}
                          transition={{ duration: 0.7, ease: "easeOut" }}
                          className="h-full rounded-full"
                          style={{ background: mood.barColor }}
                        />
                      </div>
                      <span className="text-[10px] font-bold text-muted-foreground w-6 text-right">
                        {count}d
                      </span>
                    </div>
                  );
                })}
            </div>
          </div>
        </motion.div>
      )}

      {/* Games Section */}
      <div className="mx-4 mb-4">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-xl">🎮</span>
          <h3 className="font-black text-base text-foreground">Mind Games</h3>
        </div>
        <p className="text-xs text-muted-foreground mb-3">
          Refresh your mood, clear your head
        </p>

        <div
          className="flex gap-3 overflow-x-auto pb-2"
          style={{ scrollbarWidth: "none", WebkitOverflowScrolling: "touch" }}
        >
          {GAMES.map((game) => (
            <motion.button
              key={game.id}
              data-ocid={`mood.${game.id}.button`}
              whileTap={{ scale: 0.95 }}
              onPointerDown={(e) => {
                const startX = e.clientX;
                const startY = e.clientY;
                const onUp = (ev: PointerEvent) => {
                  document.removeEventListener("pointerup", onUp);
                  if (
                    Math.abs(ev.clientX - startX) < 8 &&
                    Math.abs(ev.clientY - startY) < 8
                  ) {
                    setActiveGame(game.id);
                  }
                };
                document.addEventListener("pointerup", onUp);
              }}
              className="flex-shrink-0 flex flex-col items-center justify-center gap-1.5 rounded-3xl border border-border"
              style={{
                width: 140,
                minHeight: 90,
                background: game.gradient,
                touchAction: "manipulation",
                padding: "14px 10px",
              }}
            >
              <span className="text-2xl">{game.emoji}</span>
              <span className="text-xs font-black text-foreground text-center leading-tight">
                {game.name}
              </span>
              <span className="text-[10px] text-foreground/60 text-center">
                {game.tagline}
              </span>
            </motion.button>
          ))}
        </div>
      </div>

      {/* Footer */}
      <div className="text-center pb-6 text-xs text-muted-foreground">
        © {new Date().getFullYear()}. Built with{" "}
        <span className="text-primary">♥</span> using{" "}
        <a
          href={`https://caffeine.ai?utm_source=caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(typeof window !== "undefined" ? window.location.hostname : "")}`}
          target="_blank"
          rel="noreferrer"
          className="text-secondary hover:underline"
        >
          caffeine.ai
        </a>
      </div>

      {/* Game Portal - renders directly at body level to avoid stacking context issues */}
      {activeGame &&
        createPortal(
          <div
            style={{
              position: "fixed",
              inset: 0,
              zIndex: 9999,
              touchAction: "none",
            }}
          >
            {activeGame === "bubble" && (
              <BubblePopGame onBack={() => setActiveGame(null)} />
            )}
            {activeGame === "memory" && (
              <MemoryGame onBack={() => setActiveGame(null)} />
            )}
            {activeGame === "word" && (
              <WordScrambleGame onBack={() => setActiveGame(null)} />
            )}
            {activeGame === "breathe" && (
              <BreathingGame onBack={() => setActiveGame(null)} />
            )}
            {activeGame === "zen" && (
              <ZenTapGame onBack={() => setActiveGame(null)} />
            )}
            {activeGame === "color" && (
              <ColorFloodGame onBack={() => setActiveGame(null)} />
            )}
            {activeGame === "number" && (
              <NumberOrderGame onBack={() => setActiveGame(null)} />
            )}
            {activeGame === "squeeze" && (
              <SqueezeBallGame onBack={() => setActiveGame(null)} />
            )}
          </div>,
          document.body,
        )}
    </div>
  );
}
