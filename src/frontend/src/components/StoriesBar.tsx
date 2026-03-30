import { Eye, Pencil, Trash2 } from "lucide-react";
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
  reactions: Record<string, number>;
  seenBy: string[];
}

const STORY_TTL = 24 * 60 * 60 * 1000; // 24 hours
const STORAGE_KEY = "mochi_stories";
const REACTION_EMOJIS = ["❤️", "😂", "😮"];
const FAKE_VIEWERS = ["luna_✨", "sunny_🌻", "milo_🌊", "nova_⭐"];

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

function withDefaults(s: Partial<Story> & { id: string }): Story {
  return {
    username: "",
    avatarInitial: "?",
    avatarColor: AVATAR_GRADIENTS[0],
    imageDataUrl: null,
    textOverlay: null,
    viewed: false,
    createdAt: Date.now(),
    reactions: {},
    seenBy: [],
    ...s,
  };
}

function loadStoredStories(): Story[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const all = JSON.parse(raw) as Partial<Story>[];
    return all
      .filter((s) => s.id && Date.now() - (s.createdAt ?? 0) < STORY_TTL)
      .map((s) => withDefaults(s as Partial<Story> & { id: string }));
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
  const [seenSheetOpen, setSeenSheetOpen] = useState(false);
  const [userReaction, setUserReaction] = useState<Record<string, string>>({});
  const [editingStoryId, setEditingStoryId] = useState<string | null>(null); // storyId -> emoji

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

  // When opening a non-own story, add a fake viewer to seenBy
  // biome-ignore lint/correctness/useExhaustiveDependencies: intentionally runs only on viewingIdx change
  useEffect(() => {
    if (viewingIdx === null) return;
    const story = stories[viewingIdx];
    if (!story || story.username === "You") return;
    // Pick a random fake viewer not already present
    const newViewers = FAKE_VIEWERS.filter((v) => !story.seenBy.includes(v));
    if (newViewers.length === 0) return;
    const pick = newViewers[Math.floor(Math.random() * newViewers.length)];
    setStories((prev) =>
      prev.map((s) =>
        s.id === story.id ? { ...s, seenBy: [...s.seenBy, pick] } : s,
      ),
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [viewingIdx]);

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

  function handleReact(storyId: string, emoji: string) {
    const prev = userReaction[storyId];
    setStories((prevStories) =>
      prevStories.map((s) => {
        if (s.id !== storyId) return s;
        const r = { ...s.reactions };
        // Remove previous reaction
        if (prev) {
          r[prev] = Math.max(0, (r[prev] ?? 1) - 1);
          if (r[prev] === 0) delete r[prev];
        }
        // Toggle or add new
        if (prev !== emoji) {
          r[emoji] = (r[emoji] ?? 0) + 1;
        }
        return { ...s, reactions: r };
      }),
    );
    setUserReaction((prev) => ({
      ...prev,
      [storyId]: prev[storyId] === emoji ? "" : emoji,
    }));
  }

  function compressImage(dataUrl: string, maxDim = 800): Promise<string> {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        const scale = Math.min(1, maxDim / Math.max(img.width, img.height));
        canvas.width = img.width * scale;
        canvas.height = img.height * scale;
        const ctx = canvas.getContext("2d")!;
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL("image/jpeg", 0.7));
      };
      img.onerror = () => resolve(dataUrl);
      img.src = dataUrl;
    });
  }

  function handleImagePick(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (ev) => {
      const raw = ev.target?.result as string;
      const compressed = raw.length > 500_000 ? await compressImage(raw) : raw;
      setPickedImage(compressed);
    };
    reader.readAsDataURL(file);
  }

  function handlePostStory() {
    const randomGradient =
      AVATAR_GRADIENTS[Math.floor(Math.random() * AVATAR_GRADIENTS.length)];

    if (editingStoryId) {
      // Update existing story
      setStories((prev) => {
        const updated = prev.map((s) =>
          s.id === editingStoryId
            ? {
                ...s,
                imageDataUrl: pickedImage,
                avatarColor: pickedImage
                  ? "from-pink-400 to-rose-500"
                  : s.avatarColor,
                textOverlay: overlayText.trim()
                  ? { text: overlayText.trim(), color: textColor, fontSize }
                  : null,
              }
            : s,
        );
        saveStories(updated);
        return updated;
      });
      setEditingStoryId(null);
    } else {
      const newStory: Story = {
        id: `story-${Date.now()}`,
        username: "You",
        avatarInitial: "Y",
        avatarColor: pickedImage ? "from-pink-400 to-rose-500" : randomGradient,
        imageDataUrl: pickedImage,
        textOverlay: overlayText.trim()
          ? { text: overlayText.trim(), color: textColor, fontSize }
          : null,
        viewed: false,
        createdAt: Date.now(),
        reactions: {},
        seenBy: [],
      };
      try {
        setStories((prev) => {
          const updated = [newStory, ...prev];
          try {
            saveStories(updated);
          } catch {
            const trimmed = [newStory, ...prev.slice(0, 5)];
            saveStories(trimmed);
            return trimmed;
          }
          return updated;
        });
      } catch (e) {
        console.error("Story post failed", e);
      }
    }
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
  const myStories = stories.filter((s) => s.username === "You");
  const totalSeenCount = myStories.reduce((acc, s) => acc + s.seenBy.length, 0);

  // Gradient preview class for text-only stories
  const previewGradient = AVATAR_GRADIENTS[0];

  return (
    <>
      {/* Stories Row */}
      <div className="flex gap-3 px-4 overflow-x-auto no-scrollbar pb-1">
        {/* Your Story bubble */}
        <button
          type="button"
          data-ocid="stories.open_modal_button"
          onPointerDown={() => setCreatorOpen(true)}
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
            {/* Seen count badge on Your Story */}
            {totalSeenCount > 0 && (
              <div
                className="absolute -top-1 -left-1 flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[9px] font-bold text-white"
                style={{
                  background: "rgba(0,0,0,0.6)",
                  backdropFilter: "blur(4px)",
                }}
              >
                <Eye className="w-2.5 h-2.5" />
                {totalSeenCount}
              </div>
            )}
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
            onPointerDown={() => openStory(idx)}
            className="flex flex-col items-center gap-1 flex-shrink-0"
          >
            <div className="relative">
              <div
                className={story.viewed ? "story-ring-viewed" : "story-ring"}
              >
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
              {/* Eye indicator for own stories */}
              {story.username === "You" && story.seenBy.length > 0 && (
                <div
                  className="absolute -bottom-0.5 -right-0.5 flex items-center gap-0.5 px-1 py-0.5 rounded-full text-[8px] font-bold text-white"
                  style={{
                    background: "rgba(0,0,0,0.65)",
                    backdropFilter: "blur(4px)",
                  }}
                >
                  <Eye className="w-2 h-2" />
                  {story.seenBy.length}
                </div>
              )}
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
            initial={{ opacity: 0, scale: 0.97 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.97 }}
            transition={{ duration: 0.15, ease: "easeOut" }}
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
              onPointerDown={() => setViewingIdx(null)}
              className="absolute top-10 right-4 z-20 w-8 h-8 rounded-full bg-black/40 flex items-center justify-center text-white"
            >
              ✕
            </button>

            {/* Edit + Delete buttons — only for own stories */}
            {viewingStory.username === "You" && (
              <>
                <button
                  type="button"
                  data-ocid="stories.edit_button"
                  onPointerDown={() => {
                    const story = viewingStory;
                    setViewingIdx(null);
                    setPickedImage(story.imageDataUrl);
                    setOverlayText(story.textOverlay?.text ?? "");
                    setTextColor(story.textOverlay?.color ?? TEXT_COLORS[0]);
                    setFontSize(story.textOverlay?.fontSize ?? 24);
                    setEditingStoryId(story.id);
                    setCreatorOpen(true);
                  }}
                  className="absolute top-10 right-24 z-20 w-8 h-8 rounded-full bg-black/40 flex items-center justify-center text-white"
                  title="Edit story"
                >
                  <Pencil className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  data-ocid="stories.delete_button"
                  onPointerDown={() => deleteStory(viewingStory.id)}
                  className="absolute top-10 right-14 z-20 w-8 h-8 rounded-full bg-black/40 flex items-center justify-center text-white"
                  title="Delete story"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </>
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

            {/* Bottom area: reactions + username + seen */}
            <div className="absolute bottom-0 left-0 right-0 z-20 flex flex-col pb-8">
              {/* Reaction Bar */}
              {viewingStory.username !== "You" && (
                <div className="flex items-center justify-center gap-3 mb-3 px-4">
                  {REACTION_EMOJIS.map((emoji) => {
                    const count = viewingStory.reactions[emoji] ?? 0;
                    const isActive = userReaction[viewingStory.id] === emoji;
                    return (
                      <motion.button
                        key={emoji}
                        type="button"
                        data-ocid="stories.toggle"
                        whileTap={{ scale: 0.88 }}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleReact(viewingStory.id, emoji);
                        }}
                        className="flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-semibold transition-all"
                        style={{
                          background: isActive
                            ? "rgba(255,255,255,0.28)"
                            : "rgba(255,255,255,0.12)",
                          backdropFilter: "blur(12px)",
                          border: isActive
                            ? "1.5px solid rgba(255,255,255,0.55)"
                            : "1.5px solid rgba(255,255,255,0.18)",
                          boxShadow: isActive
                            ? "0 0 12px rgba(255,180,230,0.4), 0 2px 8px rgba(0,0,0,0.2)"
                            : "0 2px 8px rgba(0,0,0,0.15)",
                          color: "white",
                        }}
                      >
                        <span className="text-base leading-none">{emoji}</span>
                        {count > 0 && (
                          <span className="text-xs text-white/90">{count}</span>
                        )}
                      </motion.button>
                    );
                  })}
                </div>
              )}

              {/* Username row + Seen by */}
              <div className="flex items-center justify-between px-4">
                <div className="flex items-center gap-2">
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

                {/* Seen by — only for own stories */}
                {viewingStory.username === "You" && (
                  <button
                    type="button"
                    data-ocid="stories.open_modal_button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setSeenSheetOpen(true);
                    }}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold text-white/80 transition-all"
                    style={{
                      background: "rgba(255,255,255,0.12)",
                      backdropFilter: "blur(10px)",
                      border: "1px solid rgba(255,255,255,0.2)",
                    }}
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>Seen by {viewingStory.seenBy.length}</span>
                  </button>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Seen By Sheet */}
      <AnimatePresence>
        {seenSheetOpen && viewingStory && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] flex items-start"
            style={{ background: "rgba(0,0,0,0.5)" }}
            onClick={() => setSeenSheetOpen(false)}
          >
            <motion.div
              initial={{ y: "-100%" }}
              animate={{ y: 0 }}
              exit={{ y: "-100%" }}
              transition={{ type: "spring", damping: 30, stiffness: 300 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full rounded-b-3xl"
              style={{
                background: isDark
                  ? "rgba(22,22,40,0.98)"
                  : "rgba(255,255,255,0.98)",
                backdropFilter: "blur(24px)",
                maxHeight: "60vh",
              }}
            >
              {/* Handle */}
              <div className="flex justify-center pt-3 pb-1">
                <div className="w-10 h-1 rounded-full bg-muted-foreground/30" />
              </div>

              <div className="px-5 pb-2 pt-2 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Eye className="w-4 h-4 text-muted-foreground" />
                  <h3 className="font-black text-base text-foreground">
                    Seen by {viewingStory.seenBy.length}
                  </h3>
                </div>
                <button
                  type="button"
                  data-ocid="stories.close_button"
                  onClick={() => setSeenSheetOpen(false)}
                  className="w-7 h-7 rounded-full bg-muted flex items-center justify-center text-muted-foreground text-sm"
                >
                  ✕
                </button>
              </div>

              <div
                className="px-5 pb-8 overflow-y-auto flex flex-col gap-2 mt-1"
                style={{
                  maxHeight: "45vh",
                  WebkitOverflowScrolling: "touch",
                  overscrollBehavior: "contain",
                }}
              >
                {viewingStory.seenBy.length === 0 ? (
                  <div className="py-8 text-center">
                    <span className="text-3xl">👁</span>
                    <p className="text-sm text-muted-foreground mt-2">
                      No one has seen this yet
                    </p>
                  </div>
                ) : (
                  viewingStory.seenBy.map((viewer, i) => (
                    <div
                      key={viewer}
                      data-ocid={`stories.item.${i + 1}`}
                      className="flex items-center gap-3 py-2"
                    >
                      <div
                        className="w-9 h-9 rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0"
                        style={{
                          background: `linear-gradient(135deg, ${["oklch(0.72 0.11 355)", "oklch(0.65 0.12 268)", "oklch(0.68 0.13 220)", "oklch(0.7 0.11 145)"][i % 4]}, ${["oklch(0.62 0.10 268)", "oklch(0.55 0.11 355)", "oklch(0.58 0.12 145)", "oklch(0.6 0.13 220)"][i % 4]})`,
                        }}
                      >
                        {viewer[0].toUpperCase()}
                      </div>
                      <span className="text-sm font-semibold text-foreground">
                        {viewer}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </motion.div>
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
            className="fixed inset-0 z-50 flex items-start"
            style={{ background: "rgba(0,0,0,0.7)" }}
          >
            <motion.div
              initial={{ y: "-100%" }}
              animate={{ y: 0 }}
              exit={{ y: "-100%" }}
              transition={{ type: "spring", damping: 28, stiffness: 280 }}
              className="w-full rounded-b-3xl flex flex-col"
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

              {/* Scrollable content — iOS-friendly */}
              <div
                className="px-5 pb-6 overflow-y-auto flex flex-col gap-4"
                style={{
                  WebkitOverflowScrolling: "touch",
                  overscrollBehavior: "contain",
                }}
              >
                {/* Image Picker — uses label+input pattern for mobile reliability */}
                <label
                  htmlFor="story-file-input"
                  className="relative w-full rounded-2xl overflow-hidden cursor-pointer block"
                  style={{
                    height: 220,
                    background:
                      pickedImage || overlayText.trim()
                        ? undefined
                        : isDark
                          ? "rgba(255,255,255,0.06)"
                          : "rgba(245,240,255,0.6)",
                    border:
                      pickedImage || overlayText.trim()
                        ? "none"
                        : "2px dashed oklch(0.62 0.10 268 / 0.4)",
                  }}
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
                  ) : overlayText.trim() ? (
                    // Text-only preview with gradient background
                    <div
                      className={`w-full h-full flex items-center justify-center bg-gradient-to-br ${previewGradient} rounded-2xl`}
                    >
                      <div
                        className="inset-x-3 text-center font-black px-4"
                        style={{
                          color: textColor,
                          fontSize: fontSize,
                          textShadow: "0 2px 8px rgba(0,0,0,0.5)",
                        }}
                      >
                        {overlayText}
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center h-full gap-2">
                      <span className="text-4xl">📷</span>
                      <span className="text-sm font-semibold text-muted-foreground">
                        Tap to pick a photo
                      </span>
                    </div>
                  )}
                </label>
                <input
                  ref={fileInputRef}
                  id="story-file-input"
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

                {/* Post Button — always enabled */}
                <button
                  type="button"
                  data-ocid="stories.submit_button"
                  onClick={handlePostStory}
                  className="w-full py-3.5 rounded-2xl text-white font-black text-base"
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
