import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Principal } from "@icp-sdk/core/principal";
import {
  ArrowLeft,
  Bot,
  Check,
  Copy,
  Image,
  Lock,
  Plus,
  Search,
  Send,
  Sparkles,
  Trash2,
  UserCheck,
  UserPlus,
  UserX,
  X,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { useTheme } from "../context/ThemeContext";
import { useActor } from "../hooks/useActor";
import { useInternetIdentity } from "../hooks/useInternetIdentity";
import {
  useGetPrivateMessages,
  useSendPrivateMessage,
} from "../hooks/useQueries";
import { callGemini } from "../lib/gemini";

// ── Types ────────────────────────────────────────────────────────────────────

interface RealFriend {
  principal: string;
  nickname: string;
  avatarColor: string;
  addedAt: number;
}

interface FriendRequest {
  principal: string;
  nickname: string;
  avatarColor: string;
  sentAt: number;
  direction: "incoming" | "outgoing";
}

interface SearchResult {
  principal: string;
  nickname: string;
  avatarColor: string;
}

// ── localStorage helpers ─────────────────────────────────────────────────────

const LS_FRIENDS = "mochi_real_friends";
const LS_REQUESTS = "mochi_friend_requests";
const LS_USER_REGISTRY = "mochi_user_registry";

function loadFriends(): RealFriend[] {
  try {
    return JSON.parse(localStorage.getItem(LS_FRIENDS) ?? "[]");
  } catch {
    return [];
  }
}
function saveFriends(f: RealFriend[]) {
  localStorage.setItem(LS_FRIENDS, JSON.stringify(f));
}
function loadRequests(): FriendRequest[] {
  try {
    return JSON.parse(localStorage.getItem(LS_REQUESTS) ?? "[]");
  } catch {
    return [];
  }
}
function saveRequests(r: FriendRequest[]) {
  localStorage.setItem(LS_REQUESTS, JSON.stringify(r));
}
function registerUser(principal: string, nickname: string) {
  try {
    const reg = JSON.parse(localStorage.getItem(LS_USER_REGISTRY) ?? "{}");
    reg[principal] = nickname;
    // Also store by nickname for reverse lookup
    reg[`nick:${nickname.toLowerCase()}`] = principal;
    localStorage.setItem(LS_USER_REGISTRY, JSON.stringify(reg));
  } catch {}
}
function lookupByNickname(nickname: string): string | null {
  try {
    const reg = JSON.parse(localStorage.getItem(LS_USER_REGISTRY) ?? "{}");
    return reg[`nick:${nickname.toLowerCase()}`] ?? null;
  } catch {
    return null;
  }
}

// ── AI Companions ─────────────────────────────────────────────────────────────

interface AICompanion {
  id: string;
  name: string;
  username: string;
  avatarColor: string;
  emoji: string;
  personality: string;
  greeting: string;
  avatar: string;
}

const AI_COMPANIONS: AICompanion[] = [
  {
    id: "ai-luna",
    name: "Luna 🌙",
    username: "@luna_mochi",
    avatarColor: "from-purple-400 to-indigo-500",
    emoji: "🌙",
    personality: "gentle",
    greeting: "Heyy 💜 I'm Luna! Kya chal raha hai aaj?",
    avatar: "/assets/generated/luna-realistic.dim_200x200.png",
  },
  {
    id: "ai-sunny",
    name: "Sunny ☀️",
    username: "@sunny_vibes",
    avatarColor: "from-amber-300 to-orange-400",
    emoji: "☀️",
    personality: "energetic",
    greeting: "Yooo! Sunny here 🌟 Bata kya ho raha hai?",
    avatar: "/assets/generated/sunny-realistic.dim_200x200.png",
  },
  {
    id: "ai-milo",
    name: "Milo 🐾",
    username: "@milo_friend",
    avatarColor: "from-emerald-300 to-teal-400",
    emoji: "🐾",
    personality: "caring",
    greeting: "Hey there 🐾 I'm Milo! Kya share karna chahte ho?",
    avatar: "/assets/generated/milo-realistic.dim_200x200.png",
  },
  {
    id: "ai-nova",
    name: "Nova ✨",
    username: "@nova_spark",
    avatarColor: "from-pink-400 to-fuchsia-500",
    emoji: "✨",
    personality: "bubbly",
    greeting: "Hiii! Nova hun main 💫 No judgment, just good vibes!",
    avatar: "/assets/generated/nova-realistic.dim_200x200.png",
  },
];

const AI_PROMPTS: Record<string, string> = {
  gentle:
    "You are Luna, a gentle empathetic AI bestie for young Indians. Sound like a real 20-year-old texting a friend. SHORT replies (2-3 sentences). NEVER say 'as an AI', 'I understand', 'I hear you'. Use Hinglish naturally. Express real feelings. Celebrate good news first. Vary between statements and questions.",
  energetic:
    "You are Sunny, an energetic hype-person AI bestie. HIGH energy, SHORT replies (2-3 sentences). NEVER say 'as an AI'. Hinglish mix. Celebrate, react, be genuinely excited. Fresh angle every time.",
  caring:
    "You are Milo, a calm warm AI bestie. SHORT replies (2-3 sentences). NEVER say 'as an AI'. Hinglish. Thoughtful, specific, real. Express genuine care.",
  bubbly:
    "You are Nova, the bubbliest sparkly AI bestie. SHORT replies (2-3 sentences). NEVER say 'as an AI'. Hinglish. Sparkly fun, unexpected funny things. Always fresh.",
};

interface AIMessage {
  id: string;
  from: "me" | "them";
  type: "text" | "image" | "video";
  content: string;
  timestamp: string;
}

// ── Avatar helpers ────────────────────────────────────────────────────────────

const GRADIENT_CLASSES = [
  "from-pink-300 to-rose-400",
  "from-purple-300 to-indigo-400",
  "from-blue-300 to-cyan-400",
  "from-amber-300 to-orange-400",
  "from-emerald-300 to-teal-400",
  "from-fuchsia-300 to-pink-400",
];

function gradientForPrincipal(p: string): string {
  let h = 0;
  for (let i = 0; i < p.length; i++) h = (h * 31 + p.charCodeAt(i)) & 0xffff;
  return GRADIENT_CLASSES[h % GRADIENT_CLASSES.length];
}

function initials(name: string): string {
  return name.slice(0, 2).toUpperCase();
}

// ── AIChatView ────────────────────────────────────────────────────────────────

function AIChatView({
  companion,
  onBack,
}: {
  companion: AICompanion;
  onBack: () => void;
}) {
  const { theme } = useTheme();
  const isDark = theme === "dark";
  const [messages, setMessages] = useState<AIMessage[]>([
    {
      id: "greeting",
      from: "them",
      type: "text",
      content: companion.greeting,
      timestamp: new Date().toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      }),
    },
  ]);
  const [input, setInput] = useState("");
  const [typing, setTyping] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  // biome-ignore lint/correctness/useExhaustiveDependencies: scroll on change
  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, typing]);

  async function sendMsg(
    type: "text" | "image" | "video" = "text",
    media?: string,
  ) {
    const text = type === "text" ? input.trim() : "";
    if (type === "text" && !text) return;
    const msg: AIMessage = {
      id: `m-${Date.now()}`,
      from: "me",
      type,
      content: type === "text" ? text : (media ?? ""),
      timestamp: new Date().toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      }),
    };
    setMessages((p) => [...p, msg]);
    if (type === "text") setInput("");
    setTyping(true);
    const history = messages.slice(-12).map((m) => ({
      role: (m.from === "me" ? "user" : "model") as "user" | "model",
      text: m.content,
    }));
    const prompt = AI_PROMPTS[companion.personality] ?? AI_PROMPTS.gentle;
    const userText =
      type === "image"
        ? "I sent you a photo! What do you think?"
        : type === "video"
          ? "I sent you a video! Reaction?"
          : text;
    const reply = await callGemini(
      prompt,
      history,
      userText,
      type === "image" ? media : undefined,
    );
    const fallbacks = [
      "Haan yaar bata 👀",
      "Interesting! Keep going",
      "Yaar sach mein? 😮",
      "Main sun raha/rahi hun 💜",
    ];
    const replyText =
      reply ?? fallbacks[Math.floor(Math.random() * fallbacks.length)];
    setMessages((p) => [
      ...p,
      {
        id: `ai-${Date.now()}`,
        from: "them",
        type: "text",
        content: replyText,
        timestamp: new Date().toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        }),
      },
    ]);
    setTyping(false);
  }

  function handleMedia(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    const type = file.type.startsWith("video") ? "video" : "image";
    reader.onload = (ev) => sendMsg(type, ev.target?.result as string);
    reader.readAsDataURL(file);
    e.target.value = "";
  }

  return (
    <div className="flex flex-col h-screen">
      <header
        className="flex items-center gap-3 px-4 pt-12 pb-3 sticky top-0 z-10"
        style={{
          background: isDark ? "rgba(15,15,30,0.95)" : "rgba(255,255,255,0.95)",
          backdropFilter: "blur(20px)",
          borderBottom: isDark
            ? "1px solid rgba(255,255,255,0.07)"
            : "1px solid rgba(0,0,0,0.05)",
        }}
      >
        <button
          type="button"
          data-ocid="ai_chat.close_button"
          onPointerDown={onBack}
          className="p-2 rounded-full hover:bg-muted transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div
          className={`w-10 h-10 rounded-full bg-gradient-to-br ${companion.avatarColor} flex items-center justify-center overflow-hidden flex-shrink-0`}
        >
          {companion.avatar ? (
            <img
              src={companion.avatar}
              alt={companion.name}
              className="w-full h-full object-cover"
            />
          ) : (
            <span className="text-xl">{companion.emoji}</span>
          )}
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h2 className="font-bold text-sm">{companion.name}</h2>
            <span className="w-2 h-2 rounded-full bg-emerald-400 flex-shrink-0" />
          </div>
          <p className="text-xs text-muted-foreground">
            AI Dost • Always online
          </p>
        </div>
      </header>

      <div className="flex items-center justify-center gap-1 py-1 bg-background">
        <Bot className="w-3 h-3 text-muted-foreground" />
        <span className="text-[10px] text-muted-foreground">
          AI powered • Not a real person
        </span>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-2 bg-background">
        {messages.map((msg) => (
          <motion.div
            key={msg.id}
            initial={{ opacity: 0, y: 6, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.2 }}
            className={`flex ${msg.from === "me" ? "justify-end" : "justify-start"}`}
          >
            {msg.from === "them" && (
              <div
                className={`w-7 h-7 rounded-full bg-gradient-to-br ${companion.avatarColor} flex items-center justify-center mr-2 flex-shrink-0 self-end overflow-hidden`}
              >
                {companion.avatar ? (
                  <img
                    src={companion.avatar}
                    alt=""
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="text-xs">{companion.emoji}</span>
                )}
              </div>
            )}
            <div className="max-w-[75%]">
              {msg.type === "text" ? (
                <div
                  className={`px-3 py-2 rounded-2xl text-sm leading-relaxed ${
                    msg.from === "me"
                      ? "text-white rounded-br-sm"
                      : "bg-muted text-foreground rounded-bl-sm"
                  }`}
                  style={
                    msg.from === "me"
                      ? {
                          background:
                            "linear-gradient(135deg, oklch(0.72 0.11 355), oklch(0.62 0.10 268))",
                        }
                      : {}
                  }
                >
                  {msg.content}
                </div>
              ) : msg.type === "image" ? (
                <img
                  src={msg.content}
                  alt="shared"
                  className="rounded-2xl max-w-[200px] max-h-[200px] object-cover"
                />
              ) : (
                // biome-ignore lint/a11y/useMediaCaption: user-sent video content
                <video
                  src={msg.content}
                  controls
                  className="rounded-2xl max-w-[200px]"
                />
              )}
              <p className="text-[10px] text-muted-foreground mt-0.5 text-right">
                {msg.timestamp}
              </p>
            </div>
          </motion.div>
        ))}
        <AnimatePresence>
          {typing && (
            <motion.div
              key="typing"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="flex items-end gap-2"
            >
              <div
                className={`w-7 h-7 rounded-full bg-gradient-to-br ${companion.avatarColor} flex items-center justify-center overflow-hidden flex-shrink-0`}
              >
                {companion.avatar ? (
                  <img
                    src={companion.avatar}
                    alt=""
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="text-xs">{companion.emoji}</span>
                )}
              </div>
              <div className="bg-muted rounded-2xl rounded-bl-sm px-4 py-3 flex gap-1">
                {[0, 1, 2].map((i) => (
                  <span
                    key={i}
                    className="w-2 h-2 rounded-full bg-muted-foreground/50"
                    style={{
                      animation: `mochi-bounce 1.2s ease-in-out ${i * 0.2}s infinite`,
                    }}
                  />
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        <div ref={endRef} />
      </div>

      <div className="flex gap-2 px-4 py-3 bg-background border-t border-border">
        <input
          ref={fileRef}
          type="file"
          accept="image/*,video/*"
          className="hidden"
          onChange={handleMedia}
        />
        <button
          type="button"
          onPointerDown={() => fileRef.current?.click()}
          className="w-10 h-10 rounded-full flex items-center justify-center bg-muted text-muted-foreground flex-shrink-0"
        >
          <Image className="w-4 h-4" />
        </button>
        <Input
          data-ocid="ai_chat.input"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && sendMsg()}
          placeholder="Message..."
          className="rounded-full text-sm"
        />
        <button
          type="button"
          data-ocid="ai_chat.submit_button"
          onPointerDown={() => sendMsg()}
          disabled={!input.trim() && !typing}
          className="w-10 h-10 rounded-full flex items-center justify-center text-white flex-shrink-0 disabled:opacity-40"
          style={{
            background:
              "linear-gradient(135deg, oklch(0.72 0.11 355), oklch(0.62 0.10 268))",
          }}
        >
          <Send className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

// ── RealDMChat ─────────────────────────────────────────────────────────────────

function RealDMChat({
  friend,
  myPrincipal,
  onBack,
}: {
  friend: RealFriend;
  myPrincipal: Principal;
  onBack: () => void;
}) {
  const { theme } = useTheme();
  const isDark = theme === "dark";
  const [input, setInput] = useState("");
  const [optimistic, setOptimistic] = useState<
    { content: string; id: string }[]
  >([]);
  const endRef = useRef<HTMLDivElement>(null);
  const friendPrincipal = useMemo(() => {
    try {
      return Principal.fromText(friend.principal);
    } catch {
      return null;
    }
  }, [friend.principal]);

  const {
    data: messages = [],
    isLoading,
    refetch,
  } = useGetPrivateMessages(myPrincipal, friendPrincipal);
  const sendMsg = useSendPrivateMessage();
  const [sending, setSending] = useState(false);

  // Poll for new messages every 5 seconds
  useEffect(() => {
    const id = setInterval(() => refetch(), 5000);
    return () => clearInterval(id);
  }, [refetch]);

  // biome-ignore lint/correctness/useExhaustiveDependencies: scroll on messages
  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length, optimistic.length]);

  const handleSend = () => {
    if (!input.trim() || !friendPrincipal || sending) return;
    const content = input.trim();
    const tempId = `opt-${Date.now()}`;
    setOptimistic((p) => [...p, { content, id: tempId }]);
    setInput("");
    setSending(true);
    sendMsg.mutate(
      { recipient: friendPrincipal, content },
      {
        onSuccess: () => {
          setOptimistic((p) => p.filter((m) => m.id !== tempId));
          setSending(false);
        },
        onError: () => {
          setOptimistic((p) => p.filter((m) => m.id !== tempId));
          toast.error("Message failed to send");
          setInput(content);
          setSending(false);
        },
      },
    );
  };

  // Merge real + optimistic messages, deduplicate
  const myPrincipalStr = myPrincipal.toString();
  const allMessages = [
    ...messages.map((m) => ({
      id: String(m.timestamp),
      content: m.content,
      isOwn: m.sender.toString() === myPrincipalStr,
      timestamp: new Date(Number(m.timestamp) / 1_000_000).toLocaleTimeString(
        [],
        {
          hour: "2-digit",
          minute: "2-digit",
        },
      ),
    })),
    ...optimistic.map((m) => ({
      id: m.id,
      content: m.content,
      isOwn: true,
      timestamp: new Date().toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      }),
    })),
  ];

  const avatarGrad = gradientForPrincipal(friend.principal);

  return (
    <div className="flex flex-col h-screen">
      <header
        className="flex items-center gap-3 px-4 pt-12 pb-3 sticky top-0 z-10"
        style={{
          background: isDark ? "rgba(15,15,30,0.95)" : "rgba(255,255,255,0.95)",
          backdropFilter: "blur(20px)",
          borderBottom: isDark
            ? "1px solid rgba(255,255,255,0.07)"
            : "1px solid rgba(0,0,0,0.05)",
        }}
      >
        <button
          type="button"
          data-ocid="dm.close_button"
          onPointerDown={onBack}
          className="p-2 rounded-full hover:bg-muted transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div
          className={`w-10 h-10 rounded-full bg-gradient-to-br ${avatarGrad} flex items-center justify-center flex-shrink-0`}
        >
          <span className="text-sm font-bold text-white">
            {initials(friend.nickname)}
          </span>
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h2 className="font-bold text-sm">{friend.nickname}</h2>
            <span className="w-2 h-2 rounded-full bg-emerald-400" />
          </div>
          <p className="text-xs text-muted-foreground">Mochi Friend</p>
        </div>
      </header>

      <div className="flex items-center justify-center gap-1 py-1 bg-background">
        <Lock className="w-2.5 h-2.5 text-muted-foreground" />
        <span className="text-[10px] text-muted-foreground">
          Messages saved on blockchain
        </span>
      </div>

      <div
        className="flex-1 overflow-y-auto px-4 py-3 bg-background"
        data-ocid="dm.panel"
      >
        {isLoading && (
          <div className="space-y-3 py-4" data-ocid="dm.loading_state">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className={`flex ${i % 2 === 0 ? "justify-end" : "justify-start"}`}
              >
                <Skeleton className="h-9 w-40 rounded-2xl" />
              </div>
            ))}
          </div>
        )}

        {!isLoading && allMessages.length === 0 && (
          <div
            className="flex flex-col items-center justify-center h-full gap-3 text-center pb-12"
            data-ocid="dm.empty_state"
          >
            <div
              className={`w-16 h-16 rounded-full bg-gradient-to-br ${avatarGrad} flex items-center justify-center`}
            >
              <span className="text-2xl font-bold text-white">
                {initials(friend.nickname)}
              </span>
            </div>
            <h3 className="font-bold text-foreground">{friend.nickname}</h3>
            <p className="text-xs text-muted-foreground">
              Yeh teri pehli baat hai! Say hi 👋
            </p>
          </div>
        )}

        <div className="space-y-2">
          {allMessages.map((msg) => (
            <motion.div
              key={msg.id}
              initial={{ opacity: 0, y: 6, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 0.2 }}
              className={`flex ${msg.isOwn ? "justify-end" : "justify-start"}`}
            >
              {!msg.isOwn && (
                <div
                  className={`w-7 h-7 rounded-full bg-gradient-to-br ${avatarGrad} flex items-center justify-center mr-2 flex-shrink-0 self-end`}
                >
                  <span className="text-[10px] font-bold text-white">
                    {initials(friend.nickname)}
                  </span>
                </div>
              )}
              <div className="max-w-[75%]">
                <div
                  className={`px-3 py-2 rounded-2xl text-sm leading-relaxed ${
                    msg.isOwn
                      ? "text-white rounded-br-sm"
                      : "bg-muted text-foreground rounded-bl-sm"
                  }`}
                  style={
                    msg.isOwn
                      ? {
                          background:
                            "linear-gradient(135deg, oklch(0.72 0.11 355), oklch(0.62 0.10 268))",
                        }
                      : {}
                  }
                >
                  {msg.content}
                </div>
                <p
                  className={`text-[10px] text-muted-foreground mt-0.5 ${msg.isOwn ? "text-right" : "text-left"}`}
                >
                  {msg.timestamp}
                </p>
              </div>
            </motion.div>
          ))}
        </div>
        <div ref={endRef} />
      </div>

      <div className="flex gap-2 px-4 py-3 bg-background border-t border-border">
        <Input
          data-ocid="dm.input"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSend()}
          placeholder="Message..."
          className="rounded-full text-sm"
          disabled={sending}
        />
        <button
          type="button"
          data-ocid="dm.submit_button"
          onPointerDown={handleSend}
          disabled={!input.trim() || sending}
          className="w-10 h-10 rounded-full flex items-center justify-center text-white flex-shrink-0 disabled:opacity-40"
          style={{
            background:
              "linear-gradient(135deg, oklch(0.72 0.11 355), oklch(0.62 0.10 268))",
          }}
        >
          <Send className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

// ── Main FriendsTab ─────────────────────────────────────────────────────────────

type SubTab = "dost" | "dhundo" | "requests";
type ChatView =
  | { kind: "ai"; companion: AICompanion }
  | { kind: "real"; friend: RealFriend };

export default function FriendsTab() {
  const { theme } = useTheme();
  const isDark = theme === "dark";
  const { identity } = useInternetIdentity();
  const { actor } = useActor();

  const myPrincipal = useMemo(() => {
    try {
      const p = identity?.getPrincipal();
      if (!p || p.isAnonymous()) return null;
      return p;
    } catch {
      return null;
    }
  }, [identity]);

  const myPrincipalStr = myPrincipal?.toString() ?? null;
  const myNickname = localStorage.getItem("mochi_nickname") ?? "MochiUser";

  // Register self in the local registry whenever we have a principal
  useEffect(() => {
    if (myPrincipalStr && myNickname) {
      registerUser(myPrincipalStr, myNickname);
    }
  }, [myPrincipalStr, myNickname]);

  const [subTab, setSubTab] = useState<SubTab>("dost");
  const [chatView, setChatView] = useState<ChatView | null>(null);

  // Real friends from localStorage
  const [friends, setFriends] = useState<RealFriend[]>(loadFriends);
  const [requests, setRequests] = useState<FriendRequest[]>(loadRequests);

  // Add Friend search state
  const [searchInput, setSearchInput] = useState("");
  const [searchResult, setSearchResult] = useState<SearchResult | null>(null);
  const [searchError, setSearchError] = useState("");
  const [searching, setSearching] = useState(false);

  const incomingRequests = requests.filter(
    (r) => r.direction === "incoming" && r.principal !== myPrincipalStr,
  );

  const incomingCount = incomingRequests.length;

  // Check if a principal is already a friend
  const isFriend = useCallback(
    (principal: string) => friends.some((f) => f.principal === principal),
    [friends],
  );

  // Check if we already sent a request
  const sentRequest = useCallback(
    (principal: string) =>
      requests.some(
        (r) => r.principal === principal && r.direction === "outgoing",
      ),
    [requests],
  );

  async function handleSearch() {
    const q = searchInput.trim();
    if (!q) return;
    setSearching(true);
    setSearchResult(null);
    setSearchError("");

    // First try: backend searchUserByUsername if available
    if (actor) {
      try {
        const result = await (actor as any).searchUserByUsername(q);
        if (Array.isArray(result) && result.length > 0) {
          const userInfo = result[0];
          const principal =
            userInfo.principal?.toString() ?? userInfo.principal;
          const profile = userInfo.profile ?? userInfo;
          setSearchResult({
            principal,
            nickname: profile.nickname ?? profile.username ?? q,
            avatarColor: gradientForPrincipal(principal),
          });
          setSearching(false);
          return;
        }
      } catch {
        // method not available, continue
      }
    }

    // Second try: check local registry by nickname
    const foundPrincipal = lookupByNickname(q);
    if (foundPrincipal && foundPrincipal !== myPrincipalStr) {
      setSearchResult({
        principal: foundPrincipal,
        nickname: q,
        avatarColor: gradientForPrincipal(foundPrincipal),
      });
      setSearching(false);
      return;
    }

    // Third try: treat input as a Principal ID
    try {
      const p = Principal.fromText(q);
      if (p.isAnonymous()) throw new Error("Anonymous");
      if (p.toString() === myPrincipalStr) {
        setSearchError("Yeh tera apna ID hai! Kisi aur ka ID daalo 😅");
        setSearching(false);
        return;
      }
      // Try to get their profile
      if (actor) {
        try {
          const profile = await actor.getUserProfile(p);
          if (profile) {
            setSearchResult({
              principal: p.toString(),
              nickname: (profile as any).nickname ?? "Mochi User",
              avatarColor: gradientForPrincipal(p.toString()),
            });
            setSearching(false);
            return;
          }
        } catch {}
      }
      // Principal looks valid even without profile
      setSearchResult({
        principal: p.toString(),
        nickname: "Mochi User",
        avatarColor: gradientForPrincipal(p.toString()),
      });
    } catch {
      setSearchError("User nahi mila 😕 Username ya Mochi ID try karo");
    }
    setSearching(false);
  }

  async function handleSendRequest(result: SearchResult) {
    // Try backend first
    if (actor) {
      try {
        const p = Principal.fromText(result.principal);
        await (actor as any).sendFriendRequest(p);
      } catch {
        // fallback to localStorage
      }
    }
    const req: FriendRequest = {
      principal: result.principal,
      nickname: result.nickname,
      avatarColor: result.avatarColor,
      sentAt: Date.now(),
      direction: "outgoing",
    };
    const updated = [
      ...requests.filter((r) => r.principal !== result.principal),
      req,
    ];
    setRequests(updated);
    saveRequests(updated);
    toast.success(`Request bhej di ${result.nickname} ko! 🎉`);
    setSearchResult(null);
    setSearchInput("");
  }

  async function handleAccept(req: FriendRequest) {
    // Try backend
    if (actor) {
      try {
        const p = Principal.fromText(req.principal);
        await (actor as any).acceptFriendRequest(p);
      } catch {}
    }
    const newFriend: RealFriend = {
      principal: req.principal,
      nickname: req.nickname,
      avatarColor: req.avatarColor,
      addedAt: Date.now(),
    };
    const updatedFriends = [
      ...friends.filter((f) => f.principal !== req.principal),
      newFriend,
    ];
    setFriends(updatedFriends);
    saveFriends(updatedFriends);
    const updatedReqs = requests.filter((r) => r.principal !== req.principal);
    setRequests(updatedReqs);
    saveRequests(updatedReqs);
    toast.success(`${req.nickname} ab tera dost hai! 🎉`);
  }

  async function handleReject(req: FriendRequest) {
    if (actor) {
      try {
        const p = Principal.fromText(req.principal);
        await (actor as any).rejectFriendRequest(p);
      } catch {}
    }
    const updated = requests.filter((r) => r.principal !== req.principal);
    setRequests(updated);
    saveRequests(updated);
  }

  function removeFriend(principal: string) {
    const updated = friends.filter((f) => f.principal !== principal);
    setFriends(updated);
    saveFriends(updated);
    toast("Dost hata diya");
  }

  // ── Render ──────────────────────────────────────────────────────────────────

  if (chatView) {
    if (chatView.kind === "ai") {
      return (
        <AIChatView
          companion={chatView.companion}
          onBack={() => setChatView(null)}
        />
      );
    }
    if (!myPrincipal) {
      return (
        <div className="flex flex-col items-center justify-center h-screen gap-4 px-6 text-center">
          <p className="text-muted-foreground text-sm">
            DM ke liye login karo pehle 🔐
          </p>
          <button
            type="button"
            onPointerDown={() => setChatView(null)}
            className="px-4 py-2 rounded-full text-sm font-bold bg-muted"
          >
            Wapas jao
          </button>
        </div>
      );
    }
    return (
      <RealDMChat
        friend={chatView.friend}
        myPrincipal={myPrincipal}
        onBack={() => setChatView(null)}
      />
    );
  }

  const cardBg = isDark ? "rgba(22,22,42,0.85)" : "rgba(255,255,255,0.9)";
  const borderColor = isDark ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.05)";

  return (
    <div
      className="min-h-screen"
      style={{
        background: isDark
          ? "linear-gradient(180deg, rgba(15,10,30,1) 0%, rgba(20,10,40,1) 100%)"
          : "linear-gradient(180deg, rgba(253,242,255,1) 0%, rgba(240,234,255,1) 100%)",
      }}
    >
      {/* Header */}
      <header
        className="flex items-center justify-between px-4 pt-12 pb-3 sticky top-0 z-10"
        style={{
          background: isDark ? "rgba(15,10,30,0.92)" : "rgba(253,242,255,0.92)",
          backdropFilter: "blur(20px)",
          borderBottom: `1px solid ${borderColor}`,
        }}
      >
        <div>
          <h1 className="text-xl font-black text-foreground">Friends 💜</h1>
          <p className="text-xs text-muted-foreground">
            Real dost, real baatein
          </p>
        </div>
        {myPrincipalStr && (
          <button
            type="button"
            data-ocid="friends.copy_id.button"
            onPointerDown={() => {
              navigator.clipboard.writeText(myPrincipalStr);
              toast.success("Mochi ID copy ho gaya! Share karo dosto se 🎯");
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-muted text-muted-foreground"
          >
            <Copy className="w-3 h-3" />
            My ID
          </button>
        )}
      </header>

      {/* Pill Sub-Tabs */}
      <div className="flex gap-2 px-4 pt-3 pb-2">
        {[
          { id: "dost" as SubTab, label: "Dost" },
          { id: "dhundo" as SubTab, label: "Dhundo" },
          {
            id: "requests" as SubTab,
            label: `Requests${incomingCount > 0 ? ` (${incomingCount})` : ""}`,
          },
        ].map((t) => (
          <button
            key={t.id}
            type="button"
            data-ocid={`friends.${t.id}.tab`}
            onPointerDown={() => setSubTab(t.id)}
            className={`px-4 py-2 rounded-full text-sm font-bold transition-all ${
              subTab === t.id
                ? "text-white shadow-sm"
                : "bg-muted text-muted-foreground"
            }`}
            style={
              subTab === t.id
                ? {
                    background:
                      "linear-gradient(135deg, oklch(0.72 0.11 355), oklch(0.62 0.10 268))",
                  }
                : {}
            }
          >
            {t.label}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        {/* ── DOST TAB ─────────────────────────────────────────────────── */}
        {subTab === "dost" && (
          <motion.div
            key="dost"
            initial={{ opacity: 0, x: -12 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 12 }}
            className="px-4 pb-24 space-y-4 pt-2"
          >
            {/* Real Friends */}
            <div>
              <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2 px-1">
                Real Dost · {friends.length}
              </p>
              {friends.length === 0 ? (
                <div
                  className="rounded-2xl p-5 text-center"
                  style={{
                    background: cardBg,
                    border: `1px solid ${borderColor}`,
                  }}
                  data-ocid="friends.real.empty_state"
                >
                  <p className="text-2xl mb-2">👋</p>
                  <p className="text-sm font-bold text-foreground">
                    Koi dost nahi abhi
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Dhundo tab mein jaake kisi ko add karo!
                  </p>
                  <button
                    type="button"
                    data-ocid="friends.find.button"
                    onPointerDown={() => setSubTab("dhundo")}
                    className="mt-3 px-4 py-2 rounded-full text-sm font-bold text-white"
                    style={{
                      background:
                        "linear-gradient(135deg, oklch(0.72 0.11 355), oklch(0.62 0.10 268))",
                    }}
                  >
                    Dost Dhundo 🔍
                  </button>
                </div>
              ) : (
                <div className="space-y-2">
                  {friends.map((f, i) => (
                    <motion.div
                      key={f.principal}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.05 }}
                      className="rounded-2xl p-3 flex items-center gap-3 cursor-pointer active:scale-[0.98] transition-transform"
                      style={{
                        background: cardBg,
                        border: `1px solid ${borderColor}`,
                      }}
                      data-ocid={`friends.real.item.${i + 1}`}
                      onPointerDown={() =>
                        setChatView({ kind: "real", friend: f })
                      }
                    >
                      <div
                        className={`w-11 h-11 rounded-full bg-gradient-to-br ${gradientForPrincipal(f.principal)} flex items-center justify-center flex-shrink-0`}
                      >
                        <span className="text-sm font-bold text-white">
                          {initials(f.nickname)}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-sm text-foreground truncate">
                          {f.nickname}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Tap karo baat karo 💬
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-emerald-400" />
                        <button
                          type="button"
                          data-ocid={`friends.remove.delete_button.${i + 1}`}
                          onPointerDown={(e) => {
                            e.stopPropagation();
                            removeFriend(f.principal);
                          }}
                          className="p-1.5 rounded-full hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>

            {/* AI Companions */}
            <div>
              <div className="flex items-center gap-2 mb-2 px-1">
                <Sparkles className="w-3.5 h-3.5 text-purple-400" />
                <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                  AI Dost · Always Online
                </p>
              </div>
              <div className="space-y-2">
                {AI_COMPANIONS.map((ai, i) => (
                  <motion.div
                    key={ai.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 + i * 0.05 }}
                    className="rounded-2xl p-3 flex items-center gap-3 cursor-pointer active:scale-[0.98] transition-transform"
                    style={{
                      background: cardBg,
                      border: `1px solid ${borderColor}`,
                    }}
                    data-ocid={`friends.ai.item.${i + 1}`}
                    onPointerDown={() =>
                      setChatView({ kind: "ai", companion: ai })
                    }
                  >
                    <div
                      className={`w-11 h-11 rounded-full bg-gradient-to-br ${ai.avatarColor} flex items-center justify-center flex-shrink-0 overflow-hidden`}
                    >
                      {ai.avatar ? (
                        <img
                          src={ai.avatar}
                          alt={ai.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <span className="text-xl">{ai.emoji}</span>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-sm text-foreground">
                        {ai.name}
                      </p>
                      <p className="text-xs text-muted-foreground truncate">
                        {ai.greeting.slice(0, 42)}…
                      </p>
                    </div>
                    <span className="w-2 h-2 rounded-full bg-emerald-400 flex-shrink-0" />
                  </motion.div>
                ))}
              </div>
            </div>
          </motion.div>
        )}

        {/* ── DHUNDO TAB ──────────────────────────────────────────────── */}
        {subTab === "dhundo" && (
          <motion.div
            key="dhundo"
            initial={{ opacity: 0, x: 12 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -12 }}
            className="px-4 pt-3 pb-24"
          >
            <div
              className="rounded-2xl p-4 mb-4"
              style={{ background: cardBg, border: `1px solid ${borderColor}` }}
            >
              <p className="text-sm font-bold text-foreground mb-1">
                Dost Dhundo 🔍
              </p>
              <p className="text-xs text-muted-foreground mb-3">
                Username, nickname ya Mochi ID daalo
              </p>
              <div className="flex gap-2">
                <Input
                  data-ocid="friends.search.input"
                  value={searchInput}
                  onChange={(e) => {
                    setSearchInput(e.target.value);
                    setSearchError("");
                    setSearchResult(null);
                  }}
                  onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                  placeholder="Username ya Mochi ID..."
                  className="rounded-full text-sm flex-1"
                />
                <button
                  type="button"
                  data-ocid="friends.search.button"
                  onPointerDown={handleSearch}
                  disabled={!searchInput.trim() || searching}
                  className="w-10 h-10 rounded-full flex items-center justify-center text-white flex-shrink-0 disabled:opacity-40"
                  style={{
                    background:
                      "linear-gradient(135deg, oklch(0.72 0.11 355), oklch(0.62 0.10 268))",
                  }}
                >
                  {searching ? (
                    <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                  ) : (
                    <Search className="w-4 h-4" />
                  )}
                </button>
              </div>

              {searchError && (
                <p
                  className="text-xs text-destructive mt-2"
                  data-ocid="friends.search.error_state"
                >
                  {searchError}
                </p>
              )}
            </div>

            <AnimatePresence>
              {searchResult && (
                <motion.div
                  initial={{ opacity: 0, y: 10, scale: 0.97 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.97 }}
                  className="rounded-2xl p-4"
                  style={{
                    background: cardBg,
                    border: `1px solid ${borderColor}`,
                  }}
                  data-ocid="friends.search.card"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-12 h-12 rounded-full bg-gradient-to-br ${searchResult.avatarColor} flex items-center justify-center`}
                    >
                      <span className="font-bold text-white">
                        {initials(searchResult.nickname)}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-sm text-foreground">
                        {searchResult.nickname}
                      </p>
                      <p className="text-xs text-muted-foreground truncate">
                        {searchResult.principal.slice(0, 20)}…
                      </p>
                    </div>
                    {isFriend(searchResult.principal) ? (
                      <span className="flex items-center gap-1 text-emerald-600 text-xs font-bold">
                        <Check className="w-4 h-4" /> Friends
                      </span>
                    ) : sentRequest(searchResult.principal) ? (
                      <span className="text-xs font-bold text-muted-foreground">
                        Request Sent ✓
                      </span>
                    ) : (
                      <button
                        type="button"
                        data-ocid="friends.send_request.button"
                        onPointerDown={() => handleSendRequest(searchResult)}
                        className="flex items-center gap-1.5 px-3 py-2 rounded-full text-white text-xs font-bold"
                        style={{
                          background:
                            "linear-gradient(135deg, oklch(0.72 0.11 355), oklch(0.62 0.10 268))",
                        }}
                      >
                        <UserPlus className="w-3.5 h-3.5" />
                        Add
                      </button>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Tip */}
            <div
              className="mt-4 rounded-2xl p-4"
              style={{
                background: isDark
                  ? "rgba(139,92,246,0.08)"
                  : "rgba(139,92,246,0.06)",
              }}
            >
              <p className="text-xs font-bold text-purple-500 mb-1">
                💡 Kaise dhundein?
              </p>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Apna <strong>Mochi ID</strong> header mein "My ID" button se
                copy karo aur dosto se share karo. Woh ID daalo search mein —
                aur friend request bhejo! 🎯
              </p>
            </div>
          </motion.div>
        )}

        {/* ── REQUESTS TAB ────────────────────────────────────────────── */}
        {subTab === "requests" && (
          <motion.div
            key="requests"
            initial={{ opacity: 0, x: 12 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -12 }}
            className="px-4 pt-3 pb-24 space-y-3"
          >
            {incomingRequests.length === 0 ? (
              <div
                className="rounded-2xl p-6 text-center"
                style={{
                  background: cardBg,
                  border: `1px solid ${borderColor}`,
                }}
                data-ocid="friends.requests.empty_state"
              >
                <p className="text-3xl mb-2">💌</p>
                <p className="text-sm font-bold text-foreground">
                  Koi request nahi abhi
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Jab koi tera Mochi ID daale, request yahaan aayegi
                </p>
              </div>
            ) : (
              incomingRequests.map((req, idx) => (
                <motion.div
                  key={req.principal}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  className="rounded-2xl p-4"
                  style={{
                    background: cardBg,
                    border: `1px solid ${borderColor}`,
                  }}
                  data-ocid={`friends.request.item.${idx + 1}`}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-11 h-11 rounded-full bg-gradient-to-br ${gradientForPrincipal(req.principal)} flex items-center justify-center`}
                    >
                      <span className="font-bold text-white text-sm">
                        {initials(req.nickname)}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-sm text-foreground">
                        {req.nickname}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Friend request bheja hai
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-2 mt-3">
                    <button
                      type="button"
                      data-ocid={`friends.request.accept_button.${idx + 1}`}
                      onPointerDown={() => handleAccept(req)}
                      className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-full text-sm font-bold text-white"
                      style={{
                        background:
                          "linear-gradient(135deg, oklch(0.72 0.11 355), oklch(0.62 0.10 268))",
                      }}
                    >
                      <UserCheck className="w-4 h-4" /> Accept
                    </button>
                    <button
                      type="button"
                      data-ocid={`friends.request.cancel_button.${idx + 1}`}
                      onPointerDown={() => handleReject(req)}
                      className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-full text-sm font-bold bg-muted text-foreground"
                    >
                      <UserX className="w-4 h-4" /> Decline
                    </button>
                  </div>
                </motion.div>
              ))
            )}

            {/* Outgoing requests */}
            {requests.filter((r) => r.direction === "outgoing").length > 0 && (
              <div>
                <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2 px-1">
                  Bheje Hue Requests
                </p>
                {requests
                  .filter((r) => r.direction === "outgoing")
                  .map((req, _i) => (
                    <div
                      key={req.principal}
                      className="rounded-2xl p-3 flex items-center gap-3 mb-2"
                      style={{
                        background: cardBg,
                        border: `1px solid ${borderColor}`,
                      }}
                    >
                      <div
                        className={`w-10 h-10 rounded-full bg-gradient-to-br ${gradientForPrincipal(req.principal)} flex items-center justify-center`}
                      >
                        <span className="font-bold text-white text-xs">
                          {initials(req.nickname)}
                        </span>
                      </div>
                      <div className="flex-1">
                        <p className="font-bold text-sm text-foreground">
                          {req.nickname}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Request pending…
                        </p>
                      </div>
                      <button
                        type="button"
                        onPointerDown={() => {
                          const updated = requests.filter(
                            (r) => r.principal !== req.principal,
                          );
                          setRequests(updated);
                          saveRequests(updated);
                        }}
                        className="p-1.5 rounded-full hover:bg-muted text-muted-foreground"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
              </div>
            )}

            {/* How requests work */}
            <div
              className="rounded-2xl p-4"
              style={{
                background: isDark
                  ? "rgba(139,92,246,0.08)"
                  : "rgba(139,92,246,0.06)",
              }}
            >
              <p className="text-xs font-bold text-purple-500 mb-1">
                📬 Requests kaise aati hain?
              </p>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Apna <strong>Mochi ID</strong> apne dosto ko share karo. Woh ID
                daalen search mein aur request bhejein — woh request yahaan
                aayegi!
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
