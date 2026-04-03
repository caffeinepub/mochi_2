import { Input } from "@/components/ui/input";
import {
  ArrowLeft,
  BadgeCheck,
  Check,
  Lock,
  Pencil,
  Send,
  Sparkles,
  Trash2,
  X,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { useTheme } from "../context/ThemeContext";
import {
  Category,
  useAddChatMessage,
  useGetChatMessages,
} from "../hooks/useQueries";
import { callGemini } from "../lib/gemini";
import AIChat from "./AIChat";

type SubTab = "rooms" | "mentors" | "ai";

const ROOMS = [
  {
    id: Category.relationship,
    name: "Relationship",
    emoji: "\uD83D\uDC95",
    desc: "Love, family & friendship",
    members: 128,
    color: "from-pink-100 to-rose-100",
    accentColor: "text-pink-600",
  },
  {
    id: Category.mentalHealth,
    name: "Mental Health",
    emoji: "\uD83C\uDF38",
    desc: "Anxiety, depression & well-being",
    members: 214,
    color: "from-purple-100 to-violet-100",
    accentColor: "text-purple-600",
  },
  {
    id: Category.studies,
    name: "Studies",
    emoji: "\uD83D\uDCDA",
    desc: "Exams, learning & academic stress",
    members: 97,
    color: "from-blue-100 to-sky-100",
    accentColor: "text-blue-600",
  },
  {
    id: Category.career,
    name: "Career",
    emoji: "\uD83D\uDCBC",
    desc: "Work, jobs & professional growth",
    members: 83,
    color: "from-amber-100 to-yellow-100",
    accentColor: "text-amber-600",
  },
];

const MENTORS = [
  {
    id: "mentor-1",
    name: "Dr. Priya Sharma",
    firstName: "Priya",
    avatar: "/assets/generated/mentor-priya.dim_200x200.png",
    specialty: "Anxiety & Depression",
    bio: "Licensed therapist with 8+ years helping young adults navigate mental health challenges.",
    rating: 4.9,
    sessions: 420,
    color: "from-pink-300 to-rose-300",
    theme: "mentalHealth" as const,
  },
  {
    id: "mentor-2",
    name: "Arjun Mehta",
    firstName: "Arjun",
    avatar: "/assets/generated/mentor-arjun.dim_200x200.png",
    specialty: "Career & Life Coaching",
    bio: "Career counselor specialized in helping students and early professionals find their path.",
    rating: 4.8,
    sessions: 312,
    color: "from-purple-300 to-violet-300",
    theme: "career" as const,
  },
  {
    id: "mentor-3",
    name: "Sarah Chen",
    firstName: "Sarah",
    avatar: "/assets/generated/mentor-sarah.dim_200x200.png",
    specialty: "Relationships & Family",
    bio: "Relationship counselor who creates a safe space for exploring interpersonal dynamics.",
    rating: 4.9,
    sessions: 538,
    color: "from-blue-300 to-sky-300",
    theme: "relationship" as const,
  },
  {
    id: "mentor-4",
    name: "Rohan Kapoor",
    firstName: "Rohan",
    avatar: "/assets/generated/mentor-rohan.dim_200x200.png",
    specialty: "Academic Stress & Burnout",
    bio: "Educational psychologist helping students manage pressure and build healthy study habits.",
    rating: 4.7,
    sessions: 267,
    color: "from-teal-300 to-green-300",
    theme: "studies" as const,
  },
];

type Mentor = (typeof MENTORS)[0];

const ROOM_MESSAGES: Record<string, { content: string; author: string }[]> = {
  relationship: [
    {
      content: "why does love have to be so complicated ughhh",
      author: "StardustHeart",
    },
    {
      content:
        "my best friend started dating my ex and idk how to feel about it",
      author: "OceanWaves_",
    },
    {
      content:
        "update: we finally talked it out and things are better. communication actually works lol",
      author: "PeachyVibes",
    },
    {
      content:
        "does anyone else feel like they love their partner more than they get loved back?",
      author: "MidnightThoughts",
    },
    {
      content:
        "long distance is so hard. we havent seen each other in 4 months",
      author: "WillowTree22",
    },
    {
      content:
        "my parents don't approve of who I'm dating and its tearing me apart",
      author: "SunsetDreamer",
    },
    {
      content:
        "fell in love with my best friend and now everything is weird 😭",
      author: "CloudySkies",
    },
    {
      content:
        "broke up last week. still checking their instagram every hour someone take my phone",
      author: "NightOwl_xx",
    },
    {
      content:
        "how do you know when a relationship is actually healthy vs just comfortable?",
      author: "CalmHarbor",
    },
    {
      content: "sending everyone here healing and love 💕",
      author: "SoftMorning",
    },
  ],
  mentalHealth: [
    {
      content: "woke up anxious again for no reason. this is exhausting",
      author: "GentleRain",
    },
    {
      content:
        "therapy session today was hard but also really needed. if you're considering it please go",
      author: "HealingSlowly",
    },
    {
      content:
        "is it normal to feel nothing for weeks and then suddenly feel everything at once?",
      author: "EmptyCanvas",
    },
    {
      content:
        "panic attack at work today. had to hide in the bathroom for 20 mins",
      author: "QuietMoon",
    },
    {
      content:
        "anyone else use music as a coping mechanism? it literally saves me",
      author: "SoundWaves__",
    },
    {
      content:
        "reminder that bad mental health days don't erase your good ones",
      author: "SunnyLeaf",
    },
    {
      content:
        "been on medication for 3 months now and honestly it changed my life. no shame in it",
      author: "CalmBreeze",
    },
    {
      content: "3am thoughts hit different. anyone else awake rn?",
      author: "NightBloom",
    },
    {
      content:
        "six months clean from self harm. small wins matter. you can get through this",
      author: "RisingPhoenix",
    },
    {
      content:
        "breathing exercises actually help once you get past feeling stupid doing them lol",
      author: "SageAndSalt",
    },
  ],
  studies: [
    {
      content:
        "literally cried over my exam results today. felt like all that studying meant nothing",
      author: "BlueBook_",
    },
    {
      content: "update from last week: i passed!! barely, but i passed 😭🎉",
      author: "SolvedIt__",
    },
    {
      content:
        "my parents expect A's and I'm barely keeping up. the pressure is killing me",
      author: "OverPressured",
    },
    {
      content:
        "procrastinated an assignment for 2 weeks and now its due in 3 hours wish me luck",
      author: "LastMinute_",
    },
    {
      content:
        "pomodoro technique changed my study game completely if anyone needs tips",
      author: "FocusMachine",
    },
    {
      content:
        "first gen college student here — sometimes the imposter syndrome is unbearable",
      author: "ClimbingUp__",
    },
    {
      content:
        "all nighter number 3 this week. my body hates me and honestly fair",
      author: "ZeroSleep",
    },
  ],
  career: [
    {
      content: "anyone else feeling totally lost about what career to choose?",
      author: "CrossroadKid",
    },
    {
      content: "got rejected from my 3rd interview this week 😭",
      author: "HopeStillHere",
    },
    {
      content:
        "update: I finally got the job!! thank you all for the support last week 🥺",
      author: "SuccessStory__",
    },
    {
      content: "imposter syndrome in my new job is wild",
      author: "NewKidAtWork",
    },
    {
      content: "work-life balance does not exist at my company",
      author: "BurnedOutBro",
    },
    {
      content:
        "internship turned into full time offer!! hard work does pay off eventually",
      author: "GrindPaid",
    },
    {
      content:
        "linkedin is so exhausting. everyone is thriving and I'm just trying to survive",
      author: "ScrollingTired",
    },
  ],
};

const SIM_USERNAMES = [
  "CalmBreeze",
  "QuietMoon",
  "SunnyLeaf",
  "GentleRain",
  "StardustHeart",
  "OceanWaves",
  "WillowTree",
  "NightOwl",
  "RiverFlow",
  "SoftMorning",
];

function getRoomKey(id: string): string {
  if (id.toLowerCase().includes("relation")) return "relationship";
  if (
    id.toLowerCase().includes("mental") ||
    id.toLowerCase().includes("health")
  )
    return "mentalHealth";
  if (id.toLowerCase().includes("stud")) return "studies";
  if (id.toLowerCase().includes("career")) return "career";
  return "mentalHealth";
}

interface MentorMessage {
  id: string;
  text: string;
  isOwn: boolean;
  edited?: boolean;
}

function ChatMessageBubble({
  id,
  text,
  edited,
  onEdit,
  onDelete,
}: {
  id: string;
  text: string;
  edited?: boolean;
  onEdit: (id: string, newText: string) => void;
  onDelete: (id: string) => void;
}) {
  const [showMenu, setShowMenu] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editText, setEditText] = useState(text);
  const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const startLongPress = () => {
    longPressTimer.current = setTimeout(() => setShowMenu(true), 500);
  };
  const cancelLongPress = () => {
    if (longPressTimer.current) clearTimeout(longPressTimer.current);
  };

  const handleSave = () => {
    const trimmed = editText.trim();
    if (!trimmed) return;
    onEdit(id, trimmed);
    setEditing(false);
    setShowMenu(false);
  };

  const handleCancel = () => {
    setEditText(text);
    setEditing(false);
    setShowMenu(false);
  };

  return (
    <div className="flex items-end gap-1 justify-end">
      <AnimatePresence>
        {showMenu && !editing && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 4 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ duration: 0.15 }}
            className="flex flex-col gap-1 mb-1"
          >
            <button
              type="button"
              onClick={() => {
                setEditing(true);
                setShowMenu(false);
              }}
              className="flex items-center gap-1 px-2 py-1 rounded-lg bg-card border border-border shadow-sm text-xs font-semibold text-foreground hover:bg-muted transition-colors"
            >
              <Pencil className="w-3 h-3" /> Edit
            </button>
            <button
              type="button"
              onClick={() => {
                onDelete(id);
                setShowMenu(false);
              }}
              className="flex items-center gap-1 px-2 py-1 rounded-lg bg-card border border-border shadow-sm text-xs font-semibold text-destructive hover:bg-destructive/10 transition-colors"
            >
              <Trash2 className="w-3 h-3" /> Delete
            </button>
          </motion.div>
        )}
      </AnimatePresence>
      <div className="flex flex-col items-end gap-0.5 max-w-[80%]">
        {editing ? (
          <div className="flex flex-col gap-1 w-full">
            <input
              value={editText}
              onChange={(e) => setEditText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleSave();
                if (e.key === "Escape") handleCancel();
              }}
              className="text-sm rounded-xl border border-border px-3 py-1.5 bg-card outline-none focus:ring-1 focus:ring-primary"
              // biome-ignore lint/a11y/noAutofocus: intentional
              autoFocus
            />
            <div className="flex gap-1 justify-end">
              <button
                type="button"
                onClick={handleSave}
                className="flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-bold text-white"
                style={{ background: "oklch(0.72 0.11 355)" }}
              >
                <Check className="w-3 h-3" /> Save
              </button>
              <button
                type="button"
                onClick={handleCancel}
                className="flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-bold bg-muted text-foreground"
              >
                <X className="w-3 h-3" /> Cancel
              </button>
            </div>
          </div>
        ) : (
          <div
            className="px-3 py-2 rounded-2xl text-sm leading-relaxed text-white rounded-br-sm font-medium cursor-pointer select-none"
            style={{
              background:
                "linear-gradient(135deg, oklch(0.72 0.11 355), oklch(0.62 0.10 268))",
            }}
            onMouseDown={startLongPress}
            onMouseUp={cancelLongPress}
            onMouseLeave={cancelLongPress}
            onTouchStart={startLongPress}
            onTouchEnd={cancelLongPress}
            onTouchCancel={cancelLongPress}
          >
            {text}
            {edited && (
              <span className="text-[10px] text-white/60 ml-1">(edited)</span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function getMentorSystemPrompt(mentor: Mentor): string {
  if (mentor.theme === "mentalHealth")
    return "You are Dr. Priya, a warm therapist. You talk like a real person texting, not a robot. 2-3 short sentences. React specifically to what was said. Mix light Hinglish naturally. Never start with 'I understand' or 'I hear you'. No 'as an AI'. Just be present and real.";
  if (mentor.theme === "career")
    return "You are Arjun, an energetic career coach. Super practical, short replies (2-3 sentences). Respond to exactly what the user said. Light Hinglish. No filler phrases like 'great question'. Direct and actionable.";
  if (mentor.theme === "relationship")
    return "You are Sarah, a relationship counselor who texts like a caring friend. 2-3 sentences max. Respond to the specific situation. Warm but direct. No 'I understand how you feel'. Mix in light Hinglish.";
  if (mentor.theme === "studies")
    return "You are Rohan, a relatable study coach. 2-3 short sentences. Respond to exactly what the user shared. Motivating but real — no hollow positivity. Light Hinglish energy.";
  return "You are a warm empathetic counselor who texts like a real friend. 2-3 sentences, specific to what was said. No filler phrases.";
}

function getWelcomeBackMessage(mentor: Mentor, lastUserMsg?: string): string {
  const hint = lastUserMsg
    ? ` Last time you were sharing about "${lastUserMsg.split(" ").slice(0, 5).join(" ")}..."`
    : "";
  if (mentor.theme === "mentalHealth")
    return `Hey, welcome back!${hint} How are you feeling today?`;
  if (mentor.theme === "career")
    return `Hey! Good to see you again.${hint} Ready to keep working through things?`;
  if (mentor.theme === "relationship")
    return `Welcome back!${hint} I'm here whenever you're ready to continue.`;
  if (mentor.theme === "studies")
    return `Hey again!${hint} What's happening today?`;
  return `Welcome back!${hint} What's on your mind?`;
}

function MentorChat({
  mentor,
  onBack,
}: { mentor: Mentor; onBack: () => void }) {
  const storageKey = `mochi_mentor_${mentor.id}`;

  const [allHistory, setAllHistory] = useState<MentorMessage[]>(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        const parsed = JSON.parse(saved) as MentorMessage[];
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {
      /* ignore */
    }
    return [];
  });

  const [messages, setMessages] = useState<MentorMessage[]>([]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // biome-ignore lint/correctness/useExhaustiveDependencies: scroll on change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length, isTyping]);

  useEffect(() => {
    try {
      localStorage.setItem(storageKey, JSON.stringify(allHistory.slice(-80)));
    } catch {
      /* ignore */
    }
  }, [allHistory, storageKey]);

  // biome-ignore lint/correctness/useExhaustiveDependencies: run once on mount
  useEffect(() => {
    if (allHistory.length > 0) {
      const lastUserMsg = [...allHistory].reverse().find((m) => m.isOwn);
      const welcomeText = getWelcomeBackMessage(mentor, lastUserMsg?.text);
      setIsTyping(true);
      const t = setTimeout(() => {
        setMessages([
          { id: `wb-${Date.now()}`, text: welcomeText, isOwn: false },
        ]);
        setIsTyping(false);
      }, 1200);
      return () => clearTimeout(t);
    }
  }, []);

  const handleSend = async () => {
    const trimmed = input.trim();
    if (!trimmed || isTyping || sending) return;
    const userMsg: MentorMessage = {
      id: `u-${Date.now()}`,
      text: trimmed,
      isOwn: true,
    };
    setMessages((prev) => [...prev, userMsg]);
    setAllHistory((prev) => [...prev, userMsg]);
    setInput("");
    // Show typing indicator immediately
    setIsTyping(true);
    setSending(true);
    const hist = [...allHistory, userMsg];
    const history = hist.slice(-10).map((m) => ({
      role: (m.isOwn ? "user" : "model") as "user" | "model",
      text: m.text,
    }));
    const reply = await callGemini(
      getMentorSystemPrompt(mentor),
      history,
      trimmed,
    );
    const fallbacks: Record<string, string> = {
      mentalHealth: "I'm here for you. Tell me more about what's going on 💜",
      career: "I'm listening! Tell me more about what's happening 💼",
      relationship: "I'm here with you. What else can you share? 💕",
      studies: "I got you! Tell me more about what's going on academically 📚",
    };
    const replyText = reply ?? fallbacks[mentor.theme] ?? "I'm here for you 💜";
    const replyMsg: MentorMessage = {
      id: `m-${Date.now()}`,
      text: replyText,
      isOwn: false,
    };
    setMessages((p) => [...p, replyMsg]);
    setAllHistory((p) => [...p, replyMsg]);
    setIsTyping(false);
    setSending(false);
  };

  const handleEditMsg = (id: string, newText: string) => {
    const updater = (prev: MentorMessage[]) =>
      prev.map((m) =>
        m.id === id ? { ...m, text: newText, edited: true } : m,
      );
    setMessages(updater);
    setAllHistory(updater);
  };

  const handleDeleteMsg = (id: string) => {
    const updater = (prev: MentorMessage[]) => prev.filter((m) => m.id !== id);
    setMessages(updater);
    setAllHistory(updater);
  };

  return (
    <div className="flex flex-col h-[calc(100vh-5rem)]">
      <header className="flex items-center gap-3 px-4 pt-12 pb-3 bg-background sticky top-0 z-10 border-b border-border">
        <button
          type="button"
          data-ocid="mentor_chat.close_button"
          onClick={onBack}
          className="p-1 rounded-full hover:bg-muted transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="w-9 h-9 rounded-full flex-shrink-0 overflow-hidden">
          <img
            src={mentor.avatar}
            alt={mentor.name}
            className="w-full h-full object-cover"
          />
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-1">
            <h2 className="font-bold text-sm">{mentor.name}</h2>
            <BadgeCheck className="w-4 h-4 text-secondary fill-secondary/20" />
          </div>
          <p className="text-xs text-muted-foreground">
            {isTyping ? (
              <span className="text-primary font-semibold">typing...</span>
            ) : (
              mentor.specialty
            )}
          </p>
        </div>
        <span className="text-[10px] font-bold text-emerald-600 bg-emerald-100 px-2 py-0.5 rounded-full">
          Online
        </span>
      </header>
      <div className="flex items-center justify-center gap-1 py-1">
        <Lock className="w-2.5 h-2.5 text-muted-foreground" />
        <span className="text-[10px] text-muted-foreground">
          End-to-end encrypted
        </span>
      </div>
      <div
        className="flex-1 overflow-y-auto px-4 py-3 space-y-2"
        data-ocid="mentor_chat.panel"
      >
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full gap-3 text-center px-6 pb-12">
            <div className="w-16 h-16 rounded-full overflow-hidden">
              <img
                src={mentor.avatar}
                alt={mentor.name}
                className="w-full h-full object-cover"
              />
            </div>
            <h3 className="font-bold text-foreground">{mentor.name}</h3>
            <p className="text-xs text-muted-foreground">{mentor.bio}</p>
            <p className="text-xs text-muted-foreground italic">
              Send a message to start your session
            </p>
          </div>
        )}
        {messages.map((msg) => (
          <motion.div
            key={msg.id}
            initial={{ opacity: 0, y: 8, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
            className={`flex ${msg.isOwn ? "justify-end" : "justify-start"}`}
          >
            {msg.isOwn ? (
              <ChatMessageBubble
                id={msg.id}
                text={msg.text}
                edited={msg.edited}
                onEdit={handleEditMsg}
                onDelete={handleDeleteMsg}
              />
            ) : (
              <div className="max-w-[80%] px-3 py-2 rounded-2xl text-sm leading-relaxed bg-muted text-foreground rounded-bl-sm">
                {msg.text}
              </div>
            )}
          </motion.div>
        ))}
        <AnimatePresence>
          {isTyping && (
            <motion.div
              key="typing"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="flex justify-start"
              data-ocid="mentor_chat.loading_state"
            >
              <div className="bg-muted rounded-2xl rounded-bl-sm px-4 py-3 flex items-center gap-1.5">
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
        <div ref={messagesEndRef} />
      </div>
      <div className="flex gap-2 px-4 py-3 bg-background border-t border-border">
        <Input
          data-ocid="mentor_chat.input"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSend()}
          placeholder="Share what's on your mind..."
          className="rounded-full text-sm"
          disabled={isTyping || sending}
        />
        <button
          type="button"
          data-ocid="mentor_chat.submit_button"
          onClick={handleSend}
          disabled={!input.trim() || isTyping || sending}
          className="w-10 h-10 rounded-full flex items-center justify-center text-white transition-all active:scale-95 disabled:opacity-50 flex-shrink-0"
          style={{
            background:
              "linear-gradient(135deg, oklch(0.72 0.11 355), oklch(0.62 0.10 268))",
          }}
        >
          {sending ? (
            <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
          ) : (
            <Send className="w-4 h-4" />
          )}
        </button>
      </div>
    </div>
  );
}

function ChatRoom({
  room,
  onBack,
}: { room: (typeof ROOMS)[0]; onBack: () => void }) {
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { data: messages = [] } = useGetChatMessages(room.id);
  const addMessage = useAddChatMessage();
  const roomKey = getRoomKey(String(room.id));
  const pool = ROOM_MESSAGES[roomKey] ?? ROOM_MESSAGES.mentalHealth;

  const [simMessages, setSimMessages] = useState(() =>
    pool.slice(0, 8).map((m, i) => ({ ...m, id: `sim-init-${i}` })),
  );
  const [userMessages, setUserMessages] = useState<
    {
      id: string;
      content: string;
      author: string;
      isOwn: boolean;
      edited?: boolean;
    }[]
  >([]);
  const [onlineCount, setOnlineCount] = useState(room.members);
  const [simTypingUser, setSimTypingUser] = useState<string | null>(null);

  useEffect(() => {
    const interval = setInterval(() => {
      const delta = Math.floor(Math.random() * 4) + 2;
      const sign = Math.random() > 0.5 ? 1 : -1;
      setOnlineCount((prev) =>
        Math.max(room.members - 20, prev + sign * delta),
      );
    }, 45000);
    return () => clearInterval(interval);
  }, [room.members]);

  useEffect(() => {
    if (messages.length > 0) return;
    const scheduleNext = () => {
      const delay = 6000 + Math.random() * 9000;
      return setTimeout(() => {
        const randomMsg = pool[Math.floor(Math.random() * pool.length)];
        const randomUser =
          SIM_USERNAMES[Math.floor(Math.random() * SIM_USERNAMES.length)];
        setSimTypingUser(`${randomUser} is typing...`);
        setTimeout(
          () => {
            setSimTypingUser(null);
            setSimMessages((prev) => [
              ...prev,
              {
                content: randomMsg.content,
                author: randomMsg.author,
                id: `sim-${Date.now()}`,
              },
            ]);
          },
          2000 + Math.random() * 1000,
        );
      }, delay);
    };
    let timer = scheduleNext();
    const interval = setInterval(() => {
      timer = scheduleNext();
    }, 16000);
    return () => {
      clearTimeout(timer);
      clearInterval(interval);
    };
  }, [pool, messages.length]);

  // biome-ignore lint/correctness/useExhaustiveDependencies: scroll on messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [simMessages.length, messages.length, userMessages.length, simTypingUser]);

  const handleSend = () => {
    if (!message.trim() || sending) return;
    const msgContent = message.trim();
    setMessage("");
    setSending(true);
    setUserMessages((prev) => [
      ...prev,
      {
        id: `user-${Date.now()}`,
        content: msgContent,
        author: "You",
        isOwn: true,
      },
    ]);
    addMessage.mutate(
      { category: room.id, content: msgContent },
      {
        onSuccess: () => setSending(false),
        onError: () => setSending(false),
      },
    );
  };

  const handleEditUserMsg = (id: string, newText: string) => {
    setUserMessages((prev) =>
      prev.map((m) =>
        m.id === id ? { ...m, content: newText, edited: true } : m,
      ),
    );
  };
  const handleDeleteUserMsg = (id: string) => {
    setUserMessages((prev) => prev.filter((m) => m.id !== id));
  };

  const displayMessages =
    messages.length > 0
      ? [
          ...messages.map((m, i) => ({
            id: String(i),
            content: m.content,
            author: "Anonymous",
            isOwn: false,
          })),
          ...userMessages,
        ]
      : [...simMessages, ...userMessages];

  return (
    <div className="flex flex-col h-[calc(100vh-5rem)]">
      <header className="flex items-center gap-3 px-4 pt-12 pb-3 bg-background sticky top-0 z-10 border-b border-border">
        <button
          type="button"
          data-ocid="chat.close_button"
          onClick={onBack}
          className="p-1 rounded-full hover:bg-muted transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div
          className={`w-9 h-9 rounded-full bg-gradient-to-br ${room.color} flex items-center justify-center text-xl`}
        >
          {room.emoji}
        </div>
        <div>
          <h2 className="font-bold text-sm">{room.name}</h2>
          <p className="text-xs text-muted-foreground">{onlineCount} online</p>
        </div>
      </header>
      <div className="flex items-center justify-center gap-1 py-1">
        <Lock className="w-2.5 h-2.5 text-muted-foreground" />
        <span className="text-[10px] text-muted-foreground">
          End-to-end encrypted
        </span>
      </div>
      <div
        className="flex-1 overflow-y-auto px-4 py-3 space-y-2"
        data-ocid="chat.panel"
      >
        {displayMessages.map((msg, i) => {
          const isOwn = (msg as { isOwn?: boolean }).isOwn === true;
          const key = (msg as { id?: string }).id ?? String(i);
          const author = isOwn ? "You" : (msg as { author: string }).author;
          const msgEdited = (msg as { edited?: boolean }).edited;
          const msgId = (msg as { id?: string }).id ?? String(i);
          return (
            <motion.div
              key={String(key)}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2 }}
              className={`flex ${isOwn ? "justify-end" : "justify-start"}`}
            >
              {isOwn ? (
                <ChatMessageBubble
                  id={msgId}
                  text={msg.content}
                  edited={msgEdited}
                  onEdit={handleEditUserMsg}
                  onDelete={handleDeleteUserMsg}
                />
              ) : (
                <div className="max-w-[75%] px-3 py-2 rounded-2xl text-sm font-medium bg-muted text-foreground rounded-bl-sm">
                  <p className="text-[10px] font-bold text-muted-foreground mb-0.5">
                    {author}
                  </p>
                  {msg.content}
                </div>
              )}
            </motion.div>
          );
        })}
        <AnimatePresence>
          {simTypingUser && (
            <motion.div
              key="sim-typing"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="flex justify-start"
            >
              <div className="bg-muted/60 rounded-2xl rounded-bl-sm px-3 py-2">
                <p className="text-[10px] font-bold text-muted-foreground mb-1">
                  {simTypingUser}
                </p>
                <div className="flex items-center gap-1">
                  {[0, 1, 2].map((i) => (
                    <span
                      key={i}
                      className="w-1.5 h-1.5 rounded-full bg-muted-foreground/50"
                      style={{
                        animation: `mochi-bounce 1.2s ease-in-out ${i * 0.2}s infinite`,
                      }}
                    />
                  ))}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        <div ref={messagesEndRef} />
      </div>
      <div className="flex gap-2 px-4 py-3 bg-background border-t border-border">
        <Input
          data-ocid="chat.input"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSend()}
          placeholder="Share your thoughts..."
          className="rounded-full text-sm"
          disabled={sending}
        />
        <button
          type="button"
          data-ocid="chat.submit_button"
          onClick={handleSend}
          disabled={!message.trim() || sending}
          className="w-10 h-10 rounded-full flex items-center justify-center text-white transition-all active:scale-95 disabled:opacity-50 flex-shrink-0"
          style={{
            background:
              "linear-gradient(135deg, oklch(0.72 0.11 355), oklch(0.62 0.10 268))",
          }}
        >
          {sending ? (
            <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
          ) : (
            <Send className="w-4 h-4" />
          )}
        </button>
      </div>
    </div>
  );
}

function TabBar({
  active,
  onChange,
}: { active: SubTab; onChange: (t: SubTab) => void }) {
  const tabs: { id: SubTab; label: string }[] = [
    { id: "rooms", label: "Chat Rooms" },
    { id: "mentors", label: "Mentors" },
    { id: "ai", label: "Mochi AI" },
  ];
  return (
    <div className="flex mx-4 mb-4 bg-muted rounded-2xl p-1">
      {tabs.map(({ id, label }) => (
        <button
          key={id}
          type="button"
          data-ocid={`chat.${id}.tab`}
          onClick={() => onChange(id)}
          className={`flex-1 py-2 rounded-xl text-sm font-bold flex items-center justify-center gap-1 transition-all duration-200 ${
            active === id
              ? "bg-card text-foreground shadow-xs"
              : "text-muted-foreground"
          }`}
        >
          {id === "ai" && <Sparkles className="w-3.5 h-3.5" />}
          {label}
        </button>
      ))}
    </div>
  );
}

export default function ChatTab() {
  const [subTab, setSubTab] = useState<SubTab>("rooms");
  const [openRoom, setOpenRoom] = useState<(typeof ROOMS)[0] | null>(null);
  const [openMentor, setOpenMentor] = useState<Mentor | null>(null);

  if (openRoom) {
    return <ChatRoom room={openRoom} onBack={() => setOpenRoom(null)} />;
  }

  if (openMentor) {
    return (
      <MentorChat mentor={openMentor} onBack={() => setOpenMentor(null)} />
    );
  }

  if (subTab === "ai") {
    return <AIChat onBack={() => setSubTab("rooms")} />;
  }

  return (
    <div className="flex flex-col">
      <header className="px-4 pt-12 pb-3 bg-background">
        <h1 className="text-xl font-black text-foreground">Community</h1>
        <p className="text-sm text-muted-foreground">
          You're not alone here 💜
        </p>
      </header>

      <TabBar active={subTab} onChange={setSubTab} />

      <AnimatePresence mode="wait">
        {subTab === "rooms" && (
          <motion.div
            key="rooms"
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 10 }}
            className="px-4 space-y-3"
          >
            {ROOMS.map((room, i) => (
              <motion.button
                type="button"
                key={room.id}
                data-ocid={`chat.room.item.${i + 1}`}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.06 }}
                onClick={() => setOpenRoom(room)}
                className="w-full text-left bg-card rounded-2xl p-4 shadow-card border border-border hover:shadow-card-hover transition-all duration-200 active:scale-[0.98]"
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${room.color} flex items-center justify-center text-2xl`}
                  >
                    {room.emoji}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <h3 className="font-bold text-sm text-foreground">
                        {room.name}
                      </h3>
                      <span
                        className={`text-xs font-semibold ${room.accentColor}`}
                      >
                        {room.members} online
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {room.desc}
                    </p>
                  </div>
                </div>
              </motion.button>
            ))}
          </motion.div>
        )}

        {subTab === "mentors" && (
          <motion.div
            key="mentors"
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -10 }}
            className="px-4 space-y-3"
          >
            {MENTORS.map((mentor, i) => (
              <motion.button
                type="button"
                key={mentor.id}
                data-ocid={`chat.mentor.item.${i + 1}`}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.06 }}
                onClick={() => setOpenMentor(mentor)}
                className="w-full text-left bg-card rounded-2xl p-4 shadow-card border border-border hover:shadow-card-hover transition-all duration-200 active:scale-[0.98]"
              >
                <div className="flex items-start gap-3">
                  <div className="w-12 h-12 rounded-full flex-shrink-0 overflow-hidden">
                    <img
                      src={mentor.avatar}
                      alt={mentor.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="font-bold text-sm text-foreground">
                        {mentor.name}
                      </span>
                      <BadgeCheck className="w-4 h-4 text-secondary fill-secondary/20" />
                    </div>
                    <span className="text-xs font-semibold text-primary">
                      {mentor.specialty}
                    </span>
                    <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                      {mentor.bio}
                    </p>
                    <div className="flex items-center gap-3 mt-2">
                      <span className="text-xs text-amber-500 font-bold">
                        &#9733; {mentor.rating}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {mentor.sessions} sessions
                      </span>
                    </div>
                  </div>
                </div>
              </motion.button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
      <div className="pb-6" />
    </div>
  );
}
