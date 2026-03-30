import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, Image, Loader2, Lock, Video, X } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useRef, useState } from "react";
import { toast } from "sonner";
import { Category, useCreatePost } from "../hooks/useQueries";

const CATEGORIES = [
  { id: Category.relationship, label: "Relationship", emoji: "💕" },
  { id: Category.mentalHealth, label: "Mental Health", emoji: "🌸" },
  { id: Category.studies, label: "Studies", emoji: "📚" },
  { id: Category.career, label: "Career", emoji: "💼" },
];

type PostMode = null | "write" | "photo" | "reel";

interface PostTabProps {
  onClose: () => void;
}

function saveLocalPost(post: {
  id: number;
  category: Category;
  title: string;
  content: string;
  timestamp: number;
  mediaUrl?: string;
  mediaType?: "image" | "video";
}) {
  try {
    const existing = JSON.parse(
      localStorage.getItem("mochi_local_posts") ?? "[]",
    );
    existing.push(post);
    localStorage.setItem("mochi_local_posts", JSON.stringify(existing));
  } catch {}
}

function awardPoints(pts = 10) {
  try {
    const current = Number(localStorage.getItem("mochi_local_points") ?? "0");
    localStorage.setItem("mochi_local_points", String(current + pts));
  } catch {}
}

export default function PostTab({ onClose }: PostTabProps) {
  const [mode, setMode] = useState<PostMode>(null);
  const [category, setCategory] = useState<Category>(Category.mentalHealth);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [mediaFile, setMediaFile] = useState<File | null>(null);
  const [mediaUrl, setMediaUrl] = useState<string | null>(null);
  const [caption, setCaption] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const createPost = useCreatePost();

  const handleBack = () => {
    setMode(null);
    setMediaFile(null);
    setMediaUrl(null);
    setCaption("");
    setTitle("");
    setContent("");
  };

  const handlePickFile = (accept: string) => {
    if (!fileInputRef.current) return;
    fileInputRef.current.accept = accept;
    fileInputRef.current.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setMediaFile(file);
    setMediaUrl(URL.createObjectURL(file));
    e.target.value = "";
  };

  const handleWriteSubmit = () => {
    if (!title.trim() || !content.trim()) {
      toast.error("Please fill in both title and content");
      return;
    }
    const localPost = {
      id: Date.now(),
      category,
      title: title.trim(),
      content: content.trim(),
      timestamp: Date.now(),
    };
    createPost.mutate(
      { category, title: title.trim(), content: content.trim() },
      {
        onSuccess: () => {
          awardPoints(10);
          toast.success("Post shared! +10 points 🎉");
          onClose();
        },
        onError: () => {
          saveLocalPost(localPost);
          awardPoints(10);
          toast.success("Post shared! +10 points 🎉");
          onClose();
        },
      },
    );
  };

  const handleMediaShare = (isReel = false) => {
    if (!mediaUrl && !caption.trim()) {
      toast.error("Please pick a file or add a caption");
      return;
    }
    const isVideo = mediaFile?.type.startsWith("video/");
    saveLocalPost({
      id: Date.now(),
      category: Category.mentalHealth,
      title: caption.trim() || (isReel ? "Reel 🎬" : "Photo 📸"),
      content: "",
      timestamp: Date.now(),
      mediaUrl: mediaUrl ?? undefined,
      mediaType: mediaUrl ? (isVideo ? "video" : "image") : undefined,
    });
    awardPoints(5);
    toast.success(isReel ? "Reel shared! 🎬" : "Shared! +5 points 🎉");
    onClose();
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: "100%" }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: "100%" }}
      transition={{ type: "spring", damping: 26, stiffness: 300 }}
      className="absolute inset-0 bg-background z-50 flex flex-col"
    >
      {/* Header */}
      <header className="flex items-center justify-between px-4 pt-12 pb-4 border-b border-border">
        <button
          type="button"
          data-ocid="post.close_button"
          onClick={mode ? handleBack : onClose}
          className="p-2 rounded-full hover:bg-muted transition-colors"
        >
          {mode ? <ArrowLeft className="w-5 h-5" /> : <X className="w-5 h-5" />}
        </button>
        <h1 className="font-bold text-base text-foreground">
          {mode === "write"
            ? "Write Post"
            : mode === "photo"
              ? "Photo / Video"
              : mode === "reel"
                ? "Share a Reel"
                : "Create"}
        </h1>
        <div className="w-9" />
      </header>

      <div className="flex-1 overflow-y-auto px-4 py-5">
        <AnimatePresence mode="wait">
          {!mode && (
            <motion.div
              key="picker"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className="space-y-3"
            >
              <p className="text-sm text-muted-foreground text-center mb-6">
                What do you want to share today? 🌸
              </p>
              {[
                {
                  id: "write" as const,
                  emoji: "✏️",
                  title: "Write Post",
                  desc: "Share your thoughts anonymously",
                },
                {
                  id: "photo" as const,
                  emoji: "📷",
                  title: "Photo / Video",
                  desc: "Share a moment from your day",
                },
                {
                  id: "reel" as const,
                  emoji: "🎬",
                  title: "Reel",
                  desc: "Short funny clip",
                },
              ].map((item) => (
                <motion.button
                  key={item.id}
                  type="button"
                  data-ocid={`post.${item.id}.button`}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => setMode(item.id)}
                  className="w-full flex items-center gap-4 p-4 rounded-2xl border-2 border-border text-left transition-all hover:border-primary/40"
                  style={{
                    background:
                      "linear-gradient(135deg, rgba(255,255,255,0.9), rgba(245,240,255,0.7))",
                    boxShadow: "0 2px 12px rgba(139,143,202,0.08)",
                  }}
                >
                  <span className="text-4xl">{item.emoji}</span>
                  <div>
                    <p className="font-bold text-sm text-foreground">
                      {item.title}
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {item.desc}
                    </p>
                  </div>
                </motion.button>
              ))}
            </motion.div>
          )}

          {mode === "write" && (
            <motion.div
              key="write"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className="space-y-5"
            >
              <div className="flex items-center gap-2 bg-muted rounded-2xl p-3">
                <Lock className="w-4 h-4 text-secondary flex-shrink-0" />
                <p className="text-xs text-muted-foreground font-semibold">
                  Your post will be shared anonymously. Your identity is safe.
                  💜
                </p>
              </div>
              <div>
                <p className="text-sm font-bold text-foreground mb-2">
                  Category
                </p>
                <div className="flex flex-wrap gap-2">
                  {CATEGORIES.map((cat) => (
                    <button
                      type="button"
                      key={cat.id}
                      data-ocid="post.select"
                      onClick={() => setCategory(cat.id)}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-semibold transition-all duration-200 border ${
                        category === cat.id
                          ? "text-white border-transparent shadow-pink"
                          : "bg-card text-muted-foreground border-border hover:border-primary/40"
                      }`}
                      style={
                        category === cat.id
                          ? {
                              background:
                                "linear-gradient(135deg, oklch(0.72 0.11 355), oklch(0.62 0.10 268))",
                            }
                          : {}
                      }
                    >
                      <span>{cat.emoji}</span>
                      {cat.label}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <p className="text-sm font-bold text-foreground mb-2">Title</p>
                <Input
                  id="post-title"
                  data-ocid="post.title.input"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Give your post a title..."
                  className="rounded-xl text-sm font-medium"
                  maxLength={100}
                />
              </div>
              <div>
                <p className="text-sm font-bold text-foreground mb-2">
                  Your story
                </p>
                <Textarea
                  id="post-content"
                  data-ocid="post.textarea"
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="How are you feeling? Share as much or as little as you'd like..."
                  className="rounded-xl text-sm font-medium min-h-[160px] resize-none"
                  maxLength={1000}
                />
                <p className="text-right text-xs text-muted-foreground mt-1">
                  {content.length}/1000
                </p>
              </div>
              <div className="bg-card rounded-2xl p-4 border border-border">
                <p className="text-xs font-bold text-foreground mb-2">
                  How are you feeling right now?
                </p>
                <div className="flex justify-around">
                  {["😢", "😟", "😐", "🙂", "😄"].map((emoji) => (
                    <button
                      type="button"
                      key={emoji}
                      className="text-2xl hover:scale-125 transition-transform duration-200"
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              </div>
              <button
                type="button"
                data-ocid="post.submit_button"
                onClick={handleWriteSubmit}
                disabled={
                  createPost.isPending || !title.trim() || !content.trim()
                }
                className="w-full py-3.5 rounded-2xl text-white font-bold text-sm disabled:opacity-50 transition-all active:scale-[0.98] flex items-center justify-center gap-2"
                style={{
                  background:
                    "linear-gradient(135deg, oklch(0.72 0.11 355), oklch(0.62 0.10 268))",
                }}
              >
                {createPost.isPending ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  "Post ✨"
                )}
              </button>
            </motion.div>
          )}

          {(mode === "photo" || mode === "reel") && (
            <motion.div
              key={mode}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className="space-y-4"
            >
              <input
                ref={fileInputRef}
                type="file"
                className="hidden"
                onChange={handleFileChange}
              />
              {!mediaUrl ? (
                <button
                  type="button"
                  data-ocid="post.upload_button"
                  onClick={() =>
                    handlePickFile(
                      mode === "reel" ? "video/*" : "image/*,video/*",
                    )
                  }
                  className="w-full h-48 rounded-2xl border-2 border-dashed border-primary/30 flex flex-col items-center justify-center gap-3 transition-all hover:border-primary/60 active:scale-[0.98]"
                  style={{ background: "rgba(245,240,255,0.5)" }}
                >
                  {mode === "reel" ? (
                    <Video className="w-10 h-10 text-primary/50" />
                  ) : (
                    <Image className="w-10 h-10 text-primary/50" />
                  )}
                  <p className="text-sm font-semibold text-muted-foreground">
                    Tap to pick {mode === "reel" ? "a video" : "photo or video"}
                  </p>
                </button>
              ) : (
                <div className="relative rounded-2xl overflow-hidden">
                  {mediaFile?.type.startsWith("video/") ? (
                    <video
                      src={mediaUrl}
                      controls
                      className="w-full max-h-64 rounded-2xl"
                    >
                      <track kind="captions" />
                    </video>
                  ) : (
                    <img
                      src={mediaUrl}
                      alt="preview"
                      className="w-full max-h-64 object-cover rounded-2xl"
                    />
                  )}
                  <button
                    type="button"
                    onClick={() => {
                      setMediaFile(null);
                      setMediaUrl(null);
                    }}
                    className="absolute top-2 right-2 w-8 h-8 rounded-full bg-black/60 flex items-center justify-center"
                  >
                    <X className="w-4 h-4 text-white" />
                  </button>
                </div>
              )}
              <div>
                <p className="text-sm font-bold text-foreground mb-2">
                  Caption (optional)
                </p>
                <Textarea
                  id="media-caption"
                  data-ocid="post.textarea"
                  value={caption}
                  onChange={(e) => setCaption(e.target.value)}
                  placeholder={
                    mode === "reel"
                      ? "Describe your reel... 🎬"
                      : "Add a caption... 📸"
                  }
                  className="rounded-xl text-sm font-medium min-h-[80px] resize-none"
                  maxLength={500}
                />
              </div>
              <button
                type="button"
                data-ocid="post.submit_button"
                onClick={() => handleMediaShare(mode === "reel")}
                disabled={!mediaUrl && !caption.trim()}
                className="w-full py-3.5 rounded-2xl text-white font-bold text-sm disabled:opacity-50 transition-all active:scale-[0.98]"
                style={{
                  background:
                    "linear-gradient(135deg, oklch(0.72 0.11 355), oklch(0.62 0.10 268))",
                }}
              >
                {mode === "reel" ? "Share Reel 🎬" : "Share 🌸"}
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}
