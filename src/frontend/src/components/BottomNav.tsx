import {
  Heart,
  Home,
  Lightbulb,
  MessageCircle,
  Plus,
  User,
  Users,
} from "lucide-react";
import { motion } from "motion/react";
import type { Tab } from "../App";
import { useTheme } from "../context/ThemeContext";

interface BottomNavProps {
  activeTab: Tab;
  onTabChange: (tab: Tab) => void;
}

// 3 left | + (center) | 3 right
const NAV_ITEMS: { id: Tab; icon: typeof Home; label: string }[] = [
  { id: "home", icon: Home, label: "Home" },
  { id: "friends", icon: Users, label: "Friends" },
  { id: "chat", icon: MessageCircle, label: "Chat" },
  { id: "post", icon: Plus, label: "Post" },
  { id: "mood", icon: Heart, label: "Mood" },
  { id: "theories", icon: Lightbulb, label: "Theories" },
  { id: "profile", icon: User, label: "Me" },
];

export default function BottomNav({ activeTab, onTabChange }: BottomNavProps) {
  const { theme } = useTheme();
  const isDark = theme === "dark";

  return (
    <nav
      className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[430px] z-40"
      style={{
        background: "var(--nav-bg)",
        backdropFilter: "blur(28px) saturate(180%)",
        WebkitBackdropFilter: "blur(28px) saturate(180%)",
        borderTop: "1px solid var(--nav-border)",
        boxShadow: "var(--nav-shadow)",
      }}
    >
      <div className="flex items-end justify-between h-[68px] px-2 pb-1">
        {NAV_ITEMS.map((tab) => {
          const Icon = tab.icon;
          const isPost = tab.id === "post";
          const isActive = activeTab === tab.id;

          if (isPost) {
            return (
              <button
                type="button"
                key="post"
                data-ocid="nav.post.button"
                onClick={() => onTabChange("post")}
                aria-label="Create post"
                className="flex-1 flex flex-col items-center justify-end pb-1 -mt-6"
              >
                <motion.div
                  whileTap={{ scale: 0.88 }}
                  whileHover={{ scale: 1.08 }}
                  className="w-12 h-12 rounded-full flex items-center justify-center post-btn-glow"
                  style={{
                    background:
                      "linear-gradient(135deg, oklch(0.78 0.20 5), oklch(0.72 0.18 290))",
                  }}
                >
                  <Icon className="w-5 h-5 text-white" strokeWidth={2.5} />
                </motion.div>
                <span className="text-[8px] font-bold mt-0.5 text-muted-foreground">
                  Create
                </span>
              </button>
            );
          }

          return (
            <button
              type="button"
              key={tab.id}
              data-ocid={`nav.${tab.id}.link`}
              onClick={() => onTabChange(tab.id)}
              className="relative flex-1 flex flex-col items-center justify-end gap-0 pb-1"
            >
              {isActive && (
                <motion.div
                  layoutId="nav-pill"
                  className="absolute -top-1 left-1/2 -translate-x-1/2 w-9 h-9 rounded-2xl -z-10 nav-pill-active"
                  style={{
                    background: isDark
                      ? "linear-gradient(135deg, oklch(0.78 0.20 5 / 0.22), oklch(0.72 0.18 290 / 0.25))"
                      : "linear-gradient(135deg, oklch(0.95 0.05 5), oklch(0.93 0.05 290))",
                    boxShadow: isDark
                      ? "0 0 20px oklch(0.78 0.20 5 / 0.30)"
                      : "0 2px 12px oklch(0.68 0.18 5 / 0.18)",
                  }}
                  transition={{ type: "spring", stiffness: 500, damping: 35 }}
                />
              )}
              <motion.div
                animate={isActive ? { scale: 1.12, y: -1 } : { scale: 1, y: 0 }}
                transition={{ type: "spring", stiffness: 500, damping: 30 }}
              >
                <Icon
                  className={`w-[18px] h-[18px] transition-colors duration-200 ${
                    isActive ? "text-primary" : "text-muted-foreground"
                  }`}
                  strokeWidth={isActive ? 2.5 : 1.8}
                />
              </motion.div>
              <span
                className={`text-[8px] font-bold transition-colors duration-200 ${
                  isActive ? "text-primary" : "text-muted-foreground"
                }`}
              >
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
