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
import PostTab from "./components/PostTab";
import ProfileTab from "./components/ProfileTab";
import SOSOverlay from "./components/SOSOverlay";
import TheoriesTab from "./components/TheoriesTab";
import { LanguageProvider } from "./context/LanguageContext";
import { ThemeProvider } from "./context/ThemeContext";
import { useGetCallerProfile, useSaveProfile } from "./hooks/useQueries";

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

function AppContent() {
  const [activeTab, setActiveTab] = useState<Tab>("home");
  const [direction, setDirection] = useState(0);
  const [sosOpen, setSosOpen] = useState(false);
  const [postOpen, setPostOpen] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(
    () => !localStorage.getItem("mochi_onboarding_done"),
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

  const slideVariants = getSlideVariants(direction);

  return (
    <div className="flex justify-center items-start min-h-screen bg-accent">
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
            }}
          />
        )}
      </AnimatePresence>

      {/* FloatingMochi — always rendered last so it's on top of everything */}
      <div
        style={{
          position: "fixed",
          zIndex: 9999,
          pointerEvents: "none",
          inset: 0,
          maxWidth: 430,
          margin: "0 auto",
        }}
      >
        <FloatingMochi />
      </div>
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
