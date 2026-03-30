import {
  Heart,
  MessageCircle,
  Music2,
  Pause,
  Play,
  Share2,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useRef, useState } from "react";

const REELS = [
  {
    id: "r1",
    videoId: "dQw4w9WgXcQ",
    title: "Never Gonna Give You Up 😂",
    creator: "@rickroll_king",
    song: "Never Gonna Give You Up - Rick Astley",
    likes: 4823,
    comments: 312,
    emoji: "😂",
    gradient:
      "linear-gradient(135deg, oklch(0.55 0.18 25), oklch(0.45 0.20 350))",
    description: "bro thought he was safe 😭💀",
  },
  {
    id: "r2",
    videoId: "ZbZSe6N_BXs",
    title: "Happy Pharrell goes hard 🎵",
    creator: "@good_vibes_only",
    song: "Happy - Pharrell Williams",
    likes: 7241,
    comments: 501,
    emoji: "✨",
    gradient:
      "linear-gradient(135deg, oklch(0.70 0.16 80), oklch(0.60 0.18 45))",
    description: "This song never misses fr fr 🌟",
  },
  {
    id: "r3",
    videoId: "9bZkp7q19f0",
    title: "Gangnam Style forever 🐴",
    creator: "@psy_fan_club",
    song: "Gangnam Style - PSY",
    likes: 12093,
    comments: 998,
    emoji: "🐴",
    gradient:
      "linear-gradient(135deg, oklch(0.62 0.14 295), oklch(0.52 0.18 310))",
    description: "still hits different in 2026 😭🎶",
  },
  {
    id: "r4",
    videoId: "JGwWNGJdvx8",
    title: "Shape of You unmatched 🎸",
    creator: "@ed_stan_acc",
    song: "Shape of You - Ed Sheeran",
    likes: 9102,
    comments: 643,
    emoji: "🎸",
    gradient:
      "linear-gradient(135deg, oklch(0.65 0.15 175), oklch(0.55 0.18 155))",
    description: "gym motivation rn 💪🔥",
  },
  {
    id: "r5",
    videoId: "hT_nvWreIhg",
    title: "Counting Stars at 3am 🌟",
    creator: "@one_republic_fan",
    song: "Counting Stars - OneRepublic",
    likes: 5670,
    comments: 289,
    emoji: "🌠",
    gradient:
      "linear-gradient(135deg, oklch(0.45 0.15 250), oklch(0.35 0.18 280))",
    description: "late night song 🌙💫",
  },
];

export default function ReelsTab() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [liked, setLiked] = useState<Set<string>>(new Set());
  const [_playing, _setPlaying] = useState(true);
  const [showVideo, setShowVideo] = useState(false);

  const current = REELS[currentIndex];

  const toggleLike = (id: string) => {
    setLiked((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const goNext = () => {
    if (currentIndex < REELS.length - 1) {
      setCurrentIndex((i) => i + 1);
      setShowVideo(false);
    }
  };

  const goPrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex((i) => i - 1);
      setShowVideo(false);
    }
  };

  return (
    <div
      className="relative w-full h-screen overflow-hidden"
      style={{ background: "#000" }}
    >
      <AnimatePresence mode="wait">
        <motion.div
          key={current.id}
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -40 }}
          transition={{ duration: 0.35 }}
          className="absolute inset-0 flex flex-col"
          style={{ background: current.gradient }}
        >
          {/* Video / Thumbnail area */}
          <button
            type="button"
            className="relative flex-1 overflow-hidden flex items-center justify-center w-full"
            onClick={() => setShowVideo((v) => !v)}
          >
            {showVideo ? (
              <iframe
                className="w-full h-full"
                src={`https://www.youtube.com/embed/${current.videoId}?autoplay=1&mute=0&controls=1&rel=0`}
                title={current.title}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            ) : (
              <>
                <img
                  src={`https://img.youtube.com/vi/${current.videoId}/maxresdefault.jpg`}
                  alt={current.title}
                  className="w-full h-full object-cover opacity-70"
                />
                <div className="absolute inset-0 flex items-center justify-center">
                  <motion.div
                    whileTap={{ scale: 0.9 }}
                    className="w-20 h-20 rounded-full flex items-center justify-center"
                    style={{
                      background: "rgba(255,255,255,0.25)",
                      backdropFilter: "blur(12px)",
                      border: "2px solid rgba(255,255,255,0.4)",
                    }}
                  >
                    <Play className="w-8 h-8 text-white fill-white ml-1" />
                  </motion.div>
                </div>
              </>
            )}
          </button>

          {/* Bottom info overlay */}
          <div
            className="absolute bottom-0 left-0 right-0 p-5 pb-28"
            style={{
              background:
                "linear-gradient(to top, rgba(0,0,0,0.85), transparent)",
              pointerEvents: "none",
            }}
          >
            <div className="text-4xl mb-3">{current.emoji}</div>
            <p className="text-white font-black text-lg leading-tight mb-1">
              {current.title}
            </p>
            <p className="text-white/80 text-sm mb-2">{current.description}</p>
            <p className="text-white font-bold text-sm">{current.creator}</p>
            <div className="flex items-center gap-2 mt-2">
              <div
                className="flex items-center gap-2 px-3 py-1.5 rounded-full"
                style={{
                  background: "rgba(255,255,255,0.15)",
                  backdropFilter: "blur(8px)",
                }}
              >
                <Music2
                  className="w-3.5 h-3.5 text-white animate-spin"
                  style={{ animationDuration: "3s" }}
                />
                <span className="text-white text-xs font-semibold truncate max-w-[180px]">
                  {current.song}
                </span>
              </div>
            </div>
          </div>

          {/* Right action buttons */}
          <div className="absolute right-4 bottom-36 flex flex-col gap-5 items-center">
            <button
              type="button"
              onClick={() => toggleLike(current.id)}
              className="flex flex-col items-center gap-1"
            >
              <motion.div
                whileTap={{ scale: 1.4 }}
                className="w-12 h-12 rounded-full flex items-center justify-center"
                style={{
                  background: "rgba(255,255,255,0.15)",
                  backdropFilter: "blur(8px)",
                }}
              >
                <Heart
                  className={`w-6 h-6 transition-colors ${liked.has(current.id) ? "text-red-400 fill-red-400" : "text-white"}`}
                />
              </motion.div>
              <span className="text-white text-xs font-bold">
                {(
                  current.likes + (liked.has(current.id) ? 1 : 0)
                ).toLocaleString()}
              </span>
            </button>

            <button type="button" className="flex flex-col items-center gap-1">
              <div
                className="w-12 h-12 rounded-full flex items-center justify-center"
                style={{
                  background: "rgba(255,255,255,0.15)",
                  backdropFilter: "blur(8px)",
                }}
              >
                <MessageCircle className="w-6 h-6 text-white" />
              </div>
              <span className="text-white text-xs font-bold">
                {current.comments}
              </span>
            </button>

            <button type="button" className="flex flex-col items-center gap-1">
              <div
                className="w-12 h-12 rounded-full flex items-center justify-center"
                style={{
                  background: "rgba(255,255,255,0.15)",
                  backdropFilter: "blur(8px)",
                }}
              >
                <Share2 className="w-6 h-6 text-white" />
              </div>
              <span className="text-white text-xs font-bold">Share</span>
            </button>
          </div>

          {/* Swipe nav zones */}
          <div
            className="absolute inset-x-0 top-14 bottom-32 flex flex-col"
            style={{ pointerEvents: "none" }}
          >
            <button
              type="button"
              className="flex-1 w-full"
              style={{ pointerEvents: "auto" }}
              onClick={goPrev}
            />
            <button
              type="button"
              className="flex-1 w-full"
              style={{ pointerEvents: "auto" }}
              onClick={goNext}
            />
          </div>

          {/* Page dots */}
          <div className="absolute top-14 right-4 flex flex-col gap-1.5">
            {REELS.map((reel, i) => (
              <div
                key={`dot-${reel.id}`}
                className="w-1 rounded-full transition-all duration-300"
                style={{
                  height: i === currentIndex ? "20px" : "4px",
                  background:
                    i === currentIndex ? "white" : "rgba(255,255,255,0.35)",
                }}
              />
            ))}
          </div>
        </motion.div>
      </AnimatePresence>

      {/* Header */}
      <div
        className="absolute top-0 left-0 right-0 flex items-center justify-between px-4 pt-12 pb-2"
        style={{ zIndex: 10 }}
      >
        <h1 className="text-white font-black text-xl">Vibes 🎬</h1>
        <div
          className="px-3 py-1 rounded-full text-white text-xs font-bold"
          style={{
            background: "rgba(255,255,255,0.2)",
            backdropFilter: "blur(8px)",
          }}
        >
          {currentIndex + 1}/{REELS.length}
        </div>
      </div>
    </div>
  );
}
