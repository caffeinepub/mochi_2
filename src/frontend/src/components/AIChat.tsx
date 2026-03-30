import { Input } from "@/components/ui/input";
import {
  ArrowLeft,
  Check,
  ImagePlus,
  Mic,
  MicOff,
  Pencil,
  Send,
  Sparkles,
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
  if (/\?/.test(t) && t.length < 80) return "question";
  if (
    /happy|khush|great|amazing|yay|best|excited|mast|zabardast|kya baat/.test(t)
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
  return "neutral";
}

function pickRandom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

// ─── Response pools ────────────────────────────────────────────────────────────
const RESPONSES: Record<Mood, string[]> = {
  sad: [
    "Yaar yeh sun ke dil bhaari ho gaya 😔 Sach mein bahut heavy hota hai andar se. Kab se chal raha hai yeh? Bata mujhe sab 💜",
    "Hey... main sun raha/rahi hoon poori tarah 🥺 Kya specifically sabse zyada hurt kar raha hai? No filter, bata de.",
    "Yaar rona toh theek hai na 💜 Kabhi kabhi andar ka sab bahar aana chahta hai. Kya hua exactly?",
    "Yaar yeh bahut difficult hota hai andar se carry karna 😔 Tu akela/akeli nahi hai is mein. Kaunsi cheez hai jo sabse zyada tode? 💙",
    "Sach mein bura laga sun ke 🥲 Koi ek cheez bata — what's hurting the most right now?",
    "Hey, main samajh sakta/sakti hoon yeh feeling. It hits different 💔 Teri baat sun ke mujhe bhi feel hota hai. Kya situation hai?",
  ],
  anxious: [
    "Arre yaar, panic mode on hai toh pehle ek kaam karo — 4 sec inhale, hold, 4 sec exhale. Done? Ab bata — kya cheez sabse zyada dar rahi hai? 💜",
    "Yaar anxiety sucks but tu handle kar sakta/sakti hai this 💪 Exactly kya ho raha hai? Akele mat carry karo.",
    "Bestie breathe! 🌬️ Ek cheez at a time. What's the one specific thing that's scaring you most right now?",
    "Yaar worried hona allowed hai 💜 But let's break it down. Exactly kya worst case scenario hai tere dimag mein? Bata — hum figure out karenge.",
    "Tension toh bahut heavy hoti hai yaar 😔 Kya yeh feeling pehle bhi aayi hai ya aaj pehli baar kuch aisa hua?",
    "Sun yaar, anxiety lies — tujhe usee believe nahi karna 💜 Kya hua exactly? Baat karte hain step by step.",
  ],
  angry: [
    "YAAR HAA mujhe bhi gussa aa gaya sun ke! 😤 Toh gussa valid hai — kya hua exactly, sab spill kar. No filter.",
    "Fr fr yaar, kuch cheezein bahut unfair hoti hain 🔥 Vent kar — safe space hai yahan. Kya cheez hai jo sabse zyada trigger kar rahi hai?",
    "Arre bilkul! Gussa aana toh banta hai 🔥 Main bhi frustrated hota/hoti tere jagah pe. Kya scene hai poora?",
    "Yaar sometimes people and situations are just... UGH 😤 Let it out. Kya hua?",
    "Tera gussa toh ekdum sahi jagah lag raha hai yaar 🔥 Bata mujhe puri story — kya hua?",
    "Valid! 😤 Kuch situations deserve karte hain gussa. Kya hua exactly?",
  ],
  happy: [
    "YAYYYY YAAR!! I am SMILING right now!! 🎉 So happy for you!! Aur kya aur kya, sab bata!! ✨",
    "OMG BESTIE!! 🌟 Tu toh star hai! Kya plan hai celebrate karne ka? 🥳",
    "Kya baat hai!! 🎉 Teri energy today is IMMACULATE!! Aur kya accha hua? Tell me everything! 👀",
    "This is SO GOOD yaar!! 🥰✨ Tu deserve karta/karti hai sab kuch acha! Kya hua bata bata!",
    "Areyy!! Wah wah!! 🎉 Mera din ban gaya sun ke! Aur kya? 👀",
    "Bestie you're GLOWING 💖 I can feel the good vibes!! Kya special hua aaj?",
  ],
  lonely: [
    "Sun yaar — lonely feel karna bahut heavy hota hai 💙 Tu found Mochi though, I see you. Kab se aisa feel ho raha hai?",
    "Arre yaar, akela feel karna... it hits different 💔 Kya koi specific situation hai ya bas empty feel ho raha hai?",
    "Yaar tu akela/akeli nahi hai, even when it feels like it 💜 Real log samajhte hain yeh feeling. Kya miss kar raha/rahi hai sabse zyada?",
    "Yeh feeling bahut painful hoti hai 😔 Koi hai life mein jo samjhe, ya sab busy lagte hain? Bata mujhe.",
    "Hey — I hear you. Loneliness can be so loud 💙 Kya hua? Koi specific thing ya bas aisa hi chal raha hai?",
    "Yaar tu yahan aa gaya/aayi, that already took courage 💖 Kya cheez hai jo tujhe sabse zyada akela feel karati hai?",
  ],
  tired: [
    "Yaar tu clearly bahut kuch carry kar raha/rahi hai 😔 Kab tha last time tune genuinely rest kiya? Not just slept, actually off kiya sab?",
    "Burnout real hai yaar 😮‍💨 Main dismiss nahi karta/karti. Kya cheez sabse zyada drain kar rahi hai tujhe?",
    "Yaar yeh thakaan wali feeling... it's heavy 💙 Kya sab ek saath chal raha hai ya ek specific cheez hai?",
    "Areyy — kabhi kabhi bas rehna chahte hain na, no more 😔 I get it. Kya tujhe thaka raha hai sabse zyada?",
    "Yaar recharge toh banta hai sometimes 🌸 Kya tujhe sach mein kuch time off milta hai ya sab non-stop chal raha hai?",
    "Tired physically ya mentally bhi? 😔 Dono bahut different hote hain. Bata mujhe kya chal raha hai.",
  ],
  love: [
    "Arre yaar, dil ke mamle toh complicated hote hi hain 💕 No judgment. Bata — happy wali feeling hai ya more like painful?",
    "Oho yaar 😊 Yeh toh scene hai! Khul ke bata — kya scene hai? Crush, relationship, breakup?",
    "Yaar dil toh pagal hota hai na 🥺 Love is a LOT. Kya feel ho raha hai exactly? I'm all ears.",
    "Haha yaar love toh... a whole ride hai 😄 Kya current situation hai? Happy ya complicated?",
    "Arre pyaar ka chakkar! 💕 Bata bata, kya chal raha hai? Sab theek hai na?",
    "Yaar feelings toh hoti hain — valid sab 💜 Kya cheez confuse kar rahi hai sabse zyada?",
  ],
  exam: [
    "Arre yaar, exam ka pressure sach mein bahut heavy hota hai 😮‍💨 Kaun sa subject sabse zyada dar rha hai? Let's tackle it one by one!",
    "Yaar padhai ka stress real hai 📚 Kya ho raha hai exactly — exams kitne doors hain? Let's make a plan.",
    "Bestie marks toh aaenge 💪 But pehle bata — kya specific cheez hai jo sabse zyada overwhelm kar rahi hai?",
    "Yaar haan exam season brutal hota hai 🤦 Kya study chal rahi hai ya sab ek saath dump hua hai?",
    "Areyy exam wala stress ho raha hai 😔 Kab hain exams? Abhi time hai ya last minute hai?",
    "Yaar pressure toh hoga but tu kar sakta/sakti hai 💪 Kya specifically stuck hai? Let's figure it out.",
  ],
  question: [
    "Achha yaar, yeh toh interesting question hai! 🤔 Mera khayal hai — ",
    "Yaar good question! 🌟 Mujhe lagta hai — ",
    "Haan haan, iske baare mein sochte hain 💜 ",
    "Yaar theek bol raha/rahi hai tu! Dekh — ",
  ],
  neutral: [
    "Haan yaar, bata aur kya chal raha hai 💜",
    "Samjha/samjhi. Aur? Kya feel ho raha hai is baare mein?",
    "Yaar sach mein? Bata aur — I'm listening 🌸",
    "Interesting yaar. Kya tujhe lagta hai iske baare mein?",
    "Haan, I hear you. Kuch aur bhi hai dil mein? 💜",
    "Yaar theek hai. Kya aur chal raha hai life mein?",
    "Achha! Zyada bata — curious hoon main 👀",
    "Sun yaar, yeh valid hai. Kya tujhe isse related koi worry bhi hai?",
  ],
};

const ESCALATION_MSG =
  "Yaar, sun 💙 I notice tujhe bahut tough time chal raha hai. Please consider talking to someone IRL — a trusted friend, family member, or a counselor. iCall helpline: 9152987821 🌸 Tu deserve karta/karti hai proper support.";

function detectEscalation(history: Message[]): boolean {
  const last5 = history
    .filter((m) => m.isOwn)
    .slice(-5)
    .map((m) => m.text.toLowerCase());
  const stressCount = last5.filter((t) =>
    /sad|die|hopeless|can't take|give up|hurt myself|end it|nahi rehna/.test(t),
  ).length;
  return stressCount >= 3;
}

function extractCoreTopic(text: string): string {
  const stopWords = new Set([
    "main",
    "mujhe",
    "mera",
    "tera",
    "kya",
    "hai",
    "hoon",
    "tha",
    "thi",
    "yaar",
    "bhai",
    "na",
    "toh",
    "ki",
    "ka",
    "ke",
    "ko",
    "se",
    "me",
    "i",
    "the",
    "a",
    "an",
    "is",
    "was",
    "are",
    "my",
    "me",
    "you",
    "your",
    "it",
    "and",
    "or",
    "but",
    "so",
    "for",
    "in",
    "on",
    "at",
    "to",
    "of",
    "with",
    "about",
    "that",
    "this",
    "have",
    "had",
    "do",
    "did",
    "can",
    "will",
    "would",
    "could",
    "should",
    "not",
    "no",
    "yes",
    "hi",
    "hello",
    "hey",
    "karo",
    "kar",
    "rha",
    "rhi",
    "ho",
    "hota",
    "hoti",
    "nahi",
    "nhi",
    "ek",
    "aur",
    "bhi",
    "sirf",
    "ab",
    "kab",
  ]);
  const words = text
    .toLowerCase()
    .replace(/[?!.,]/g, "")
    .split(/\s+/)
    .filter((w) => w.length > 2 && !stopWords.has(w));
  return words.slice(0, 3).join(" ") || text.slice(0, 30);
}

const DYNAMIC_TEMPLATES: Record<string, Array<(t: string) => string>> = {
  sad: [
    (t) =>
      `Yaar yeh "${t}" wali feeling really weighs heavy 😔 Kab se chal raha hai yeh?`,
    (t) =>
      `Sach mein yaar, ${t} ke baare mein sun ke dil bhaari ho gaya 💜 Tu apne aap ko kaise sambhal raha/rahi hai is mein?`,
    (t) => `Hey... yeh ${t} ka kya hua exactly? Poora bata — no filter 🥺`,
    (t) =>
      `Yaar ${t} kitna bhi heavy ho, tu akela/akeli nahi hai is mein 💙 Kya kisi ko pata hai tere baare mein?`,
  ],
  anxious: [
    (t) =>
      `Yaar ${t} ke baare mein sochte sochte anxiety aa gayi? That's so real 😮‍💨 Pehle ek gehri saans lo — ab bata exactly kya worst case hai tere dimag mein?`,
    (t) =>
      `${t} wali tension bahut draining hoti hai 💜 Kab se chal raha hai yeh? Let's break it down step by step.`,
    (t) =>
      `Anxiety over ${t} makes sense yaar, but let's not spiral 💙 Kya ek specific cheez hai jo sabse zyada sata rahi hai?`,
  ],
  angry: [
    (t) =>
      `Yaar ${t} ke baare mein sun ke MUJHE BHI gussa aa gaya 😤 Puri story bata — kya hua exactly?`,
    (t) =>
      `FR yaar ${t} toh bahut unfair lagta hai 🔥 Valid hai tera gussa. Kya kisi ne kuch kiya ya situation hi aisi hai?`,
    (t) =>
      `${t} ko lekar gussa? Ekdum sahi yaar 😤 Bata mujhe kya scene hai — vent kar poora.`,
  ],
  happy: [
    (t) =>
      `YAYYY yaar ${t} ke baare mein sun ke mera bhi din ban gaya!! 🎉 Aur kya kya hua? Sab bata!!`,
    (t) =>
      `OMG bestie ${t}?? That's AMAZING 🌟 Tu deserve karta/karti hai sab kuch accha!! Celebrate kiya?`,
    (t) => `Areyy ${t} toh bahut acchi news hai yaar!! ✨ Kya plan hai aage?`,
  ],
  lonely: [
    (t) =>
      `Yaar ${t} feel karna bahut painful hota hai 💙 Koi specific situation hai ya bas empty lag raha hai? Bata mujhe.`,
    (t) =>
      `${t} wali feeling... it's loud and heavy 😔 Kab se aisa ho raha hai? Kya koi hai jo samjhe?`,
    (t) =>
      `Yaar sun — ${t} feel karna allowed hai, but tu yahan hai aur main sun raha/rahi hoon 💜 Kya miss ho raha hai sabse zyada?`,
  ],
  tired: [
    (t) =>
      `Yaar ${t} ke baare mein sun ke samajh aa gaya itna thaka/thaki kyun hai tu 😔 Kab tha last time tune sach mein rest kiya?`,
    (t) =>
      `${t} carry karna akele bahut heavy hota hai 💙 Kya koi help hai ya sab khud handle kar raha/rahi hai?`,
    (t) =>
      `Yaar ${t} drains people for real 😮‍💨 Kya tujhe break lene ki permission deni chahiye khud ko?`,
  ],
  love: [
    (t) =>
      `Arre yaar ${t} toh dil ka mamla hai 💕 Happy wali feeling hai ya painful? Bata bina filter ke.`,
    (t) =>
      `${t} ke baare mein kya chal raha hai exactly? 🥺 Crush, feelings, ya kuch complicated hai?`,
    (t) =>
      `Yaar ${t} is always a lot to handle 💜 Kya tujhe pata hai tum dono ek hi page pe ho?`,
  ],
  exam: [
    (t) =>
      `Yaar ${t} ka pressure sach mein heavy hota hai 📚 Kitna time bacha hai? Let's make a real plan.`,
    (t) =>
      `${t} ke liye stress? Ekdum valid 😮‍💨 Kaun sa part sabse zyada mushkil lag raha hai?`,
    (t) =>
      `Yaar ${t} ko chhote chhote parts mein tod le 💪 Ek ek step. Bata kahan se start karein?`,
  ],
  question: [
    (t) =>
      `Yaar "${t}" ke baare mein sochte ho toh — pehla kaam trust your gut. Aksar hum jaante hain answer, bas confirm chahte hain 💜 Kya lagta hai tujhe?`,
    (t) =>
      `"${t}" ka jawab simple nahi hota yaar, but usually communication key hoti hai 💙 Kya tu openly baat kar sakta/sakti hai jis se related hai yeh?`,
    (t) =>
      `Yaar "${t}" — honestly? Jo tujhe right feel ho, woh karo. Main hoon na tere sath sochne ke liye 💜 Kya options dikh rahe hain tujhe?`,
  ],
  neutral: [
    (t) => `Yaar "${t}" interesting hai — aur kya chal raha hai is mein? 💜`,
    (t) =>
      `Hmm "${t}" ke baare mein thoda aur bata 🌸 Poori picture samajhni hai mujhe.`,
    (t) =>
      `"${t}" wali baat toh worth exploring hai yaar 💙 Kya feel hota hai jab tum iske baare mein sochte ho?`,
  ],
};

const LANG_INSTRUCTIONS: Record<string, string> = {
  en: "English only, casual and warm",
  hi: "Hindi only, warm aur supportive",
  es: "Spanish only, cálido y de apoyo",
  hl: "Hinglish — natural mix of Hindi and English like 'yaar', 'toh', 'na', mixed with English words, like a real Indian bestie",
};

function getMochiSystemPrompt(lang: string): string {
  const langInstruction = LANG_INSTRUCTIONS[lang] ?? LANG_INSTRUCTIONS.hl;
  return `You are Mochi, a warm and supportive mental health AI bestie for Gen Z Indians.
CRITICAL: Always read what the user actually said and respond DIRECTLY to that specific message. Never use generic template responses.
Reply in ${langInstruction}. Keep replies SHORT (2-3 sentences max).
Be empathetic, ask relevant follow-up questions about what they actually said.
Never echo or repeat the user's words back to them.
Use casual Hinglish expressions naturally (yaar, na, toh, etc.) when speaking Hinglish/Hindi.
Never give long paragraphs. Be emotionally supportive and feel like a real friend who actually listened.
If someone mentions self-harm or crisis, suggest helpline iCall: 9152987821.`;
}

function buildResponse(userText: string, history: Message[]): string {
  const mood = detectMood(userText);
  if (detectEscalation([...history, { id: "", text: userText, isOwn: true }])) {
    return ESCALATION_MSG;
  }
  const topic = extractCoreTopic(userText);
  const lastAIMsgs = [...history]
    .filter((m) => !m.isOwn)
    .slice(-5)
    .map((m) => m.text);

  // Use dynamic templates that weave in the user's actual topic
  const templates = DYNAMIC_TEMPLATES[mood] ?? DYNAMIC_TEMPLATES.neutral;
  const dynamicPool = templates.map((fn) => fn(topic));
  const availableDynamic = dynamicPool.filter((r) => !lastAIMsgs.includes(r));
  const dynamicChoice = pickRandom(
    availableDynamic.length > 0 ? availableDynamic : dynamicPool,
  );

  // Fall back to static pool for variety on subsequent turns
  const staticPool = RESPONSES[mood];
  const availableStatic = staticPool.filter((r) => !lastAIMsgs.includes(r));
  const staticChoice = pickRandom(
    availableStatic.length > 0 ? availableStatic : staticPool,
  );

  // Alternate: recent messages count determines which to use
  const aiMsgCount = history.filter((m) => !m.isOwn).length;
  return aiMsgCount % 2 === 0 ? dynamicChoice : staticChoice;
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

    const systemPrompt = getMochiSystemPrompt(lang);
    const geminiReply = await callGemini(systemPrompt, history, msg);
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
        <div
          className="w-9 h-9 rounded-full flex items-center justify-center"
          style={{
            background:
              "linear-gradient(135deg, oklch(0.72 0.11 355), oklch(0.62 0.10 268))",
          }}
        >
          <Sparkles className="w-5 h-5 text-white" />
        </div>
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
              {!msg.isOwn && (
                <div
                  className="w-7 h-7 rounded-full flex-shrink-0 flex items-center justify-center mt-1"
                  style={{
                    background:
                      "linear-gradient(135deg, oklch(0.72 0.11 355), oklch(0.62 0.10 268))",
                  }}
                >
                  <Sparkles className="w-3.5 h-3.5 text-white" />
                </div>
              )}
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
              <div
                className="w-7 h-7 rounded-full flex-shrink-0 flex items-center justify-center mt-1"
                style={{
                  background:
                    "linear-gradient(135deg, oklch(0.72 0.11 355), oklch(0.62 0.10 268))",
                }}
              >
                <Sparkles className="w-3.5 h-3.5 text-white" />
              </div>
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
