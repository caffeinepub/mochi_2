import { Badge } from "@/components/ui/badge";
import {
  Brain,
  Check,
  FlaskConical,
  Ghost,
  Lightbulb,
  Lock,
  Orbit,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";
import { useTheme } from "../context/ThemeContext";

const TEASER_CARDS = [
  {
    emoji: "🌀",
    icon: Orbit,
    label: "Conspiracy",
    color: "oklch(0.68 0.18 300)",
  },
  {
    emoji: "🔬",
    icon: FlaskConical,
    label: "Science",
    color: "oklch(0.68 0.18 200)",
  },
  {
    emoji: "🧠",
    icon: Brain,
    label: "Philosophy",
    color: "oklch(0.68 0.18 250)",
  },
  {
    emoji: "👁️",
    icon: Ghost,
    label: "Paranormal",
    color: "oklch(0.68 0.18 340)",
  },
];

export default function TheoriesTab() {
  const { theme } = useTheme();
  const isDark = theme === "dark";
  const [notified, setNotified] = useState(
    () => localStorage.getItem("theories_notify") === "true",
  );

  function handleNotify() {
    if (notified) return;
    localStorage.setItem("theories_notify", "true");
    setNotified(true);
  }

  return (
    <div
      className="min-h-screen flex flex-col"
      style={{ background: "var(--background)" }}
      data-ocid="theories.page"
    >
      {/* Header */}
      <div
        className="sticky top-0 z-10 px-5 pt-12 pb-4"
        style={{
          background: isDark
            ? "linear-gradient(180deg, oklch(0.15 0.02 290 / 0.98) 0%, transparent 100%)"
            : "linear-gradient(180deg, oklch(0.97 0.01 290 / 0.98) 0%, transparent 100%)",
          backdropFilter: "blur(16px)",
        }}
      >
        <div className="flex items-center gap-2">
          <Lightbulb className="w-6 h-6 text-primary" />
          <h1 className="text-2xl font-bold text-foreground tracking-tight">
            Theories
          </h1>
        </div>
      </div>

      {/* Hero Section */}
      <div className="flex flex-col items-center px-6 pt-8 pb-6 text-center">
        <motion.div
          animate={{
            scale: [1, 1.06, 1],
            boxShadow: [
              "0 0 30px oklch(0.78 0.20 80 / 0.35)",
              "0 0 60px oklch(0.78 0.20 80 / 0.55)",
              "0 0 30px oklch(0.78 0.20 80 / 0.35)",
            ],
          }}
          transition={{
            duration: 3,
            repeat: Number.POSITIVE_INFINITY,
            ease: "easeInOut",
          }}
          className="w-24 h-24 rounded-full flex items-center justify-center mb-6"
          style={{
            background: isDark
              ? "linear-gradient(135deg, oklch(0.28 0.08 80), oklch(0.22 0.06 290))"
              : "linear-gradient(135deg, oklch(0.96 0.08 80), oklch(0.94 0.05 290))",
            border: isDark
              ? "1.5px solid oklch(0.78 0.20 80 / 0.4)"
              : "1.5px solid oklch(0.78 0.20 80 / 0.3)",
          }}
        >
          <Lightbulb
            className="w-12 h-12"
            style={{ color: "oklch(0.78 0.20 80)" }}
            strokeWidth={1.5}
          />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Badge
            className="text-xs font-bold px-3 py-1 mb-4 rounded-full"
            style={{
              background: isDark
                ? "linear-gradient(135deg, oklch(0.78 0.20 5 / 0.25), oklch(0.72 0.18 290 / 0.25))"
                : "linear-gradient(135deg, oklch(0.95 0.08 5), oklch(0.93 0.06 290))",
              border: isDark
                ? "1px solid oklch(0.78 0.20 5 / 0.4)"
                : "1px solid oklch(0.78 0.20 5 / 0.25)",
              color: isDark ? "oklch(0.88 0.12 5)" : "oklch(0.52 0.18 5)",
            }}
          >
            ✨ Coming Soon
          </Badge>
        </motion.div>

        <motion.h2
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="text-3xl font-bold text-foreground mb-3"
          style={{ letterSpacing: "-0.02em" }}
        >
          Explore Wild Ideas
        </motion.h2>

        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="text-muted-foreground text-sm leading-relaxed max-w-xs"
        >
          Mind-bending theories, conspiracy rabbit holes, science mysteries
          &amp; philosophical deep-dives — kuch toh hai yahan! 🤯
        </motion.p>
      </div>

      {/* Teaser Category Cards */}
      <div className="px-5 pb-8">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-4 text-center">
          Categories unlocking soon
        </p>
        <div className="grid grid-cols-2 gap-3">
          {TEASER_CARDS.map((card, i) => (
            <motion.div
              key={card.label}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 + i * 0.08 }}
              className="relative overflow-hidden rounded-2xl p-4 flex flex-col items-center gap-2"
              style={{
                background: isDark
                  ? "oklch(0.20 0.03 290 / 0.7)"
                  : "oklch(0.97 0.02 290 / 0.8)",
                border: isDark
                  ? "1px solid oklch(0.35 0.04 290 / 0.5)"
                  : "1px solid oklch(0.88 0.04 290 / 0.8)",
                backdropFilter: "blur(12px)",
              }}
            >
              <div
                className="w-12 h-12 rounded-xl flex items-center justify-center mb-1"
                style={{
                  background: isDark
                    ? `${card.color.replace(")", " / 0.15)")}`
                    : `${card.color.replace(")", " / 0.10)")}`,
                  border: `1px solid ${card.color.replace(")", " / 0.30)")}`,
                  opacity: 0.65,
                }}
              >
                <span className="text-2xl">{card.emoji}</span>
              </div>
              <span
                className="text-sm font-semibold"
                style={{ color: "var(--muted-foreground)", opacity: 0.7 }}
              >
                {card.label}
              </span>
              <div
                className="absolute inset-0 flex items-center justify-center rounded-2xl"
                style={{
                  background: isDark
                    ? "oklch(0.10 0.02 290 / 0.45)"
                    : "oklch(1 0 0 / 0.40)",
                  backdropFilter: "blur(3px)",
                }}
              >
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center"
                  style={{
                    background: isDark
                      ? "oklch(0.25 0.04 290 / 0.9)"
                      : "oklch(0.98 0.02 290 / 0.9)",
                    border: isDark
                      ? "1px solid oklch(0.40 0.06 290 / 0.6)"
                      : "1px solid oklch(0.80 0.04 290 / 0.6)",
                  }}
                >
                  <Lock
                    className="w-4 h-4 text-muted-foreground"
                    strokeWidth={2}
                  />
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Notify Me button */}
      <div className="flex flex-col items-center gap-2 pb-10 px-5">
        <motion.button
          type="button"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.9 }}
          whileTap={notified ? {} : { scale: 0.93 }}
          onClick={handleNotify}
          className="rounded-full px-6 py-3 text-sm font-semibold flex items-center gap-2 transition-all duration-300"
          style={{
            background: notified
              ? isDark
                ? "linear-gradient(135deg, oklch(0.45 0.18 145 / 0.35), oklch(0.40 0.15 160 / 0.35))"
                : "linear-gradient(135deg, oklch(0.88 0.12 145), oklch(0.86 0.10 160))"
              : isDark
                ? "linear-gradient(135deg, oklch(0.78 0.20 5 / 0.18), oklch(0.72 0.18 290 / 0.18))"
                : "linear-gradient(135deg, oklch(0.95 0.06 5), oklch(0.94 0.05 290))",
            border: notified
              ? isDark
                ? "1px solid oklch(0.55 0.18 145 / 0.5)"
                : "1px solid oklch(0.68 0.14 145 / 0.4)"
              : isDark
                ? "1px solid oklch(0.78 0.20 5 / 0.35)"
                : "1px solid oklch(0.78 0.20 5 / 0.20)",
            color: notified
              ? isDark
                ? "oklch(0.78 0.18 145)"
                : "oklch(0.35 0.16 145)"
              : isDark
                ? "oklch(0.85 0.10 5)"
                : "oklch(0.52 0.18 5)",
            cursor: notified ? "default" : "pointer",
          }}
        >
          <AnimatePresence mode="wait">
            {notified ? (
              <motion.span
                key="done"
                initial={{ opacity: 0, scale: 0.7 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex items-center gap-2"
              >
                <Check className="w-4 h-4" strokeWidth={2.5} />
                You're on the list! 🎉
              </motion.span>
            ) : (
              <motion.span
                key="cta"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex items-center gap-2"
              >
                🔔 Notify me when it drops!
              </motion.span>
            )}
          </AnimatePresence>
        </motion.button>
        {notified && (
          <motion.p
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-xs text-muted-foreground text-center"
          >
            Jab Theories launch hogi, tujhe pehle pata chalega 🤫
          </motion.p>
        )}
      </div>
    </div>
  );
}
