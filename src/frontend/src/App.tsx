import { Toaster } from "@/components/ui/sonner";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useRef, useState } from "react";
import BottomNav from "./components/BottomNav";
import ChatTab from "./components/ChatTab";
import FloatingMochi from "./components/FloatingMochi";
import FriendsTab from "./components/FriendsTab";
import HomeTab from "./components/HomeTab";
import MochiOnboarding from "./components/MochiOnboarding";
import MoodTab from "./components/MoodTab";
import PermissionsRequest from "./components/PermissionsRequest";
import PostTab from "./components/PostTab";
import ProfileTab from "./components/ProfileTab";
import SOSOverlay from "./components/SOSOverlay";
import TheoriesTab from "./components/TheoriesTab";
import { LanguageProvider } from "./context/LanguageContext";
import { ThemeProvider } from "./context/ThemeContext";
import { useGetCallerProfile, useSaveProfile } from "./hooks/useQueries";

const APP_VERSION = "55";

export type Tab =
  | "home"
  | "chat"
  | "post"
  | "mood"
  | "friends"
  | "profile"
  | "theories";

const TAB_ORDER: Tab[] = [
  "home",
  "friends",
  "chat",
  "mood",
  "theories",
  "profile",
];

const ADJECTIVES = [
  "Happy",
  "Calm",
  "Gentle",
  "Bright",
  "Soft",
  "Warm",
  "Kind",
  "Sweet",
  "Cozy",
  "Quiet",
  "Sunny",
  "Dreamy",
];
const NOUNS = [
  "Cloud",
  "Star",
  "Moon",
  "Breeze",
  "Leaf",
  "Wave",
  "Petal",
  "Dawn",
  "Rain",
  "Bloom",
  "Spark",
  "Light",
];

function generateUsername() {
  const adj = ADJECTIVES[Math.floor(Math.random() * ADJECTIVES.length)];
  const noun = NOUNS[Math.floor(Math.random() * NOUNS.length)];
  const num = Math.floor(Math.random() * 99) + 1;
  return `${adj}${noun}${num}`;
}

function getSlideVariants(dir: number) {
  return {
    enter: { x: dir > 0 ? "100%" : "-100%", opacity: 0, scale: 0.97 },
    center: { x: 0, opacity: 1, scale: 1 },
    exit: { x: dir > 0 ? "-100%" : "100%", opacity: 0, scale: 0.97 },
  };
}

function UpdateBanner({ onClose }: { onClose: () => void }) {
  useEffect(() => {
    const timer = setTimeout(onClose, 8000);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <motion.div
      data-ocid="update.panel"
      className="fixed top-0 left-0 right-0 z-[150] flex items-center justify-between gap-2 px-4 py-3 text-white shadow-lg"
      style={{
        background:
          "linear-gradient(90deg, rgba(167,139,250,0.95) 0%, rgba(244,114,182,0.95) 100%)",
        backdropFilter: "blur(12px)",
        WebkitBackdropFilter: "blur(12px)",
      }}
      initial={{ y: "-100%", opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      exit={{ y: "-100%", opacity: 0 }}
      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
    >
      <span className="text-sm font-medium flex-1 leading-snug">
        ✨ Mochi update ho gaya! Naya version available hai — refresh karo best
        experience ke liye 🚀
      </span>
      <div className="flex items-center gap-2 shrink-0">
        <button
          type="button"
          data-ocid="update.primary_button"
          onClick={() => window.location.reload()}
          className="text-xs font-bold bg-white/20 hover:bg-white/30 rounded-xl px-3 py-1.5 transition-colors"
        >
          Refresh Now
        </button>
        <button
          type="button"
          data-ocid="update.close_button"
          onClick={onClose}
          className="text-white/80 hover:text-white text-lg leading-none px-1"
          aria-label="Close"
        >
          ×
        </button>
      </div>
    </motion.div>
  );
}

function AppContent() {
  const [activeTab, setActiveTab] = useState<Tab>("home");
  const [direction, setDirection] = useState(0);
  const [sosOpen, setSosOpen] = useState(false);
  const [postOpen, setPostOpen] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(
    () => !localStorage.getItem("mochi_onboarding_done"),
  );
  const [showUpdateBanner, setShowUpdateBanner] = useState(
    () => localStorage.getItem("mochi_last_seen_version") !== APP_VERSION,
  );
  const [showPermissions, setShowPermissions] = useState(
    () =>
      !!localStorage.getItem("mochi_onboarding_done") &&
      !localStorage.getItem("mochi_permissions_asked"),
  );
  const prevTabRef = useRef<Tab>("home");

  const { data: profile, isLoading: profileLoading } = useGetCallerProfile();
  const saveProfile = useSaveProfile();
  const { mutate: saveProfileMutate } = saveProfile;

  // Give 50 starter points once
  useEffect(() => {
    if (!localStorage.getItem("mochi_starter_points_given")) {
      const current = Number(localStorage.getItem("mochi_local_points") ?? "0");
      localStorage.setItem("mochi_local_points", String(current + 50));
      localStorage.setItem("mochi_starter_points_given", "true");
    }
  }, []);

  useEffect(() => {
    if (!profileLoading && !profile) {
      const username = generateUsername();
      saveProfileMutate(username);
    }
  }, [profile, profileLoading, saveProfileMutate]);

  const handleTabChange = (tab: Tab) => {
    if (tab === "post") {
      setPostOpen(true);
      return;
    }
    const prevIdx = TAB_ORDER.indexOf(prevTabRef.current);
    const nextIdx = TAB_ORDER.indexOf(tab);
    setDirection(nextIdx > prevIdx ? 1 : -1);
    prevTabRef.current = tab;
    setActiveTab(tab);
    setPostOpen(false);
  };

  const dismissUpdateBanner = () => {
    localStorage.setItem("mochi_last_seen_version", APP_VERSION);
    setShowUpdateBanner(false);
  };

  const slideVariants = getSlideVariants(direction);

  return (
    <div className="flex justify-center items-start min-h-screen bg-accent">
      {/* Update banner — above everything */}
      <AnimatePresence>
        {showUpdateBanner && <UpdateBanner onClose={dismissUpdateBanner} />}
      </AnimatePresence>

      <div className="relative w-full max-w-[430px] min-h-screen bg-background flex flex-col shadow-2xl overflow-hidden">
        <main className="flex-1 overflow-y-auto pb-20">
          <AnimatePresence mode="wait" initial={false} custom={direction}>
            <motion.div
              key={activeTab}
              custom={direction}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{
                duration: 0.32,
                ease: [0.25, 0.46, 0.45, 0.94],
                opacity: { duration: 0.2 },
                scale: { duration: 0.32 },
              }}
              className="h-full"
              style={{ willChange: "transform" }}
            >
              {activeTab === "home" && (
                <HomeTab onSOS={() => setSosOpen(true)} />
              )}
              {activeTab === "friends" && <FriendsTab />}
              {activeTab === "chat" && <ChatTab />}
              {activeTab === "mood" && <MoodTab />}
              {activeTab === "theories" && <TheoriesTab />}
              {activeTab === "profile" && <ProfileTab />}
            </motion.div>
          </AnimatePresence>
        </main>
        <BottomNav activeTab={activeTab} onTabChange={handleTabChange} />
        {postOpen && <PostTab onClose={() => setPostOpen(false)} />}
        {sosOpen && <SOSOverlay onClose={() => setSosOpen(false)} />}
      </div>

      {/* Mochi Onboarding Overlay */}
      <AnimatePresence>
        {showOnboarding && (
          <MochiOnboarding
            onClose={() => {
              localStorage.setItem("mochi_onboarding_done", "true");
              setShowOnboarding(false);
              if (!localStorage.getItem("mochi_permissions_asked")) {
                setShowPermissions(true);
              }
            }}
          />
        )}
      </AnimatePresence>

      {/* Permissions Request — shown after onboarding, first time only */}
      <AnimatePresence>
        {!showOnboarding && showPermissions && (
          <PermissionsRequest onDone={() => setShowPermissions(false)} />
        )}
      </AnimatePresence>

      <FloatingMochi />
      <Toaster position="top-center" />
    </div>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <LanguageProvider>
        <AppContent />
      </LanguageProvider>
    </ThemeProvider>
  );
}
