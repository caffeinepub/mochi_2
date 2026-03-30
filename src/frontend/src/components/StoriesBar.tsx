import { Trash2 } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { useTheme } from "../context/ThemeContext";

interface StoryTextOverlay {
  text: string;
  color: string;
  fontSize: number;
}

interface Story {
  id: string;
  username: string;
  avatarInitial: string;
  avatarColor: string;
  imageDataUrl: string | null;
  textOverlay: StoryTextOverlay | null;
  viewed: boolean;
  createdAt: number;
}

const STORY_TTL = 24 * 60 * 60 * 1000; // 24 hours
const STORAGE_KEY = "mochi_stories";

const TEXT_COLORS = [
  "#ffffff",
  "#ffec80",
  "#ff7eb3",
  "#7ec8ff",
  "#b8ff7e",
  "#ff9f7e",
];

const AVATAR_GRADIENTS = [
  "from-pink-400 to-rose-500",
  "from-violet-400 to-purple-500",
  "from-sky-400 to-blue-500",
  "from-amber-400 to-orange-500",
  "from-emerald-400 to-teal-500",
];

function loadStoredStories(): Story[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const all = JSON.parse(raw) as Story[];
    // Filter out expired stories (older than 24h)
    return all.filter((s) => Date.now() - s.createdAt < STORY_TTL);
  } catch {
    return [];
  }
}

function saveStories(stories: Story[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(stories));
}

export default function StoriesBar() {
  const { theme } = useTheme();
  const isDark = theme === "dark";

  const [stories, setStories] = useState<Story[]>(loadStoredStories);
  const [viewingIdx, setViewingIdx] = useState<number | null>(null);
  const [progress, setProgress] = useState(0);
  const [creatorOpen, setCreatorOpen] = useState(false);

  // Creator state
  const [pickedImage, setPickedImage] = useState<string | null>(null);
  const [overlayText, setOverlayText] = useState("");
  const [textColor, setTextColor] = useState(TEXT_COLORS[0]);
  const [fontSize, setFontSize] = useState(24);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const progressTimer = useRef<ReturnType<typeof setInterval> | null>(null);

  // Persist stories whenever they change (and prune expired)
  useEffect(() => {
    const fresh = stories.filter((s) => Date.now() - s.createdAt < STORY_TTL);
    saveStories(fresh);
  }, [stories]);

  // Prune expired stories on mount periodically
  useEffect(() => {
    const id = setInterval(() => {
      setStories((prev) => {
        const fresh = prev.filter((s) => Date.now() - s.createdAt < STORY_TTL);
        if (fresh.length !== prev.length) saveStories(fresh);
        return fresh;
      });
    }, 60_000);
    return () => clearInterval(id);
  }, []);

  // Auto-advance story progress
  // biome-ignore lint/correctness/useExhaustiveDependencies: timer depends on viewingIdx
  useEffect(() => {
    if (viewingIdx === null) return;
    setProgress(0);
    progressTimer.current = setInterval(() => {
      setProgress((p) => {
        if (p >= 100) {
          const next = (viewingIdx ?? 0) + 1;
          if (next < stories.length) {
            setViewingIdx(next);
            markViewed(stories[next].id);
          } else {
            setViewingIdx(null);
          }
          return 0;
        }
        return p + 2;
      });
    }, 100);
    return () => {
      if (progressTimer.current) clearInterval(progressTimer.current);
    };
  }, [viewingIdx, stories.length]);

  function markViewed(id: string) {
    setStories((prev) =>
      prev.map((s) => (s.id === id ? { ...s, viewed: true } : s)),
    );
  }

  function openStory(idx: number) {
    setViewingIdx(idx);
    markViewed(stories[idx].id);
  }

  function deleteStory(id: string) {
    setStories((prev) => {
      const updated = prev.filter((s) => s.id !== id);
      saveStories(updated);
      return updated;
    });
    setViewingIdx(null);
  }

  function handleImagePick(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      setPickedImage(ev.target?.result as string);
    };
    reader.readAsDataURL(file);
  }

  function handlePostStory() {
    const newStory: Story = {
      id: `story-${Date.now()}`,
      username: "You",
      avatarInitial: "Y",
      avatarColor: "from-pink-400 to-rose-500",
      imageDataUrl: pickedImage,
      textOverlay: overlayText.trim()
        ? { text: overlayText.trim(), color: textColor, fontSize }
        : null,
      viewed: false,
      createdAt: Date.now(),
    };
    setStories((prev) => {
      const updated = [newStory, ...prev];
      saveStories(updated);
      return updated;
    });
    setPickedImage(null);
    setOverlayText("");
    setTextColor(TEXT_COLORS[0]);
    setFontSize(24);
    setCreatorOpen(false);
  }

  function timeAgo(createdAt: number) {
    const mins = Math.floor((Date.now() - createdAt) / 60000);
    if (mins < 60) return `${mins}m`;
    const hrs = Math.floor(mins / 60);
    return `${hrs}h`;
  }

  const viewingStory = viewingIdx !== null ? stories[viewingIdx] : null;

  return (
    <>
      {/* Stories Row */}
      <div className="flex gap-3 px-4 overflow-x-auto no-scrollbar pb-1">
        {/* Your Story bubble */}
        <button
          type="button"
          data-ocid="stories.open_modal_button"
          onClick={() => setCreatorOpen(true)}
          className="flex flex-col items-center gap-1 flex-shrink-0"
        >
          <div className="relative">
            <div
              className="w-16 h-16 rounded-full flex items-center justify-center"
              style={{
                background: isDark
                  ? "rgba(255,255,255,0.06)"
                  : "rgba(245,240,255,0.9)",
                border: isDark
                  ? "2px dashed rgba(255,100,160,0.4)"
                  : "2px dashed oklch(0.72 0.11 355 / 0.5)",
              }}
            >
              <span className="text-2xl">🌸</span>
            </div>
            <div
              className="absolute -bottom-0.5 -right-0.5 w-5 h-5 rounded-full flex items-center justify-center text-white text-xs font-bold"
              style={{
                background:
                  "linear-gradient(135deg, oklch(0.72 0.11 355), oklch(0.62 0.10 268))",
              }}
            >
              +
            </div>
          </div>
          <span className="text-[10px] font-semibold text-muted-foreground">
            Your Story
          </span>
        </button>

        {/* Story bubbles */}
        {stories.map((story, idx) => (
          <button
            type="button"
            key={story.id}
            data-ocid={`stories.item.${idx + 1}`}
            onClick={() => openStory(idx)}
            className="flex flex-col items-center gap-1 flex-shrink-0"
          >
            <div className={story.viewed ? "story-ring-viewed" : "story-ring"}>
              <div
                className={`w-[58px] h-[58px] rounded-full bg-gradient-to-br ${story.avatarColor} flex items-center justify-center text-white font-bold text-lg overflow-hidden`}
              >
                {story.imageDataUrl ? (
                  <img
                    src={story.imageDataUrl}
                    alt="story"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  story.avatarInitial
                )}
              </div>
            </div>
            <span className="text-[10px] font-semibold text-muted-foreground max-w-[64px] truncate">
              {story.username}
            </span>
            <span className="text-[9px] text-muted-foreground/60">
              {timeAgo(story.createdAt)}
            </span>
          </button>
        ))}

        {stories.length === 0 && (
          <div className="flex items-center text-xs text-muted-foreground py-4 pl-2">
            No stories yet — add yours! ✨
          </div>
        )}
      </div>

      {/* Story Viewer */}
      <AnimatePresence>
        {viewingStory && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center"
            style={{ background: "rgba(0,0,0,0.92)" }}
          >
            {/* Progress bars */}
            <div className="absolute top-4 left-4 right-4 flex gap-1 z-20">
              {stories.map((s, i) => (
                <div
                  key={s.id}
                  className="flex-1 h-0.5 bg-white/30 rounded-full overflow-hidden"
                >
                  <div
                    className="h-full bg-white rounded-full transition-none"
                    style={{
                      width:
                        i < (viewingIdx ?? 0)
                          ? "100%"
                          : i === viewingIdx
                            ? `${progress}%`
                            : "0%",
                    }}
                  />
                </div>
              ))}
            </div>

            {/* Close */}
            <button
              type="button"
              data-ocid="stories.close_button"
              onClick={() => setViewingIdx(null)}
              className="absolute top-10 right-4 z-20 w-8 h-8 rounded-full bg-black/40 flex items-center justify-center text-white"
            >
              ✕
            </button>

            {/* Delete button — only for own stories */}
            {viewingStory.username === "You" && (
              <button
                type="button"
                onClick={() => deleteStory(viewingStory.id)}
                className="absolute top-10 right-14 z-20 w-8 h-8 rounded-full bg-black/40 flex items-center justify-center text-white"
                title="Delete story"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}

            {/* Story content */}
            <div className="relative w-full max-w-[430px] h-full flex items-center justify-center">
              {viewingStory.imageDataUrl ? (
                <img
                  src={viewingStory.imageDataUrl}
                  alt="story"
                  className="w-full h-full object-contain"
                />
              ) : (
                <div
                  className={`w-full h-full flex items-center justify-center bg-gradient-to-br ${viewingStory.avatarColor ?? AVATAR_GRADIENTS[0]}`}
                >
                  <span className="text-8xl">{viewingStory.avatarInitial}</span>
                </div>
              )}

              {viewingStory.textOverlay && (
                <div
                  className="absolute inset-x-4 top-1/2 -translate-y-1/2 text-center pointer-events-none font-black"
                  style={{
                    color: viewingStory.textOverlay.color,
                    fontSize: viewingStory.textOverlay.fontSize,
                    textShadow: "0 2px 8px rgba(0,0,0,0.7)",
                  }}
                >
                  {viewingStory.textOverlay.text}
                </div>
              )}
            </div>

            {/* Tap left/right navigation */}
            <button
              type="button"
              className="absolute left-0 top-0 h-full w-1/3 z-10"
              onClick={() => {
                const prev = (viewingIdx ?? 0) - 1;
                if (prev >= 0) {
                  setViewingIdx(prev);
                  setProgress(0);
                } else setViewingIdx(null);
              }}
              aria-label="Previous story"
            />
            <button
              type="button"
              className="absolute right-0 top-0 h-full w-1/3 z-10"
              onClick={() => {
                const next = (viewingIdx ?? 0) + 1;
                if (next < stories.length) {
                  setViewingIdx(next);
                  setProgress(0);
                } else setViewingIdx(null);
              }}
              aria-label="Next story"
            />

            {/* Username + time */}
            <div className="absolute bottom-12 left-4 flex items-center gap-2 z-20">
              <div
                className={`w-8 h-8 rounded-full bg-gradient-to-br ${viewingStory.avatarColor} flex items-center justify-center text-white text-sm font-bold`}
              >
                {viewingStory.avatarInitial}
              </div>
              <div>
                <span className="text-white font-semibold text-sm">
                  {viewingStory.username}
                </span>
                <p className="text-white/60 text-xs">
                  {timeAgo(viewingStory.createdAt)} ago · expires in{" "}
                  {Math.max(
                    0,
                    Math.floor(
                      (STORY_TTL - (Date.now() - viewingStory.createdAt)) /
                        3600000,
                    ),
                  )}
                  h
                </p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Story Creator Modal */}
      <AnimatePresence>
        {creatorOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-end"
            style={{ background: "rgba(0,0,0,0.7)" }}
          >
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 28, stiffness: 280 }}
              className="w-full rounded-t-3xl flex flex-col"
              style={{
                background: isDark
                  ? "rgba(18,18,35,0.98)"
                  : "rgba(255,255,255,0.98)",
                backdropFilter: "blur(20px)",
                maxHeight: "92vh",
              }}
            >
              {/* Header */}
              <div className="flex items-center justify-between px-5 pt-5 pb-3">
                <h2 className="font-black text-lg text-foreground">
                  Create Story ✨
                </h2>
                <button
                  type="button"
                  data-ocid="stories.close_button"
                  onClick={() => {
                    setCreatorOpen(false);
                    setPickedImage(null);
                    setOverlayText("");
                  }}
                  className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-muted-foreground"
                >
                  ✕
                </button>
              </div>

              <div className="px-5 pb-6 overflow-y-auto flex flex-col gap-4">
                {/* Image Picker */}
                <button
                  type="button"
                  className="relative w-full rounded-2xl overflow-hidden cursor-pointer text-left"
                  style={{
                    height: 220,
                    background: pickedImage
                      ? undefined
                      : isDark
                        ? "rgba(255,255,255,0.06)"
                        : "rgba(245,240,255,0.6)",
                    border: pickedImage
                      ? "none"
                      : "2px dashed oklch(0.62 0.10 268 / 0.4)",
                  }}
                  onClick={() => fileInputRef.current?.click()}
                  onKeyDown={(e) =>
                    e.key === "Enter" && fileInputRef.current?.click()
                  }
                >
                  {pickedImage ? (
                    <>
                      <img
                        src={pickedImage}
                        alt="picked"
                        className="w-full h-full object-cover"
                      />
                      {overlayText && (
                        <div
                          className="absolute inset-x-3 top-1/2 -translate-y-1/2 text-center font-black pointer-events-none"
                          style={{
                            color: textColor,
                            fontSize: fontSize,
                            textShadow: "0 2px 8px rgba(0,0,0,0.7)",
                          }}
                        >
                          {overlayText}
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="flex flex-col items-center justify-center h-full gap-2">
                      <span className="text-4xl">📷</span>
                      <span className="text-sm font-semibold text-muted-foreground">
                        Tap to pick a photo
                      </span>
                    </div>
                  )}
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*,video/*"
                  className="hidden"
                  onChange={handleImagePick}
                />

                {/* Text Overlay */}
                <div className="flex flex-col gap-2">
                  <span className="text-xs font-bold text-muted-foreground uppercase tracking-wide">
                    Add Text
                  </span>
                  <input
                    type="text"
                    data-ocid="stories.input"
                    value={overlayText}
                    onChange={(e) => setOverlayText(e.target.value)}
                    placeholder="Type something... 💜"
                    className="w-full bg-muted rounded-2xl px-4 py-3 text-sm outline-none focus:ring-2 ring-primary/30 text-foreground placeholder:text-muted-foreground"
                  />
                </div>

                {/* Text Color */}
                <div className="flex flex-col gap-2">
                  <span className="text-xs font-bold text-muted-foreground uppercase tracking-wide">
                    Text Color
                  </span>
                  <div className="flex gap-2">
                    {TEXT_COLORS.map((c) => (
                      <button
                        type="button"
                        key={c}
                        onClick={() => setTextColor(c)}
                        className="w-7 h-7 rounded-full transition-transform"
                        style={{
                          background: c,
                          border:
                            textColor === c
                              ? "3px solid oklch(0.68 0.115 355)"
                              : "2px solid rgba(0,0,0,0.15)",
                          transform:
                            textColor === c ? "scale(1.2)" : "scale(1)",
                        }}
                        aria-label={`Color ${c}`}
                      />
                    ))}
                  </div>
                </div>

                {/* Font Size */}
                <div className="flex flex-col gap-2">
                  <span className="text-xs font-bold text-muted-foreground uppercase tracking-wide">
                    Font Size: {fontSize}px
                  </span>
                  <input
                    type="range"
                    min="14"
                    max="48"
                    value={fontSize}
                    onChange={(e) => setFontSize(Number(e.target.value))}
                    className="w-full accent-primary"
                  />
                </div>

                {/* Post Button */}
                <button
                  type="button"
                  data-ocid="stories.submit_button"
                  onClick={handlePostStory}
                  disabled={!pickedImage && !overlayText.trim()}
                  className="w-full py-3.5 rounded-2xl text-white font-black text-base transition-opacity disabled:opacity-40"
                  style={{
                    background:
                      "linear-gradient(135deg, oklch(0.72 0.11 355), oklch(0.62 0.10 268))",
                  }}
                >
                  Post Story 🌸
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
