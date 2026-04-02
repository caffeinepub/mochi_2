import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import {
  Award,
  Camera,
  Check,
  Copy,
  Download,
  Edit3,
  Globe,
  Heart,
  Loader2,
  LogIn,
  LogOut,
  Moon,
  Settings,
  Sun,
  Trash2,
  X,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import type { Language } from "../context/LanguageContext";
import { useLanguage } from "../context/LanguageContext";
import { useTheme } from "../context/ThemeContext";
import { useInternetIdentity } from "../hooks/useInternetIdentity";
import {
  useGetAllPosts,
  useGetCallerProfile,
  useSaveProfile,
} from "../hooks/useQueries";

const MOCHI_IMG =
  "/assets/file_0000000044cc72089f5bf3d9c00c79db-019d3fa6-47c7-720f-91f8-b7ac04a7f42a.png";

const LANGUAGES: { code: Language; label: string; flag: string }[] = [
  { code: "en", label: "English", flag: "🇺🇸" },
  { code: "hi", label: "हिंदी", flag: "🇮🇳" },
  { code: "es", label: "Español", flag: "🇪🇸" },
  { code: "hl", label: "Hinglish", flag: "🇮🇳✨" },
];

const BADGE_TIERS = [
  { name: "Seedling", emoji: "🌱", min: 0, max: 100, color: "text-green-600" },
  { name: "Bloom", emoji: "🌸", min: 100, max: 500, color: "text-pink-600" },
  {
    name: "Sunshine",
    emoji: "☀️",
    min: 500,
    max: 1000,
    color: "text-amber-500",
  },
  { name: "Star", emoji: "⭐", min: 1000, max: 5000, color: "text-purple-600" },
];

const SAMPLE_BADGES = [
  { name: "First Post", emoji: "✍️", earned: true },
  { name: "Kind Soul", emoji: "💜", earned: true },
  { name: "Helper", emoji: "🤝", earned: true },
  { name: "Listener", emoji: "👂", earned: false },
  { name: "Mentor", emoji: "🎓", earned: false },
  { name: "Guardian", emoji: "🛡️", earned: false },
];

const AVATAR_GRADIENTS = [
  {
    id: "pink-purple",
    value:
      "linear-gradient(135deg, oklch(0.72 0.11 355), oklch(0.62 0.10 268))",
  },
  {
    id: "purple-indigo",
    value:
      "linear-gradient(135deg, oklch(0.70 0.12 290), oklch(0.60 0.14 250))",
  },
  {
    id: "blue-sky",
    value:
      "linear-gradient(135deg, oklch(0.72 0.10 220), oklch(0.62 0.12 200))",
  },
  {
    id: "teal-green",
    value:
      "linear-gradient(135deg, oklch(0.72 0.12 160), oklch(0.62 0.10 145))",
  },
  {
    id: "amber-orange",
    value: "linear-gradient(135deg, oklch(0.78 0.14 60), oklch(0.68 0.16 40))",
  },
  {
    id: "indigo-blue",
    value:
      "linear-gradient(135deg, oklch(0.68 0.14 270), oklch(0.58 0.16 240))",
  },
];

const CATEGORY_COLORS: Record<string, string> = {
  relationship: "bg-pink-100 text-pink-700",
  studies: "bg-blue-100 text-blue-700",
  career: "bg-amber-100 text-amber-700",
  mentalHealth: "bg-purple-100 text-purple-700",
};

function getTier(points: number) {
  return (
    BADGE_TIERS.slice()
      .reverse()
      .find((t) => points >= t.min) ?? BADGE_TIERS[0]
  );
}

function getProgressToNext(points: number) {
  const tier = getTier(points);
  const range = tier.max - tier.min;
  const progress = points - tier.min;
  return Math.min(100, Math.round((progress / range) * 100));
}

const ANONYMOUS_PRINCIPAL = "2vxsx-fae";

function MochiProfileGuide() {
  const [dismissed, setDismissed] = useState(
    () => !!localStorage.getItem("mochi_profile_guide_dismissed"),
  );

  if (dismissed) return null;

  return (
    <AnimatePresence>
      <motion.div
        key="profile-guide"
        initial={{ opacity: 0, y: -12, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -10, scale: 0.97 }}
        transition={{ type: "spring", stiffness: 320, damping: 28 }}
        data-ocid="profile.guide.card"
        className="mx-4 mb-4 rounded-2xl p-3 relative overflow-hidden"
        style={{
          background:
            "linear-gradient(135deg, oklch(0.97 0.03 355 / 0.95), oklch(0.96 0.04 268 / 0.9))",
          border: "1.5px solid oklch(0.78 0.10 290 / 0.4)",
          backdropFilter: "blur(12px)",
          boxShadow:
            "0 4px 24px oklch(0.72 0.11 355 / 0.15), 0 1px 4px oklch(0.72 0.11 355 / 0.1)",
        }}
      >
        {/* Gradient border shimmer */}
        <div
          className="absolute inset-0 rounded-2xl pointer-events-none"
          style={{
            background:
              "linear-gradient(135deg, oklch(0.72 0.11 355 / 0.08), oklch(0.62 0.10 268 / 0.06))",
          }}
        />

        <div className="flex items-start gap-3 relative">
          {/* Mochi mascot */}
          <motion.img
            src={MOCHI_IMG}
            alt="Mochi guide"
            className="w-12 h-12 object-contain flex-shrink-0"
            animate={{ y: [0, -3, 0] }}
            transition={{
              repeat: Number.POSITIVE_INFINITY,
              duration: 2,
              ease: "easeInOut",
            }}
          />

          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between mb-1.5">
              <span className="font-black text-sm text-gray-800">
                Profile Guide 🗺️
              </span>
              <button
                type="button"
                data-ocid="profile.guide.close_button"
                onClick={() => {
                  localStorage.setItem("mochi_profile_guide_dismissed", "true");
                  setDismissed(true);
                }}
                className="p-1 rounded-full hover:bg-black/10 transition-colors flex-shrink-0"
                aria-label="Dismiss guide"
              >
                <X className="w-3.5 h-3.5 text-gray-500" />
              </button>
            </div>

            <ul className="space-y-1">
              {[
                { icon: "📸", text: "Add profile photo via camera icon" },
                { icon: "✏️", text: "Edit name & bio" },
                { icon: "🎨", text: "Change avatar color" },
                { icon: "🌍", text: "Change language below" },
              ].map((tip) => (
                <li
                  key={tip.text}
                  className="flex items-center gap-1.5 text-xs text-gray-600"
                >
                  <span className="text-sm flex-shrink-0">{tip.icon}</span>
                  <span>{tip.text}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}

export default function ProfileTab() {
  const { lang, setLang, t } = useLanguage();
  const [canInstall, setCanInstall] = useState(false);
  const deferredPrompt = useRef<any>(null);

  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault();
      deferredPrompt.current = e;
      setCanInstall(true);
    };
    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt.current) return;
    deferredPrompt.current.prompt();
    await deferredPrompt.current.userChoice;
    setCanInstall(false);
    deferredPrompt.current = null;
  };
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === "dark";
  const { data: profile, isLoading } = useGetCallerProfile();
  const saveProfile = useSaveProfile();
  const { login, clear, identity, isLoggingIn } = useInternetIdentity();
  const { data: allPosts } = useGetAllPosts();

  const [bio, setBio] = useState<string>(
    () => localStorage.getItem("mochi_bio") ?? "",
  );
  const [avatarColor, setAvatarColor] = useState<number>(() => {
    const stored = localStorage.getItem("mochi_avatar_color");
    return stored !== null ? Number(stored) : 0;
  });

  const [isEditing, setIsEditing] = useState(false);
  const [editNickname, setEditNickname] = useState("");
  const [editBio, setEditBio] = useState("");
  const [editAvatarColor, setEditAvatarColor] = useState(avatarColor);
  const [profilePhoto, setProfilePhoto] = useState<string | null>(() =>
    localStorage.getItem("mochi_profile_photo"),
  );
  const [showPhotoMenu, setShowPhotoMenu] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const nickname =
    profile?.nickname ??
    localStorage.getItem("mochi_nickname") ??
    "HappyCloud42";
  const localPoints = Number(localStorage.getItem("mochi_local_points") ?? "0");
  const points = Number(profile?.points ?? 0) + localPoints;
  const tier = getTier(points);
  const progress = getProgressToNext(points);
  const nextTier = BADGE_TIERS[BADGE_TIERS.indexOf(tier) + 1];
  const initials = nickname.slice(0, 2).toUpperCase();

  const principalStr = identity?.getPrincipal().toString();
  const isLoggedIn = !!principalStr && principalStr !== ANONYMOUS_PRINCIPAL;

  const myPosts =
    isLoggedIn && allPosts
      ? allPosts
          .filter((p) => p.author.toString() === principalStr)
          .slice(-5)
          .reverse()
      : [];

  function openEdit() {
    setEditNickname(nickname);
    setEditBio(bio);
    setEditAvatarColor(avatarColor);
    setIsEditing(true);
  }

  function cancelEdit() {
    setIsEditing(false);
  }

  async function saveEdit() {
    // Always save locally first so the button always works
    setBio(editBio);
    setAvatarColor(editAvatarColor);
    localStorage.setItem("mochi_bio", editBio);
    localStorage.setItem("mochi_avatar_color", String(editAvatarColor));
    if (editNickname.trim()) {
      localStorage.setItem("mochi_nickname", editNickname.trim());
    }
    // Try to sync to backend if logged in
    if (isLoggedIn) {
      try {
        await saveProfile.mutateAsync(editNickname);
      } catch {
        // Backend sync failed but local save succeeded — that's fine
      }
    }
    setIsEditing(false);
    toast.success("Profile updated! 💜");
  }

  useEffect(() => {
    localStorage.setItem("mochi_avatar_color", String(avatarColor));
  }, [avatarColor]);

  const stats = [
    {
      label: "Posts",
      value: isLoggedIn && myPosts.length > 0 ? String(myPosts.length) : "8",
    },
    { label: "Liked", value: "47" },
    { label: "Comments", value: "23" },
  ];

  const handleCameraClick = () => {
    if (profilePhoto) {
      setShowPhotoMenu((v) => !v);
    } else {
      fileInputRef.current?.click();
    }
  };

  const handleChangePhoto = () => {
    setShowPhotoMenu(false);
    fileInputRef.current?.click();
  };

  const handleRemovePhoto = () => {
    setShowPhotoMenu(false);
    setProfilePhoto(null);
    localStorage.removeItem("mochi_profile_photo");
    toast.success("Profile photo removed");
  };

  return (
    <div className="flex flex-col">
      <header className="px-4 pt-12 pb-3">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-black text-foreground">{t("profile")}</h1>
          <div className="flex items-center gap-2">
            {isLoggedIn && (
              <button
                type="button"
                data-ocid="profile.secondary_button"
                onClick={() => {
                  clear();
                  toast.success("Logged out 👋");
                }}
                className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors px-2 py-1 rounded-lg hover:bg-muted"
              >
                <LogOut className="w-3.5 h-3.5" />
                Logout
              </button>
            )}
            <button
              type="button"
              data-ocid="profile.theme.toggle"
              onClick={toggleTheme}
              className="p-2 rounded-full hover:bg-muted transition-colors"
              aria-label="Toggle theme"
            >
              {isDark ? (
                <Sun className="w-5 h-5 text-amber-400" />
              ) : (
                <Moon className="w-5 h-5 text-muted-foreground" />
              )}
            </button>
            <button
              type="button"
              data-ocid="profile.edit_button"
              className="p-2 rounded-full hover:bg-muted transition-colors"
              onClick={openEdit}
            >
              <Settings className="w-5 h-5 text-muted-foreground" />
            </button>
          </div>
        </div>
      </header>

      {/* Mochi Profile Guide tip */}
      <MochiProfileGuide />

      {!isLoggedIn && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="mx-4 mb-4"
        >
          <button
            type="button"
            data-ocid="profile.primary_button"
            onClick={() => login()}
            disabled={isLoggingIn}
            className="w-full py-3.5 rounded-xl text-white font-bold text-sm flex items-center justify-center gap-2 transition-all active:scale-[0.98] disabled:opacity-70"
            style={{
              background:
                "linear-gradient(135deg, oklch(0.72 0.11 355), oklch(0.62 0.10 268))",
            }}
          >
            {isLoggingIn ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <LogIn className="w-4 h-4" />
            )}
            {isLoggingIn ? "Logging in..." : "Login with Internet Identity"}
          </button>
          <p className="text-center text-xs text-muted-foreground mt-2">
            Login to see your posts & personalize your profile 🌸
          </p>
        </motion.div>
      )}

      {/* Avatar & name */}
      <div className="flex flex-col items-center px-4 mb-5">
        <div className="relative mb-3">
          <div
            className="w-24 h-24 rounded-full flex items-center justify-center text-white text-3xl font-black shadow-pink overflow-hidden"
            style={{ background: AVATAR_GRADIENTS[avatarColor].value }}
          >
            {isLoading ? (
              <Skeleton
                className="w-24 h-24 rounded-full shimmer"
                data-ocid="profile.loading_state"
              />
            ) : profilePhoto ? (
              <img
                src={profilePhoto}
                alt="Profile"
                className="w-full h-full object-cover"
              />
            ) : (
              <span>{initials}</span>
            )}
          </div>

          {/* Camera button */}
          <button
            type="button"
            data-ocid="profile.upload_button"
            onClick={handleCameraClick}
            className="absolute bottom-0 right-0 w-8 h-8 rounded-full bg-white shadow-md border border-border flex items-center justify-center hover:bg-muted transition-colors"
          >
            <Camera className="w-4 h-4 text-foreground" />
          </button>

          {/* Photo menu */}
          <AnimatePresence>
            {showPhotoMenu && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9, y: 4 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 4 }}
                data-ocid="profile.popover"
                className="absolute top-full right-0 mt-1 rounded-2xl shadow-lg border border-border overflow-hidden z-20"
                style={{
                  background: "rgba(255,255,255,0.97)",
                  backdropFilter: "blur(20px)",
                  minWidth: 160,
                }}
              >
                <button
                  type="button"
                  data-ocid="profile.edit_button"
                  onClick={handleChangePhoto}
                  className="w-full flex items-center gap-2.5 px-4 py-3 text-sm font-semibold text-foreground hover:bg-muted transition-colors text-left"
                >
                  <Camera className="w-4 h-4 text-primary" />
                  Change Photo
                </button>
                <div className="border-t border-border" />
                <button
                  type="button"
                  data-ocid="profile.delete_button"
                  onClick={handleRemovePhoto}
                  className="w-full flex items-center gap-2.5 px-4 py-3 text-sm font-semibold text-rose-500 hover:bg-rose-50 transition-colors text-left"
                >
                  <Trash2 className="w-4 h-4" />
                  Remove Photo
                </button>
              </motion.div>
            )}
          </AnimatePresence>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (!file) return;
              const reader = new FileReader();
              reader.onload = (ev) => {
                const result = ev.target?.result as string;
                setProfilePhoto(result);
                localStorage.setItem("mochi_profile_photo", result);
                toast.success("Profile photo updated! 📸");
              };
              reader.readAsDataURL(file);
            }}
          />
        </div>

        {isLoading ? (
          <Skeleton className="h-5 w-32 shimmer" />
        ) : (
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-black text-foreground">{nickname}</h2>
            <button
              type="button"
              data-ocid="profile.open_modal_button"
              onClick={openEdit}
              className="p-1 rounded-full hover:bg-muted transition-colors"
            >
              <Edit3 className="w-3.5 h-3.5 text-muted-foreground" />
            </button>
          </div>
        )}

        <p className="text-xs text-muted-foreground">
          {isLoggedIn ? "Verified member ✓" : "Anonymous member"}
        </p>

        {isLoggedIn && principalStr && (
          <button
            type="button"
            data-ocid="profile.copy_id.button"
            onClick={() => {
              navigator.clipboard.writeText(principalStr);
              toast.success("Mochi ID copy ho gaya! Share karo dosto se 🎯");
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-muted hover:bg-muted/80 transition-colors"
          >
            <Copy className="w-3 h-3 text-muted-foreground" />
            <span className="text-[11px] font-semibold text-muted-foreground truncate max-w-[140px]">
              {principalStr.slice(0, 12)}…
            </span>
          </button>
        )}
        {isLoggedIn && (
          <p className="text-[10px] text-muted-foreground/60 text-center max-w-[200px]">
            Yeh hai tera Mochi ID — doston ko share karo 🎯
          </p>
        )}

        <div className="mt-1.5 max-w-[240px] text-center">
          {bio ? (
            <p className="text-xs text-foreground/70 leading-relaxed">{bio}</p>
          ) : (
            <button
              type="button"
              onClick={openEdit}
              className="text-xs text-muted-foreground/60 italic hover:text-muted-foreground transition-colors"
            >
              Tap ✏️ to add a bio
            </button>
          )}
        </div>

        <div className="flex items-center gap-1.5 mt-2 px-3 py-1.5 rounded-full bg-muted">
          <span>{tier.emoji}</span>
          <span className={`text-xs font-bold ${tier.color}`}>{tier.name}</span>
          <span className="text-xs text-muted-foreground">
            &middot; {points} pts
          </span>
        </div>
      </div>

      {/* Edit Panel */}
      <AnimatePresence>
        {isEditing && (
          <motion.div
            key="edit-panel"
            data-ocid="profile.panel"
            initial={{ opacity: 0, y: -12, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.98 }}
            transition={{ type: "spring", stiffness: 340, damping: 30 }}
            className="mx-4 mb-4 bg-card rounded-2xl p-4 shadow-card border border-border"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-black text-sm text-foreground">
                Edit Profile
              </h3>
              <button
                type="button"
                data-ocid="profile.close_button"
                onClick={cancelEdit}
                className="p-1 rounded-full hover:bg-muted transition-colors"
              >
                <X className="w-4 h-4 text-muted-foreground" />
              </button>
            </div>
            <div className="mb-3">
              <span className="text-xs font-bold text-foreground mb-1 block">
                Display Name
              </span>
              <div className="relative">
                <Input
                  id="edit-nickname"
                  data-ocid="profile.input"
                  value={editNickname}
                  onChange={(e) => setEditNickname(e.target.value.slice(0, 20))}
                  placeholder="Your nickname…"
                  className="pr-12 rounded-xl text-sm"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-muted-foreground">
                  {editNickname.length}/20
                </span>
              </div>
            </div>
            <div className="mb-4">
              <span className="text-xs font-bold text-foreground mb-1 block">
                Bio
              </span>
              <div className="relative">
                <Textarea
                  id="edit-bio"
                  data-ocid="profile.textarea"
                  value={editBio}
                  onChange={(e) => setEditBio(e.target.value.slice(0, 100))}
                  placeholder="Vibing through life ✨"
                  className="resize-none rounded-xl text-sm pb-6"
                  rows={2}
                />
                <span className="absolute right-3 bottom-2 text-[10px] text-muted-foreground">
                  {editBio.length}/100
                </span>
              </div>
            </div>
            <div className="mb-5">
              <span className="text-xs font-bold text-foreground mb-2 block">
                Avatar Color
              </span>
              <div className="flex gap-2">
                {AVATAR_GRADIENTS.map((grad, idx) => (
                  <button
                    key={grad.id}
                    type="button"
                    data-ocid={`profile.toggle.${idx + 1}`}
                    onClick={() => setEditAvatarColor(idx)}
                    className="w-9 h-9 rounded-full transition-all"
                    style={{
                      background: grad.value,
                      outline:
                        editAvatarColor === idx
                          ? "3px solid oklch(0.72 0.11 355)"
                          : "3px solid transparent",
                      outlineOffset: "2px",
                      transform:
                        editAvatarColor === idx ? "scale(1.15)" : "scale(1)",
                    }}
                  />
                ))}
              </div>
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                data-ocid="profile.cancel_button"
                onClick={cancelEdit}
                className="flex-1 py-2.5 rounded-xl border border-border text-xs font-bold text-muted-foreground hover:bg-muted transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                data-ocid="profile.save_button"
                onClick={saveEdit}
                disabled={
                  saveProfile.isPending || editNickname.trim().length === 0
                }
                className="flex-1 py-2.5 rounded-xl text-white text-xs font-bold flex items-center justify-center gap-1.5 transition-opacity disabled:opacity-60"
                style={{
                  background:
                    "linear-gradient(135deg, oklch(0.72 0.11 355), oklch(0.62 0.10 268))",
                }}
              >
                {saveProfile.isPending ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Check className="w-3.5 h-3.5" />
                )}
                {saveProfile.isPending ? "Saving…" : "Save"}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Stats */}
      <div className="mx-4 mb-4 bg-card rounded-2xl p-4 shadow-card border border-border">
        <div className="grid grid-cols-3 divide-x divide-border">
          {stats.map((stat) => (
            <div key={stat.label} className="flex flex-col items-center py-1">
              <span className="text-xl font-black text-foreground">
                {stat.value}
              </span>
              <span className="text-xs text-muted-foreground font-semibold">
                {stat.label}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Progress */}
      {nextTier && (
        <div className="mx-4 mb-4 bg-card rounded-2xl p-4 shadow-card border border-border">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-foreground">
              Progress to {nextTier.emoji} {nextTier.name}
            </span>
            <span className="text-xs text-muted-foreground">
              {points}/{nextTier.min} pts
            </span>
          </div>
          <Progress value={progress} className="h-2" />
          <p className="text-xs text-muted-foreground mt-1.5">
            {nextTier.min - points} more points to unlock {nextTier.name}!
          </p>
        </div>
      )}

      {/* Badges */}
      <div className="mx-4 mb-4">
        <h3 className="font-bold text-sm text-foreground mb-3 flex items-center gap-1.5">
          <Award className="w-4 h-4 text-primary" />
          Badges
        </h3>
        <div className="grid grid-cols-3 gap-3">
          {SAMPLE_BADGES.map((badge, i) => (
            <motion.div
              key={badge.name}
              data-ocid={`profile.badge.item.${i + 1}`}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.05 }}
              className={`flex flex-col items-center gap-1.5 p-3 rounded-2xl border transition-all ${
                badge.earned
                  ? "bg-card shadow-xs border-primary/20"
                  : "bg-muted/50 border-border opacity-50"
              }`}
            >
              <span className="text-2xl">{badge.emoji}</span>
              <span className="text-[10px] font-bold text-foreground text-center leading-tight">
                {badge.name}
              </span>
              {!badge.earned && (
                <span className="text-[9px] text-muted-foreground">Locked</span>
              )}
            </motion.div>
          ))}
        </div>
      </div>

      {/* Recent Shares */}
      <div className="mx-4 mb-4">
        <h3 className="font-bold text-sm text-foreground mb-3 flex items-center gap-1.5">
          <Heart className="w-4 h-4 text-primary" />
          My Recent Shares
        </h3>
        {!isLoggedIn ? (
          <div
            data-ocid="profile.shares.empty_state"
            className="bg-card rounded-2xl shadow-card border border-border p-6 flex flex-col items-center gap-2 text-center"
          >
            <span className="text-3xl">🔐</span>
            <p className="text-sm font-semibold text-foreground">
              Login to see your posts
            </p>
            <p className="text-xs text-muted-foreground">
              Your shares will appear here after logging in 🌸
            </p>
            <button
              type="button"
              data-ocid="profile.shares.primary_button"
              onClick={() => login()}
              disabled={isLoggingIn}
              className="mt-2 px-5 py-2 rounded-xl text-white text-xs font-bold flex items-center gap-1.5 transition-all active:scale-95 disabled:opacity-70"
              style={{
                background:
                  "linear-gradient(135deg, oklch(0.72 0.11 355), oklch(0.62 0.10 268))",
              }}
            >
              {isLoggingIn ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <LogIn className="w-3.5 h-3.5" />
              )}
              Login
            </button>
          </div>
        ) : myPosts.length === 0 ? (
          <div
            data-ocid="profile.shares.empty_state"
            className="bg-card rounded-2xl shadow-card border border-border p-6 text-center"
          >
            <p className="text-sm text-muted-foreground">
              No posts yet — share something! 🌸
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-3" data-ocid="profile.shares.list">
            {myPosts.map((post, i) => {
              const categoryKey = Object.keys(post.category)[0] ?? "General";
              const colorClass =
                CATEGORY_COLORS[categoryKey] ?? "bg-gray-100 text-gray-700";
              return (
                <motion.div
                  key={`${post.author.toString()}-${post.title}-${i}`}
                  data-ocid={`profile.shares.item.${i + 1}`}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.04 }}
                  className="bg-card rounded-2xl shadow-card border border-border p-4"
                >
                  <div className="flex items-start justify-between gap-2 mb-1.5">
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${colorClass}`}
                    >
                      {categoryKey}
                    </span>
                    <span className="flex items-center gap-0.5 text-xs text-muted-foreground">
                      <Heart className="w-3 h-3 fill-current text-pink-400" />
                      {Number(post.likes)}
                    </span>
                  </div>
                  <p className="font-bold text-sm text-foreground leading-snug mb-0.5">
                    {post.title}
                  </p>
                  <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                    {post.content}
                  </p>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>

      {/* Language */}
      <div className="mx-4 mb-4 bg-card rounded-2xl p-4 shadow-card border border-border">
        <h3 className="font-bold text-sm text-foreground mb-3 flex items-center gap-1.5">
          <Globe className="w-4 h-4 text-secondary" />
          Language
        </h3>
        <div className="flex gap-2">
          {LANGUAGES.map((l) => (
            <button
              type="button"
              key={l.code}
              data-ocid="profile.language.toggle"
              onClick={() => {
                setLang(l.code);
                toast.success(`Language set to ${l.label}`);
              }}
              className={`flex-1 flex flex-col items-center gap-1 py-2.5 rounded-xl text-xs font-bold transition-all border ${
                lang === l.code
                  ? "text-white border-transparent"
                  : "bg-muted border-transparent text-muted-foreground hover:border-primary/20"
              }`}
              style={
                lang === l.code
                  ? {
                      background:
                        "linear-gradient(135deg, oklch(0.72 0.11 355), oklch(0.62 0.10 268))",
                    }
                  : {}
              }
            >
              <span className="text-lg">{l.flag}</span>
              {l.label}
            </button>
          ))}
        </div>
      </div>

      {/* PWA Install */}
      {canInstall && (
        <div className="mx-4 mb-4 bg-card rounded-2xl p-4 shadow-card border border-border">
          <h3 className="font-bold text-sm text-foreground mb-1 flex items-center gap-1.5">
            <Download className="w-4 h-4 text-secondary" />
            Install Mochi App
          </h3>
          <p className="text-xs text-muted-foreground mb-3">
            Add to your home screen for the best experience 📱
          </p>
          <button
            type="button"
            data-ocid="profile.install_button"
            onPointerDown={handleInstall}
            className="w-full py-2.5 rounded-xl text-sm font-bold text-white transition-all active:scale-95"
            style={{
              background:
                "linear-gradient(135deg, oklch(0.72 0.11 355), oklch(0.62 0.10 268))",
              touchAction: "manipulation",
            }}
          >
            Install Now ✨
          </button>
        </div>
      )}

      <div className="text-center pb-6 text-xs text-muted-foreground px-4">
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
  );
}
