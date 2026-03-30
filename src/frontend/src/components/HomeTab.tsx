import { Skeleton } from "@/components/ui/skeleton";
import {
  AlertCircle,
  Bell,
  Heart,
  MessageCircle,
  Moon,
  RefreshCw,
  Send,
  Sun,
  Trash2,
  X,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useState } from "react";
import { useLanguage } from "../context/LanguageContext";
import { useTheme } from "../context/ThemeContext";
import {
  Category,
  useGetPostsByCategory,
  useLikePost,
} from "../hooks/useQueries";
import {
  addNotification,
  loadNotifications,
  seedSampleNotifications,
} from "../lib/notifications";
import NotificationsPanel from "./NotificationsPanel";
import StoriesBar from "./StoriesBar";

interface HomeTabProps {
  onSOS: () => void;
}

const CATEGORY_LABELS: Record<string, string> = {
  all: "All",
  [Category.relationship]: "Relationship",
  [Category.mentalHealth]: "Mental Health",
  [Category.studies]: "Studies",
  [Category.career]: "Career",
};

const CATEGORY_COLORS: Record<string, string> = {
  [Category.relationship]: "bg-pink-100 text-pink-700",
  [Category.mentalHealth]: "bg-purple-100 text-purple-700",
  [Category.studies]: "bg-blue-100 text-blue-700",
  [Category.career]: "bg-amber-100 text-amber-700",
};

const AVATAR_COLORS = [
  "from-pink-300 to-pink-400",
  "from-purple-300 to-purple-400",
  "from-blue-300 to-blue-400",
  "from-rose-300 to-rose-400",
  "from-indigo-300 to-indigo-400",
  "from-fuchsia-300 to-fuchsia-400",
];

interface Comment {
  id: string;
  name: string;
  avatar: string;
  text: string;
}

interface LocalPost {
  id: number;
  category: Category;
  title?: string;
  content: string;
  timestamp: number;
  mediaUrl?: string;
  mediaType?: "image" | "video";
  author?: string;
}

const SEED_POSTS: LocalPost[] = [
  {
    id: -1,
    author: "stargazer_ria",
    category: Category.mentalHealth,
    content:
      "Had my first therapy session today and honestly it went better than I expected 🌸 if you're on the fence about trying it, just go. You don't have to have everything figured out.",
    timestamp: Date.now() - 1000 * 60 * 18,
  },
  {
    id: -2,
    author: "chill_vibes_nikhil",
    category: Category.studies,
    content:
      "Board exams in 3 weeks and I literally can't focus 😭 every time I sit to study my brain just goes blank. anyone else going through this? how do you deal?",
    timestamp: Date.now() - 1000 * 60 * 45,
  },
  {
    id: -3,
    author: "anonymous_heart",
    category: Category.relationship,
    content:
      "Finally told my best friend how I feel about them. They said they needed time to think. Idk how to feel rn... scared but also kind of relieved? 💜",
    timestamp: Date.now() - 1000 * 60 * 72,
  },
  {
    id: -4,
    author: "morning_mochi",
    category: Category.career,
    content:
      "Got rejected from my dream internship today. It hurts but I'm trying to remind myself that one no doesn't define my whole path. Sending love to everyone else grinding 💪",
    timestamp: Date.now() - 1000 * 60 * 120,
  },
  {
    id: -5,
    author: "softclouds_meera",
    category: Category.mentalHealth,
    content:
      "Gentle reminder: rest is productive. You don't have to earn your breaks. 🌙 Take care of yourself today.",
    timestamp: Date.now() - 1000 * 60 * 180,
  },
];

function loadLocalPosts(): LocalPost[] {
  try {
    const raw = localStorage.getItem("mochi_local_posts");
    const userPosts: LocalPost[] = raw ? (JSON.parse(raw) as LocalPost[]) : [];
    // Merge seed posts that haven't been deleted
    const deletedIds = new Set<number>(
      JSON.parse(
        localStorage.getItem("mochi_deleted_post_ids") || "[]",
      ) as number[],
    );
    const visibleSeeds = SEED_POSTS.filter((p) => !deletedIds.has(p.id));
    return [...userPosts, ...visibleSeeds].sort(
      (a, b) => b.timestamp - a.timestamp,
    );
  } catch {
    return SEED_POSTS;
  }
}

function CommentModal({
  post,
  onClose,
  initialComments = [],
  onCommentAdded,
}: {
  post: { title: string; id?: number };
  onClose: () => void;
  initialComments?: Comment[];
  onCommentAdded?: (comment: Comment) => void;
}) {
  const [comments, setComments] = useState<Comment[]>(initialComments);
  const [commentText, setCommentText] = useState("");
  const myProfilePhoto = localStorage.getItem("mochi_profile_photo");

  const handleAdd = () => {
    if (!commentText.trim()) return;
    const newComment: Comment = {
      id: `c-${Date.now()}`,
      name: "You",
      avatar: "💬",
      text: commentText.trim(),
    };
    setComments((prev) => [...prev, newComment]);
    onCommentAdded?.(newComment);
    setCommentText("");
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-start"
      style={{ background: "rgba(0,0,0,0.4)", backdropFilter: "blur(4px)" }}
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, y: -30 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -30 }}
        transition={{ duration: 0.18, ease: "easeOut" }}
        onClick={(e) => e.stopPropagation()}
        data-ocid="comments.modal"
        className="w-full rounded-b-3xl p-5 max-h-[75vh] flex flex-col"
        style={{
          background: "oklch(var(--card))",
          backdropFilter: "blur(20px)",
          paddingBottom: "env(safe-area-inset-bottom, 16px)",
        }}
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-base text-foreground">Comments 💬</h3>
          <button
            type="button"
            data-ocid="comments.close_button"
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-muted transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        <p className="text-xs text-muted-foreground mb-3 font-semibold">
          {post.title}
        </p>
        <div className="flex-1 overflow-y-auto space-y-3 mb-4 min-h-[60px]">
          {comments.length === 0 ? (
            <div
              data-ocid="comments.empty_state"
              className="text-center py-6 text-muted-foreground text-sm"
            >
              No comments yet — be the first to share kindness 🌸
            </div>
          ) : (
            comments.map((c) => (
              <div key={c.id} className="flex gap-3">
                <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-base flex-shrink-0 overflow-hidden">
                  {c.name === "You" && myProfilePhoto ? (
                    <img
                      src={myProfilePhoto}
                      alt="You"
                      className="w-full h-full object-cover rounded-full"
                    />
                  ) : (
                    c.avatar
                  )}
                </div>
                <div className="flex-1 bg-muted/50 rounded-2xl rounded-tl-sm px-3 py-2">
                  <p className="text-xs font-bold text-foreground/70 mb-0.5">
                    {c.name}
                  </p>
                  <p className="text-sm text-foreground">{c.text}</p>
                </div>
              </div>
            ))
          )}
        </div>
        <div className="flex gap-2">
          <input
            type="text"
            data-ocid="comments.input"
            value={commentText}
            onChange={(e) => setCommentText(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleAdd()}
            placeholder="Add a kind comment... 💜"
            className="flex-1 bg-muted rounded-full px-4 py-2 text-sm outline-none focus:ring-2 ring-primary/30 text-foreground placeholder:text-muted-foreground"
          />
          <button
            type="button"
            data-ocid="comments.submit_button"
            onPointerDown={handleAdd}
            disabled={!commentText.trim()}
            className="w-9 h-9 rounded-full flex items-center justify-center text-white disabled:opacity-40 transition-opacity"
            style={{
              background:
                "linear-gradient(135deg, oklch(0.78 0.20 5), oklch(0.72 0.18 290))",
            }}
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

export default function HomeTab({ onSOS }: HomeTabProps) {
  const { t } = useLanguage();
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === "dark";
  const [activeCategory, setActiveCategory] = useState<Category | null>(null);
  const {
    data: backendPosts,
    isLoading,
    refetch,
  } = useGetPostsByCategory(activeCategory);
  const [localPosts, setLocalPosts] = useState<LocalPost[]>(loadLocalPosts);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [commentingPost, setCommentingPost] = useState<{
    title: string;
    id?: number;
  } | null>(null);
  const likePost = useLikePost();
  const [likedPosts, setLikedPosts] = useState<Set<string>>(new Set());
  const [likedLocalPosts, setLikedLocalPosts] = useState<Set<number>>(
    () =>
      new Set(
        JSON.parse(
          localStorage.getItem("mochi_liked_posts") || "[]",
        ) as number[],
      ),
  );
  const [localPostComments, setLocalPostComments] = useState<
    Record<number, Comment[]>
  >({});
  const [notifOpen, setNotifOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(() => {
    seedSampleNotifications();
    return loadNotifications().filter((n) => !n.read).length;
  });

  const categories = [
    { key: null, label: "All" },
    { key: Category.relationship, label: "Relationship" },
    { key: Category.mentalHealth, label: "Mental Health" },
    { key: Category.studies, label: "Studies" },
    { key: Category.career, label: "Career" },
  ];

  const localFiltered = localPosts.filter(
    (p) => !activeCategory || p.category === activeCategory,
  );

  const isBackendData = backendPosts && backendPosts.length > 0;
  const hasAnyPosts = isBackendData || localFiltered.length > 0;

  // Listen for new notifications to refresh badge
  const refreshUnread = () =>
    setUnreadCount(loadNotifications().filter((n) => !n.read).length);

  const handleDeletePost = (id: number) => {
    setDeletingId(id);
    setTimeout(() => {
      if (id < 0) {
        // Seed post — track in deleted set
        const deleted: number[] = JSON.parse(
          localStorage.getItem("mochi_deleted_post_ids") || "[]",
        );
        localStorage.setItem(
          "mochi_deleted_post_ids",
          JSON.stringify([...deleted, id]),
        );
      }
      const userPosts = localPosts.filter((p) => p.id >= 0 && p.id !== id);
      localStorage.setItem("mochi_local_posts", JSON.stringify(userPosts));
      setLocalPosts(loadLocalPosts());
      setDeletingId(null);
    }, 300);
  };

  // biome-ignore lint/correctness/useExhaustiveDependencies: mount once
  useEffect(() => {
    const handler = () => refreshUnread();
    window.addEventListener("mochi-notification", handler);
    return () => window.removeEventListener("mochi-notification", handler);
  }, []);

  return (
    <div className="flex flex-col">
      {/* Header – hero gradient tint */}
      <header
        className="flex items-center justify-between px-4 pt-12 pb-3 sticky top-0 z-10"
        style={{
          background: isDark
            ? "linear-gradient(135deg, oklch(0.13 0.055 285 / 0.96), oklch(0.12 0.05 300 / 0.96))"
            : "linear-gradient(135deg, oklch(0.98 0.018 5 / 0.94), oklch(0.975 0.020 290 / 0.94))",
          backdropFilter: "blur(20px)",
          WebkitBackdropFilter: "blur(20px)",
          borderBottom: isDark
            ? "1px solid oklch(0.78 0.20 5 / 0.10)"
            : "1px solid oklch(0.90 0.025 285 / 0.7)",
        }}
      >
        <div className="flex items-center gap-2">
          <img
            src="/assets/generated/mochi-mascot-transparent.dim_400x400.png"
            alt="Mochi"
            className="w-8 h-8 object-contain"
          />
          <span
            className="text-xl font-black"
            style={{
              background:
                "linear-gradient(135deg, oklch(0.78 0.20 5), oklch(0.72 0.18 290))",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
            }}
          >
            mochi
          </span>
        </div>
        <button
          type="button"
          data-ocid="sos.button"
          onClick={onSOS}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-white text-xs font-bold shadow-md transition-transform active:scale-95"
          style={{ background: "oklch(0.59 0.19 25)" }}
        >
          <AlertCircle className="w-3.5 h-3.5" />
          SOS
        </button>
        {/* Notifications bell */}
        <button
          type="button"
          data-ocid="notifications.open_modal_button"
          onClick={() => {
            setNotifOpen(true);
          }}
          className="relative w-8 h-8 rounded-full flex items-center justify-center transition-all duration-200"
          style={{
            background: isDark
              ? "oklch(0.22 0.06 285 / 0.8)"
              : "oklch(0.92 0.04 15 / 0.8)",
            border: isDark
              ? "1px solid oklch(0.78 0.20 5 / 0.20)"
              : "1px solid oklch(0.90 0.025 285 / 0.5)",
          }}
          aria-label="Notifications"
        >
          <Bell className="w-4 h-4 text-muted-foreground" />
          {unreadCount > 0 && (
            <span
              className="absolute -top-1 -right-1 w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-black text-white"
              style={{ background: "oklch(0.59 0.19 25)" }}
            >
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </button>
        <button
          type="button"
          data-ocid="home.theme.toggle"
          onClick={toggleTheme}
          className="w-8 h-8 rounded-full flex items-center justify-center transition-all duration-200"
          style={{
            background: isDark
              ? "oklch(0.22 0.06 285 / 0.8)"
              : "oklch(0.92 0.04 15 / 0.8)",
            border: isDark
              ? "1px solid oklch(0.78 0.20 5 / 0.20)"
              : "1px solid oklch(0.90 0.025 285 / 0.5)",
          }}
          aria-label="Toggle theme"
        >
          {isDark ? (
            <Sun className="w-4 h-4 text-amber-400" />
          ) : (
            <Moon className="w-4 h-4 text-muted-foreground" />
          )}
        </button>
      </header>

      {/* Stories Section */}
      <div className="pt-3 pb-1">
        <div className="px-4 mb-2 flex items-center justify-between">
          <span className="text-xs font-bold text-muted-foreground uppercase tracking-wide">
            Stories
          </span>
        </div>
        <StoriesBar />
      </div>

      {/* Hero Banner */}
      <div
        className="mx-4 mb-4 mt-2 rounded-3xl p-5 relative overflow-hidden"
        style={{
          background: "var(--gradient-hero)",
          boxShadow: "var(--shadow-card)",
        }}
      >
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <h1 className="text-lg font-black text-foreground leading-tight">
              {t("tagline")}
            </h1>
            <p className="text-sm text-foreground/70 mt-1">
              You're safe here. Always. 💜
            </p>
          </div>
          <img
            src="/assets/generated/mochi-mascot-transparent.dim_400x400.png"
            alt="Mochi mascot"
            className="w-20 h-20 object-contain animate-float"
          />
        </div>
      </div>

      {/* Category filters */}
      <div className="flex gap-2 px-4 pb-3 overflow-x-auto no-scrollbar">
        {categories.map((cat) => (
          <button
            type="button"
            key={cat.label}
            data-ocid="home.filter.tab"
            onClick={() => setActiveCategory(cat.key)}
            className={`flex-shrink-0 px-3.5 py-1.5 rounded-full text-xs font-bold transition-all duration-200 ${
              activeCategory === cat.key
                ? "text-white shadow-pink"
                : "text-muted-foreground border border-border hover:border-primary/40"
            }`}
            style={
              activeCategory === cat.key
                ? {
                    background:
                      "linear-gradient(135deg, oklch(0.78 0.20 5), oklch(0.72 0.18 290))",
                  }
                : {
                    background: isDark
                      ? "oklch(0.14 0.05 285 / 0.80)"
                      : "oklch(0.995 0.004 80 / 0.80)",
                    backdropFilter: "blur(8px)",
                  }
            }
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* Posts header */}
      <div className="flex items-center justify-between px-4 mb-2">
        <h2 className="font-bold text-sm text-foreground">Recent Shares</h2>
        <button
          type="button"
          data-ocid="home.secondary_button"
          onClick={() => refetch()}
          className="flex items-center gap-1 text-xs text-muted-foreground hover:text-primary transition-colors"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          Refresh
        </button>
      </div>

      {isLoading ? (
        <div className="px-4 space-y-3" data-ocid="home.loading_state">
          {[1, 2, 3].map((i) => (
            <div key={i} className="card-elevated rounded-2xl p-4">
              <div className="flex gap-3">
                <Skeleton className="w-10 h-10 rounded-full shimmer" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-3 w-24 shimmer" />
                  <Skeleton className="h-3 w-16 shimmer" />
                </div>
              </div>
              <Skeleton className="h-4 w-3/4 mt-3 shimmer" />
              <Skeleton className="h-12 w-full mt-2 shimmer" />
            </div>
          ))}
        </div>
      ) : !hasAnyPosts ? (
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          data-ocid="home.posts.empty_state"
          className="mx-4 mb-4 card-elevated rounded-3xl p-8 flex flex-col items-center text-center"
        >
          <img
            src="/assets/generated/mochi-mascot-transparent.dim_400x400.png"
            alt="Mochi"
            className="w-24 h-24 object-contain mb-4 animate-float"
          />
          <h3 className="font-black text-base text-foreground mb-2">
            No posts yet 🌸
          </h3>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Be the first to share your thoughts!
            <br />
            Your community is waiting 💜
          </p>
        </motion.div>
      ) : (
        <AnimatePresence mode="popLayout">
          {isBackendData
            ? backendPosts.map((post, i) => {
                const postKey = `${post.title}-${i}`;
                const liked = likedPosts.has(postKey);
                return (
                  <motion.div
                    key={postKey}
                    data-ocid={`post.item.${i + 1}`}
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.06 }}
                    className="card-elevated rounded-2xl p-4 mx-4 mb-3"
                  >
                    <div className="flex items-start gap-3">
                      <div
                        className={`w-10 h-10 rounded-full bg-gradient-to-br ${AVATAR_COLORS[i % AVATAR_COLORS.length]} flex items-center justify-center text-white font-bold text-sm flex-shrink-0`}
                      >
                        {post.author.toString().slice(0, 2).toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <span className="font-bold text-sm text-foreground">
                          Anonymous
                        </span>
                        <span
                          className={`ml-2 text-xs px-2 py-0.5 rounded-full font-semibold ${
                            CATEGORY_COLORS[post.category] ??
                            "bg-gray-100 text-gray-700"
                          }`}
                        >
                          {CATEGORY_LABELS[post.category]}
                        </span>
                      </div>
                    </div>
                    <h3 className="font-bold text-sm mt-3 text-foreground">
                      {post.title}
                    </h3>
                    <p className="text-sm text-foreground/80 mt-1 leading-relaxed line-clamp-3">
                      {post.content}
                    </p>
                    <div className="flex items-center gap-4 mt-3 pt-3 border-t border-border/50">
                      <button
                        type="button"
                        data-ocid={`post.item.${i + 1}.toggle`}
                        onClick={() => {
                          setLikedPosts((s) => {
                            const next = new Set(s);
                            if (next.has(postKey)) {
                              next.delete(postKey);
                            } else {
                              next.add(postKey);
                              likePost.mutate(BigInt(i));
                            }
                            return next;
                          });
                        }}
                        className={`flex items-center gap-1.5 text-sm font-semibold transition-all ${
                          liked
                            ? "text-primary"
                            : "text-muted-foreground hover:text-primary"
                        }`}
                      >
                        <Heart
                          className={`w-4 h-4 transition-transform ${liked ? "fill-current scale-110" : ""}`}
                        />
                        {Number(post.likes) + (liked ? 1 : 0)}
                      </button>
                      <button
                        type="button"
                        data-ocid={`post.item.${i + 1}.secondary_button`}
                        onPointerDown={() =>
                          setCommentingPost({ title: post.title })
                        }
                        className="flex items-center gap-1.5 text-sm font-semibold text-muted-foreground hover:text-secondary transition-colors"
                      >
                        <MessageCircle className="w-4 h-4" />
                        {post.comments.length}
                      </button>
                    </div>
                  </motion.div>
                );
              })
            : localFiltered.map((post, i) => (
                <AnimatePresence key={`local-${post.id}`}>
                  {deletingId !== post.id && (
                    <motion.div
                      data-ocid={`post.item.${i + 1}`}
                      initial={{ opacity: 0, y: 16 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      transition={{ delay: i * 0.04 }}
                      className="card-elevated rounded-2xl p-4 mx-4 mb-3 relative group"
                    >
                      <div className="flex items-start gap-3">
                        {(() => {
                          const photo = localStorage.getItem(
                            "mochi_profile_photo",
                          );
                          return photo ? (
                            <img
                              src={photo}
                              alt="You"
                              className="w-10 h-10 rounded-full object-cover flex-shrink-0"
                            />
                          ) : (
                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-pink-300 to-purple-300 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                              Me
                            </div>
                          );
                        })()}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-bold text-sm text-foreground">
                              {post.id > 0 ? "You" : post.author}
                            </span>
                            <span
                              className={`text-xs px-2 py-0.5 rounded-full font-semibold ${
                                CATEGORY_COLORS[post.category] ??
                                "bg-gray-100 text-gray-700"
                              }`}
                            >
                              {CATEGORY_LABELS[post.category]}
                            </span>
                            <span className="text-xs text-muted-foreground">
                              {post.id > 0
                                ? "just now"
                                : (() => {
                                    const mins = Math.floor(
                                      (Date.now() - post.timestamp) / 60000,
                                    );
                                    return mins < 60
                                      ? `${mins}m ago`
                                      : `${Math.floor(mins / 60)}h ago`;
                                  })()}
                            </span>
                          </div>
                        </div>
                        {post.id > 0 && (
                          <button
                            type="button"
                            data-ocid={`post.delete_button.${i + 1}`}
                            onClick={() => handleDeletePost(post.id)}
                            className="opacity-0 group-hover:opacity-100 p-1.5 rounded-full text-rose-400 hover:bg-rose-50 hover:text-rose-600 transition-all duration-200 active:scale-90"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                      {post.mediaUrl && post.mediaType === "image" && (
                        <img
                          src={post.mediaUrl}
                          alt="post media"
                          className="w-full rounded-xl mt-3 object-cover max-h-48"
                        />
                      )}
                      {post.mediaUrl && post.mediaType === "video" && (
                        <video
                          src={post.mediaUrl}
                          controls
                          className="w-full rounded-xl mt-3 max-h-48"
                        >
                          <track kind="captions" />
                        </video>
                      )}
                      {post.title && (
                        <h3 className="font-bold text-sm mt-3 text-foreground">
                          {post.title}
                        </h3>
                      )}
                      {post.content && (
                        <p className="text-sm text-foreground/80 mt-1 leading-relaxed line-clamp-3">
                          {post.content}
                        </p>
                      )}
                      <div className="flex items-center gap-4 mt-3 pt-3 border-t border-border/50">
                        <button
                          type="button"
                          data-ocid={`post.item.${i + 1}.toggle`}
                          onClick={() => {
                            const next = new Set(likedLocalPosts);
                            if (next.has(post.id)) {
                              next.delete(post.id);
                            } else {
                              next.add(post.id);
                              addNotification({
                                type: "like",
                                text: "You liked a post ❤️",
                              });
                            }
                            setLikedLocalPosts(next);
                            localStorage.setItem(
                              "mochi_liked_posts",
                              JSON.stringify([...next]),
                            );
                          }}
                          className={`flex items-center gap-1.5 text-sm font-semibold transition-all ${likedLocalPosts.has(post.id) ? "text-primary" : "text-muted-foreground hover:text-primary"}`}
                        >
                          <Heart
                            className={`w-4 h-4 transition-transform ${likedLocalPosts.has(post.id) ? "fill-current scale-110" : ""}`}
                          />
                          {likedLocalPosts.has(post.id) ? 1 : 0}
                        </button>
                        <button
                          type="button"
                          data-ocid={`post.item.${i + 1}.secondary_button`}
                          onPointerDown={() =>
                            setCommentingPost({
                              title: post.title || "Post",
                              id: post.id,
                            })
                          }
                          className="flex items-center gap-1.5 text-sm font-semibold text-muted-foreground hover:text-secondary transition-colors"
                        >
                          <MessageCircle className="w-4 h-4" />
                          {(localPostComments[post.id] ?? []).length}
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              ))}
        </AnimatePresence>
      )}

      <AnimatePresence>
        {commentingPost && (
          <CommentModal
            post={commentingPost}
            onClose={() => setCommentingPost(null)}
            initialComments={
              commentingPost.id != null
                ? (localPostComments[commentingPost.id] ?? [])
                : []
            }
            onCommentAdded={(c) => {
              if (commentingPost.id != null) {
                setLocalPostComments((prev) => ({
                  ...prev,
                  [commentingPost.id!]: [
                    ...(prev[commentingPost.id!] ?? []),
                    c,
                  ],
                }));
                addNotification({
                  type: "comment",
                  text: "You commented on a post 💬",
                });
              }
            }}
          />
        )}
      </AnimatePresence>

      <NotificationsPanel
        open={notifOpen}
        onClose={() => {
          setNotifOpen(false);
          refreshUnread();
        }}
      />

      <div className="text-center py-6 text-xs text-muted-foreground px-4">
        <span className="opacity-60">Everyone here cares. You matter. 💜</span>
        <div className="mt-2">
          &copy; {new Date().getFullYear()}. Built with{" "}
          <span className="text-primary">&hearts;</span> using{" "}
          <a
            href={`https://caffeine.ai?utm_source=caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(typeof window !== "undefined" ? window.location.hostname : "")}`}
            target="_blank"
            rel="noreferrer"
            className="text-secondary hover:underline"
          >
            caffeine.ai
          </a>
        </div>
      </div>
    </div>
  );
}
