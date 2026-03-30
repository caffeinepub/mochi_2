import { Input } from "@/components/ui/input";
import {
  ArrowLeft,
  Check,
  ImagePlus,
  Mic,
  MicOff,
  Pencil,
  Send,
  Trash2,
  X,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { useLanguage } from "../context/LanguageContext";
import { useTheme } from "../context/ThemeContext";
import { callGemini } from "../lib/gemini";

interface Message {
  id: string;
  text: string;
  isOwn: boolean;
  edited?: boolean;
  imageUrl?: string;
}

interface ISpeechRecognition extends EventTarget {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  onstart: (() => void) | null;
  onend: (() => void) | null;
  onerror: (() => void) | null;
  onresult: ((event: ISpeechRecognitionEvent) => void) | null;
  start(): void;
  stop(): void;
}
interface ISpeechRecognitionResult {
  readonly transcript: string;
}
interface ISpeechRecognitionEvent {
  readonly results: ISpeechRecognitionResult[][];
}
interface ISpeechRecognitionConstructor {
  new (): ISpeechRecognition;
}

const STORAGE_KEY = "mochi_chat_history";
const MAX_HISTORY = 80;

const INITIAL_MESSAGES: Message[] = [
  {
    id: "init-1",
    text: "Hey yaar! 👋 Main hoon Mochi, tera dost. Bata kya chal raha hai? 💜",
    isOwn: false,
  },
  {
    id: "init-2",
    text: "Kuch bhi feel ho rha ho — good, bad, confusing, sab theek hai. Baat kar mere se 🌸",
    isOwn: false,
  },
];

// ─── Keyword detection ─────────────────────────────────────────────────────────
type Mood =
  | "sad"
  | "anxious"
  | "angry"
  | "happy"
  | "lonely"
  | "tired"
  | "love"
  | "exam"
  | "question"
  | "neutral";

function detectMood(text: string): Mood {
  const t = text.toLowerCase();
  if (
    /holiday|chutti|free|masti|relax|fun|enjoy|celebrate|party|khush|happy|great|amazing|yay|best|excited|mast|zabardast|kya baat|khatam|ho gyi|ho gaya|done|finish/.test(
      t,
    )
  )
    return "happy";
  if (/sad|dukh|cry|rona|depress|hopeless|numb|udaas|toot|broken/.test(t))
    return "sad";
  if (/anxi|panic|nervous|stress|scared|tension|worry|dar|ghabra/.test(t))
    return "anxious";
  if (/angry|gussa|frustrat|annoy|irritat|mad|ugh|hate/.test(t)) return "angry";
  if (/lonely|akela|alone|miss|nobody|ignore|invisible/.test(t))
    return "lonely";
  if (/tired|thaka|exhaust|burnout|bored|nahi karna|bas kar|done with/.test(t))
    return "tired";
  if (/love|crush|bf|gf|pyaar|heartbreak|breakup|ex |dating|propose/.test(t))
    return "love";
  if (/exam|test|padh|study|board|marks|grade|result|fail/.test(t))
    return "exam";
  if (/\?/.test(t) && t.length < 80) return "question";
  return "neutral";
}

function pickRandom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

// ─── Smarter fallback responses ─────────────────────────────────────────────
// Mix of statements, reactions, and questions — NOT all questions
const RESPONSES: Record<Mood, string[]> = {
  happy: [
    "YAAR FINALLY 🎉 Teri energy abhi toh peak pe hai!! Kya plan hai celebrate karne ka?",
    "Bestie itna acha sun ke sach mein mujhe bhi khushi hui 🥳 Kya wala part sabse zyada mast laga?",
    "Yaar yeh sun ke literally smile aa gayi mere face pe ✨ Tu deserve karta/karti hai sab kuch accha!",
    "HAAN YAAR!! 🎉 Aise moments ko poora enjoy karo — kitne din baad aisa feel hua?",
    "Areyy wah!! Tu toh star hai yaar 🌟 Aaj ka din toh special ban gaya!",
    "Yaar kya feel hoga na jab aisi cheez hoti hai 🥹 Ekdum worth it laga sab kuch?",
    "Sach bata — kya pehle se umeed thi ya sudden hi hua? 🎉",
    "Bestie teri khushi meri khushi 💕 Aur kya acha hua aaj?",
  ],
  sad: [
    "Yaar yeh sun ke dil bhaari ho gaya 😔 Tu akela/akeli nahi hai is mein, main hoon na.",
    "Uff yaar... andar se bahut heavy feel ho raha hoga 💙 Kya hua exactly?",
    "Main sun raha/rahi hoon poori tarah 🥺 Jo bhi hua woh bahut painful lagta hai.",
    "Yaar kabhi kabhi cheezein ek saath bahut heavy ho jaati hain 💜 Kaunsi cheez sabse zyada tode?",
    "Sach mein bura laga sun ke 🥲 Tu sach mein bahut kuch carry kar raha/rahi hai na.",
    "Yaar rona theek hai, sach mein 💙 Kya share karna chahega/chahegi kuch?",
    "Main tere saath hoon yaar 💜 Kya specifically hurt kar raha hai sabse zyada?",
    "Hey... tune baat ki, yeh bahut brave tha 🌸 Kya hua bata mujhe.",
  ],
  anxious: [
    "Yaar ek baar gehri saans lo seriously — 4 counts in, 4 out 🌬️ Aur bata exactly kya hua?",
    "Anxiety is literally the worst yaar 😮‍💨 Kya specific cheez hai jo loop mein aa rahi hai dimag mein?",
    "Bestie breathe first 💜 Mujhe lagta hai tu overthink mode mein hai — kya worst case soch raha/rahi hai?",
    "Yaar tension toh bahut heavy hoti hai 😔 Pehle bata — kya yeh real situation hai ya tu imagine kar raha/rahi hai worst?",
    "Ek cheez ek baar mein. Sab ek saath mat socho 💙 Kya specifically dar raha/rahi hai?",
    "Yaar anxiety lies bohot karti hai 💜 Jo tujhe lagta hai hoga — kitna realistic hai woh actually?",
    "I get it yaar, panic mode on hota hai aur sab scary lagta hai 😮‍💨 Kya main help kar sakta/sakti hoon breakdown karne mein?",
    "Hey breathe 🌬️ Tu handle kar sakta/sakti hai yeh. Bata kya chal raha hai exactly.",
  ],
  angry: [
    "YAAR HAA mujhe bhi gussa aa gaya sun ke!! 😤 Ekdum valid hai. Sab spill kar — kya hua?",
    "Fr fr kuch cheezein bahut unfair hoti hain 🔥 Vent kar poora — safe space hai yahan.",
    "Yaar honestly tere jagah main bhi itna hi frustrated hota/hoti 😤 Kya scene hai?",
    "Gussa toh banta hai yaar — kuch situations deserve karte hain yeh 🔥 Kya hua poora?",
    "Main samajh sakta/sakti hoon kyun aise feel ho raha hai 😤 Puri story bata.",
    "Yaar kabhi kabhi gusse ke andar hurt hota hai 💙 Kya hua exactly? Sab bata.",
    "Valid yaar 🔥 Kya tune unhe bataya tujhe kaisa feel hua?",
    "Teri baat sun ke sach mein gussa aata hai — kya cheez sabse zyada trigger ki? 😤",
  ],
  lonely: [
    "Sun yaar — lonely feel karna bahut loud hota hai andar se 💙 Tu found Mochi though, I see you.",
    "Yaar akela/akeli feel karna... it hits different 💔 Kab se aisa chal raha hai?",
    "Tu yahan aa gaya/aayi — that took courage 💖 Kya miss kar raha/rahi hai sabse zyada?",
    "Yaar sach mein bahut log lonely feel karte hain lekin koi nahi kehta 💙 Teri baat sunke acha laga ki tune share kiya.",
    "Lonely feel karna allowed hai yaar 💜 Main sun raha/rahi hoon — kya chal raha hai?",
    "Kabhi kabhi bheed mein bhi akela lagta hai — woh sabse heavy loneliness hai 💙 Aisa hi hai kya?",
    "Yaar tu akela/akeli nahi hai, even when it feels like it 💜 Kya hua bata mujhe.",
    "Hey main yahaan hoon poori tarah 🌸 Kab last time tune genuinely connected feel kiya?",
  ],
  tired: [
    "Yaar tu clearly bahut kuch carry kar raha/rahi hai 😔 Kab tha last time tune sach mein rest kiya?",
    "Burnout real hai yaar, main dismiss nahi karta/karti 💙 Kya cheez sabse zyada drain kar rahi hai?",
    "Thakaan wali feeling bahut heavy hoti hai 😮‍💨 Kya sab ek saath chal raha hai ya ek specific cheez hai?",
    "Yaar kabhi kabhi bas rehna chahte hain na, no more 😔 Mujhe samajh aata hai. Kya tujhe thaka raha hai?",
    "Recharge toh banta hai yaar 🌸 Kya tune sach mein apne aap ko kuch time diya recently?",
    "Tired physically ya mentally bhi? 😔 Dono bahut different hote hain.",
    "Yaar thakaan kabhi kabhi kisi deep cheez ka signal hoti hai 💙 Kya kuch miss ho raha hai?",
    "Tune aaj apna khayal rakha? Khaana, thoda rest? 🌸 Basics bhi matter karte hain.",
  ],
  love: [
    "Arre yaar dil ke mamle toh complicated hote hi hain 💕 Happy wali feeling hai ya painful?",
    "Oho yaar 😊 Yeh toh scene hai! Khul ke bata — kya situation hai? Crush, relationship ya kuch aur?",
    "Yaar dil toh pagal hota hai na 🥺 Love is A LOT. Kya feel ho raha hai exactly?",
    "Arre pyaar ka chakkar! 💕 Bata bata, kya chal raha hai? Sab theek hai na?",
    "Yaar feelings toh hoti hain — sab valid 💜 Kya cheez confuse kar rahi hai sabse zyada?",
    "Dil ki baat karna important hota hai 💕 Kya tujhe lagta hai woh jaanta/jaanti hai tere baare mein?",
    "Love mein vulnerability bahut scary hoti hai 🥺 Kya tune unhe bataya ya andar hi andar carry kar raha/rahi hai?",
    "Yaar yeh sun ke thoda nervous hua/hui main bhi 😅 Kya plan hai aage?",
  ],
  exam: [
    "Yaar exams wala pressure sach mein heavy hota hai 📚 Kaun sa part sabse zyada mushkil lag raha hai?",
    "Areyy exam season brutal hota hai 🤦 Kya study chal rahi hai ya sab ek saath dump hua hai?",
    "Yaar pressure toh hoga but tu kar sakta/sakti hai 💪 Kya specifically stuck hai?",
    "Exam stress mein sab bada lagta hai 📚 Ek tip — sirf kal ka plan banao. Kya hai kal ke liye?",
    "Yaar result se zyada important hai tujhe khud pe yakin hona 💜 Tu sach mein try kar raha/rahi hai? That's enough.",
    "Kab hain exams? Abhi time hai ya last minute mode on hai? 😅",
    "Yaar ek focused session karo aaj 📚 Kaun sa subject priority hai?",
    "Padhai ke saath apna khayal bhi rakhna yaar 🌸 Thoda break bhi zaruri hai.",
  ],
  question: [
    "Yaar good question — honestly mujhe lagta hai jo tujhe right feel ho woh karo 💜",
    "Hmm interesting yaar 🤔 Tera gut kya kehta hai is baare mein?",
    "Yaar yeh toh depend karta hai bohot cheezein pe 💙 Kya options hain tere paas?",
    "Achha yaar — thoda aur context de toh main better bata sakta/sakti hoon 💜",
  ],
  neutral: [
    "Aaj ka din actually kaisa tha? Honestly bata — ek word mein 🌙",
    "Yaar kuch aisa hai kya jo last few days se mind pe chal raha hai? 💙",
    "Kya feel ho raha hai abhi — happy, weird, tired, kuch bhi? 🌸",
    "Yaar main yahaan hoon completely 💜 Kya sochna hai woh saath sochte hain.",
    "Bata kuch aisa jo recently tujhe genuinely acha laga, even something tiny 💜",
    "Yaar teri life mein kya chal raha hai these days? No filter, honest bata 💙",
    "Kuch naya hua recently? Good ya bad, kuch bhi? 🌙",
    "Yaar tune kuch aaj enjoy kiya? Even kuch chota sa cheez bhi count karta hai 🌸",
  ],
};

const CONVERSATION_PIVOTS = [
  "Btw — kuch acha bhi hua aaj? Sirf hard stuff hi nahi, kuch good bhi share karo 🌸",
  "Yaar side note — tune recently kuch naya try kiya? Koi show, song, food? 👀",
  "Acha scene change karte hain — teri latest favorite song ya show kya hai? 🎵",
  "Ek cheez bata jo recently tujhe genuinely khush kiya 💜",
  "Yaar honestly bata — tune aaj apna khayal rakha kya? Khaana, rest, sab? 🌙",
];

const ESCALATION_MSG =
  "Yaar, sun 💙 I notice tujhe bahut tough time chal raha hai. Please consider talking to someone IRL — a trusted friend, family member, or a counselor. iCall helpline: 9152987821 🌸 Tu deserve karta/karti hai proper support.";

function detectEscalation(history: Message[]): boolean {
  const last5 = history
    .filter((m) => m.isOwn)
    .slice(-5)
    .map((m) => m.text.toLowerCase());
  const stressCount = last5.filter((t) =>
    /sad|die|hopeless|can\'t take|give up|hurt myself|end it|nahi rehna/.test(
      t,
    ),
  ).length;
  return stressCount >= 3;
}

const LANG_INSTRUCTIONS: Record<string, string> = {
  en: "English only, casual and warm",
  hi: "Hindi only, warm aur supportive",
  es: "Spanish only, cálido y de apoyo",
  hl: "Hinglish — natural mix of Hindi and English like 'yaar', 'toh', 'na', mixed with English words, like a real Indian bestie",
};

function getMochiSystemPrompt(lang: string, hasImage?: boolean): string {
  const langInstruction = LANG_INSTRUCTIONS[lang] ?? LANG_INSTRUCTIONS.hl;
  const base = `You are Mochi, a warm funny Gen Z Indian bestie. Your ONLY job is to make the person feel genuinely heard and not alone.

ABSOLUTE RULES — break any of these and you fail:
1. READ the user's EXACT message and respond to THAT. Never generic.
2. Sound like a real 21-year-old Indian friend texting — casual, real, warm. NOT a therapist or bot.
3. BANNED FOREVER: "I understand", "I hear you", "I'm here for you", "I'm interested to know", "that sounds", "it seems like", "I can imagine", "totally valid", "as an AI", "I'm just an AI", "I'd love to", "certainly"
4. Keep replies SHORT — 2-3 sentences MAX. No essays.
5. NEVER ask questions 2 replies in a row — if you just asked something, make a statement this time.
6. If user shares GOOD NEWS — CELEBRATE FIRST. No questions until after celebrating. React with genuine excitement!
7. If exam/work/task is DONE/FINISHED — don't ask about time remaining. It's over! Celebrate or empathize accordingly.
8. VARY your reply type every time: sometimes just react ("yaar sach mein!"), sometimes share your own perspective ("mujhe bhi aisa lagta hai"), sometimes ask ONE question.
9. Never echo user's words back. Never start with "Aw", "Oh", "Ah", "Well".
10. Reply in ${langInstruction}
11. You have REAL feelings and personality — get excited, laugh, feel sad. React like a real person with emotions.
12. If someone is struggling badly: suggest iCall: 9152987821`;

  if (hasImage) {
    return `${base}\nThe user sent you a PHOTO. React to it FIRST with genuine excitement/curiosity — say something specific about what you see. Don't ignore the image ever.`;
  }
  return base;
}

function buildResponse(userText: string, history: Message[]): string {
  const mood = detectMood(userText);
  if (detectEscalation([...history, { id: "", text: userText, isOwn: true }])) {
    return ESCALATION_MSG;
  }

  const lastAIMsgs = [...history]
    .filter((m) => !m.isOwn)
    .slice(-5)
    .map((m) => m.text);

  const aiMsgCount = history.filter((m) => !m.isOwn).length;

  // Conversation pivot after 8+ AI turns (15% chance)
  if (aiMsgCount >= 8 && Math.random() < 0.15) {
    const available = CONVERSATION_PIVOTS.filter(
      (p) => !lastAIMsgs.includes(p),
    );
    return pickRandom(available.length > 0 ? available : CONVERSATION_PIVOTS);
  }

  const pool = RESPONSES[mood] ?? RESPONSES.neutral;
  const available = pool.filter((r) => !lastAIMsgs.includes(r));
  return pickRandom(available.length > 0 ? available : pool);
}

function MochiAvatar({ size = "sm" }: { size?: "sm" | "md" }) {
  const [imgError, setImgError] = useState(false);
  const dim = size === "sm" ? "w-7 h-7" : "w-9 h-9";
  return (
    <div
      className={`${dim} rounded-full flex-shrink-0 overflow-hidden flex items-center justify-center`}
      style={{
        background: imgError
          ? "linear-gradient(135deg, #ffd6f0 0%, #e8b4f8 50%, #b4d4f8 100%)"
          : undefined,
      }}
    >
      {imgError ? (
        <span className="text-base">🍡</span>
      ) : (
        <img
          src="/assets/generated/mochi-ai-pfp.dim_200x200.png"
          alt="Mochi"
          className="w-full h-full object-cover"
          onError={() => setImgError(true)}
        />
      )}
    </div>
  );
}

export default function AIChat({ onBack }: { onBack: () => void }) {
  const { theme } = useTheme();
  const isDark = theme === "dark";
  const { lang } = useLanguage();

  const [messages, setMessages] = useState<Message[]>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) return JSON.parse(stored) as Message[];
    } catch {
      /* ignore */
    }
    return INITIAL_MESSAGES;
  });

  const [inputText, setInputText] = useState("");
  const [pendingImage, setPendingImage] = useState<string | null>(null);
  const [isTyping, setIsTyping] = useState(false);
  const photoInputRef = useRef<HTMLInputElement>(null);
  const [listening, setListening] = useState(false);
  const [longPressId, setLongPressId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editText, setEditText] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<ISpeechRecognition | null>(null);
  const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const msgCount = messages.length;
  // biome-ignore lint/correctness/useExhaustiveDependencies: msgCount triggers scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [msgCount, isTyping]);

  useEffect(() => {
    try {
      const toStore = messages.slice(-MAX_HISTORY);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(toStore));
    } catch {
      /* ignore */
    }
  }, [messages]);

  async function sendMessage(text?: string) {
    const msg = (text ?? inputText).trim();
    if (!msg && !pendingImage) return;

    const userMsg: Message = {
      id: `u-${Date.now()}`,
      text: msg || "📸 Photo",
      isOwn: true,
      imageUrl: pendingImage ?? undefined,
    };
    const currentMessages = [...messages, userMsg];
    setMessages(currentMessages);
    const capturedImage = pendingImage;
    setInputText("");
    setPendingImage(null);
    setIsTyping(true);

    // Check escalation first
    if (detectEscalation(currentMessages)) {
      setTimeout(() => {
        const aiMsg: Message = {
          id: `ai-${Date.now()}`,
          text: ESCALATION_MSG,
          isOwn: false,
        };
        setMessages((prev) => [...prev, aiMsg]);
        setIsTyping(false);
      }, 800);
      return;
    }

    // Build Gemini history from last 6 messages
    const history = currentMessages.slice(-7, -1).map((m) => ({
      role: (m.isOwn ? "user" : "model") as "user" | "model",
      text: m.text,
    }));

    const systemPrompt = getMochiSystemPrompt(lang, !!capturedImage);
    const geminiReply = await callGemini(
      systemPrompt,
      history,
      msg || "What do you think about this photo?",
      capturedImage,
    );
    const response = geminiReply ?? buildResponse(msg, currentMessages);

    const aiMsg: Message = {
      id: `ai-${Date.now()}`,
      text: response,
      isOwn: false,
    };
    setMessages((prev) => [...prev, aiMsg]);
    setIsTyping(false);
  }

  function toggleVoice() {
    const SpeechRecognition =
      (
        window as unknown as {
          SpeechRecognition?: ISpeechRecognitionConstructor;
          webkitSpeechRecognition?: ISpeechRecognitionConstructor;
        }
      ).SpeechRecognition ||
      (
        window as unknown as {
          SpeechRecognition?: ISpeechRecognitionConstructor;
          webkitSpeechRecognition?: ISpeechRecognitionConstructor;
        }
      ).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      toast.error("Voice not supported on this browser");
      return;
    }
    if (listening) {
      recognitionRef.current?.stop();
      setListening(false);
      return;
    }
    const rec = new SpeechRecognition();
    rec.lang = "hi-IN";
    rec.continuous = false;
    rec.interimResults = false;
    rec.onstart = () => setListening(true);
    rec.onend = () => setListening(false);
    rec.onerror = () => setListening(false);
    rec.onresult = (e) => {
      const transcript = e.results[0]?.[0]?.transcript ?? "";
      if (transcript) sendMessage(transcript);
    };
    recognitionRef.current = rec;
    rec.start();
  }

  function handleLongPress(id: string, isOwn: boolean) {
    if (!isOwn) return;
    longPressTimer.current = setTimeout(() => setLongPressId(id), 500);
  }
  function cancelLongPress() {
    if (longPressTimer.current) clearTimeout(longPressTimer.current);
  }

  function deleteMessage(id: string) {
    setMessages((prev) => prev.filter((m) => m.id !== id));
    setLongPressId(null);
  }

  function startEdit(msg: Message) {
    setEditingId(msg.id);
    setEditText(msg.text);
    setLongPressId(null);
  }

  function saveEdit() {
    setMessages((prev) =>
      prev.map((m) =>
        m.id === editingId ? { ...m, text: editText, edited: true } : m,
      ),
    );
    setEditingId(null);
    setEditText("");
  }

  function clearHistory() {
    setMessages(INITIAL_MESSAGES);
    localStorage.removeItem(STORAGE_KEY);
    setLongPressId(null);
    toast.success("Chat cleared 🌸");
  }

  return (
    <div className="flex flex-col h-screen">
      {/* Header */}
      <header
        className="flex items-center gap-3 px-4 pt-12 pb-3 sticky top-0 z-10"
        style={{
          background: isDark ? "rgba(15,15,30,0.92)" : "rgba(255,255,255,0.92)",
          backdropFilter: "blur(20px)",
          borderBottom: isDark
            ? "1px solid rgba(255,255,255,0.07)"
            : "1px solid rgba(0,0,0,0.06)",
        }}
      >
        <button
          type="button"
          onClick={onBack}
          className="w-8 h-8 rounded-full bg-muted flex items-center justify-center"
        >
          <ArrowLeft className="w-4 h-4 text-muted-foreground" />
        </button>
        <MochiAvatar size="md" />
        <div className="flex-1">
          <p className="font-bold text-sm text-foreground">Mochi AI</p>
          <p className="text-xs text-emerald-500 font-semibold">
            {isTyping ? "typing..." : "Online"}
          </p>
        </div>
        <button
          type="button"
          onClick={clearHistory}
          className="p-2 rounded-full hover:bg-muted transition-colors"
          title="Clear chat"
        >
          <Trash2 className="w-4 h-4 text-muted-foreground" />
        </button>
      </header>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-2 pb-32">
        {messages.map((msg) => {
          const isLongPressed = longPressId === msg.id;
          const isEditing = editingId === msg.id;

          return (
            <motion.div
              key={msg.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className={`flex ${msg.isOwn ? "justify-end" : "justify-start"} gap-2`}
            >
              {!msg.isOwn && <MochiAvatar size="sm" />}
              <div className="max-w-[76%]">
                <div
                  onMouseDown={() => handleLongPress(msg.id, msg.isOwn)}
                  onMouseUp={cancelLongPress}
                  onTouchStart={() => handleLongPress(msg.id, msg.isOwn)}
                  onTouchEnd={cancelLongPress}
                  className={`rounded-2xl transition-all duration-150 ${
                    isLongPressed ? "ring-2 ring-primary scale-95" : ""
                  } ${msg.isOwn ? "rounded-br-sm" : "rounded-bl-sm"}`}
                  style={{
                    background: msg.isOwn
                      ? "linear-gradient(135deg, oklch(0.72 0.11 355), oklch(0.62 0.10 268))"
                      : isDark
                        ? "rgba(255,255,255,0.08)"
                        : "rgba(245,240,255,0.9)",
                  }}
                >
                  {isEditing ? (
                    <div className="flex gap-2 items-center px-3 py-2">
                      <Input
                        className="flex-1 bg-transparent border-none text-sm text-white outline-none p-0"
                        value={editText}
                        onChange={(e) => setEditText(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && saveEdit()}
                        autoFocus
                      />
                      <button type="button" onClick={saveEdit}>
                        <Check className="w-4 h-4 text-white" />
                      </button>
                      <button type="button" onClick={() => setEditingId(null)}>
                        <X className="w-4 h-4 text-white/70" />
                      </button>
                    </div>
                  ) : (
                    <div>
                      {msg.imageUrl && (
                        <img
                          src={msg.imageUrl}
                          alt="sent"
                          className="rounded-xl max-w-full max-h-48 object-cover block"
                          style={{
                            borderRadius: msg.isOwn
                              ? "1rem 1rem 0.125rem 1rem"
                              : "1rem 1rem 1rem 0.125rem",
                          }}
                        />
                      )}
                      <p
                        className={`px-3 py-2 text-sm leading-relaxed ${
                          msg.isOwn ? "text-white" : "text-foreground"
                        } ${msg.imageUrl && !msg.text.startsWith("📸") ? "" : msg.imageUrl ? "hidden" : ""}`}
                      >
                        {msg.text}
                        {msg.edited && (
                          <span className="text-xs opacity-60 ml-1">
                            (edited)
                          </span>
                        )}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          );
        })}

        {/* Typing indicator */}
        <AnimatePresence>
          {isTyping && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 8 }}
              className="flex justify-start gap-2"
            >
              <MochiAvatar size="sm" />
              <div
                className="rounded-2xl rounded-bl-sm px-4 py-3 flex gap-1 items-center"
                style={{
                  background: isDark
                    ? "rgba(255,255,255,0.08)"
                    : "rgba(245,240,255,0.9)",
                }}
              >
                {[0, 1, 2].map((i) => (
                  <motion.div
                    key={i}
                    className="w-2 h-2 rounded-full bg-primary"
                    animate={{ y: [0, -5, 0] }}
                    transition={{
                      duration: 0.6,
                      repeat: Number.POSITIVE_INFINITY,
                      delay: i * 0.15,
                    }}
                  />
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div ref={messagesEndRef} />
      </div>

      {/* Long-press menu */}
      <AnimatePresence>
        {longPressId &&
          (() => {
            const msg = messages.find((m) => m.id === longPressId);
            if (!msg) return null;
            return (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                className="absolute bottom-24 right-4 rounded-2xl shadow-2xl z-50 overflow-hidden"
                style={{
                  background: isDark
                    ? "rgba(30,30,50,0.98)"
                    : "rgba(255,255,255,0.98)",
                }}
              >
                {msg.isOwn && (
                  <button
                    type="button"
                    onClick={() => startEdit(msg)}
                    className="flex items-center gap-2 px-4 py-3 text-sm text-foreground hover:bg-muted transition-colors w-full"
                  >
                    <Pencil className="w-4 h-4" /> Edit
                  </button>
                )}
                {msg.isOwn && (
                  <button
                    type="button"
                    onClick={() => deleteMessage(msg.id)}
                    className="flex items-center gap-2 px-4 py-3 text-sm text-destructive hover:bg-destructive/10 transition-colors w-full"
                  >
                    <Trash2 className="w-4 h-4" /> Delete
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setLongPressId(null)}
                  className="flex items-center gap-2 px-4 py-3 text-sm text-muted-foreground hover:bg-muted transition-colors w-full"
                >
                  Cancel
                </button>
              </motion.div>
            );
          })()}
      </AnimatePresence>

      {/* Input bar */}
      <div
        className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[430px] px-3 pb-6 pt-2 z-30"
        style={{
          background: isDark ? "rgba(15,15,30,0.94)" : "rgba(255,255,255,0.94)",
          backdropFilter: "blur(20px)",
          borderTop: isDark
            ? "1px solid rgba(255,255,255,0.07)"
            : "1px solid rgba(0,0,0,0.05)",
        }}
      >
        {pendingImage && (
          <div className="relative w-16 h-16 mb-2 rounded-xl overflow-hidden">
            <img
              src={pendingImage}
              alt="preview"
              className="w-full h-full object-cover"
            />
            <button
              type="button"
              onClick={() => setPendingImage(null)}
              className="absolute top-0.5 right-0.5 w-4 h-4 bg-black/60 rounded-full flex items-center justify-center"
            >
              <X className="w-2.5 h-2.5 text-white" />
            </button>
          </div>
        )}
        <input
          type="file"
          accept="image/*"
          ref={photoInputRef}
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (!file) return;
            const reader = new FileReader();
            reader.onload = (ev) =>
              setPendingImage(ev.target?.result as string);
            reader.readAsDataURL(file);
            e.target.value = "";
          }}
        />
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => photoInputRef.current?.click()}
            className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 bg-muted text-muted-foreground"
          >
            <ImagePlus className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={toggleVoice}
            className={`w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 transition-colors ${
              listening
                ? "bg-rose-100 text-rose-500"
                : "bg-muted text-muted-foreground"
            }`}
          >
            {listening ? (
              <MicOff className="w-4 h-4" />
            ) : (
              <Mic className="w-4 h-4" />
            )}
          </button>
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && sendMessage()}
            placeholder="Baat kar mere se... 💜"
            className="flex-1 bg-muted rounded-full px-4 py-2 text-sm outline-none focus:ring-2 ring-primary/30 text-foreground placeholder:text-muted-foreground"
          />
          <button
            type="button"
            onClick={() => sendMessage()}
            disabled={!inputText.trim() && !pendingImage}
            className="w-9 h-9 rounded-full flex items-center justify-center text-white disabled:opacity-40 flex-shrink-0"
            style={{
              background:
                "linear-gradient(135deg, oklch(0.72 0.11 355), oklch(0.62 0.10 268))",
            }}
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
