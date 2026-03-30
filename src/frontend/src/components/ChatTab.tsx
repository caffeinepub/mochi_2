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
import AIChat from "./AIChat";
import FriendsTab from "./FriendsTab";

type SubTab = "rooms" | "mentors" | "ai" | "friends";

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

// Per-room message pools
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
      content: "love bombing is real and i wish i had recognized it sooner",
      author: "RiverFlow__",
    },
    {
      content: "sending everyone here healing and love 💕",
      author: "SoftMorning",
    },
    {
      content:
        "genuinely cannot stop thinking about someone who doesn't even know i exist lol kill me",
      author: "AutumnLeaf_",
    },
    {
      content:
        "just needed to say — it does get better after a breakup. took me 6 months but here i am",
      author: "NewChapter99",
    },
    {
      content:
        "my partner doesn't understand my anxiety at all and it makes me feel so alone in this relationship",
      author: "QuietStorm__",
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
      content:
        "the hardest part is when people tell you to just 'think positive' like okay thanks",
      author: "StormClouds_",
    },
    {
      content:
        "finally told my mom about my depression. she cried and hugged me. i wasn't expecting that",
      author: "TenderHeart",
    },
    {
      content:
        "does anyone else feel guilty for having a bad day even when 'nothing is wrong'?",
      author: "MistyMorning",
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
        "my anxiety tells me everything is wrong but also nothing specific. its so frustrating",
      author: "WavesCrash",
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
      content:
        "anyone else feel like they're the only one who doesn't understand the material?",
      author: "PencilDust",
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
        "comparison culture in college is so toxic. everyone pretending they don't study then acing everything",
      author: "TiredStudent",
    },
    {
      content:
        "taking a gap year was the best decision of my life for anyone considering it",
      author: "FreeRange22",
    },
    {
      content:
        "can't focus at all lately. been staring at the same page for an hour",
      author: "FoggyHead_",
    },
    {
      content:
        "my professor actually pulled me aside to check if I was okay. didn't expect to cry but here we are",
      author: "NotOkayKing",
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
        "dropped a class today and felt relief not failure. sometimes thats the right move",
      author: "BetterPath__",
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
      content:
        "got rejected from my 3rd interview this week 😭 starting to think maybe im the problem",
      author: "HopeStillHere",
    },
    {
      content:
        "update: I finally got the job!! thank you all for the support last week 🥺",
      author: "SuccessStory__",
    },
    {
      content: "my boss is driving me insane someone help",
      author: "ToxicWorkplace",
    },
    {
      content:
        "should I quit my toxic job or just push through and save money first?",
      author: "StuckInPlace",
    },
    {
      content:
        "imposter syndrome in my new job is wild. everyone seems so much more competent than me",
      author: "NewKidAtWork",
    },
    {
      content:
        "degree meant nothing for my job search. 6 months of rejection then got hired through a connection",
      author: "RealTalk99",
    },
    {
      content:
        "my passion and my paycheck are two completely different things and it's lowkey depressing",
      author: "DreamVsReality",
    },
    {
      content:
        "anyone made a major career switch in their late 20s? how do you deal with starting over?",
      author: "NewChapterNow",
    },
    {
      content:
        "work-life balance does not exist at my company. I work evenings and weekends and nobody notices",
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
    {
      content:
        "asked for a raise after 2 years, got told 'maybe next quarter' for the 3rd time",
      author: "Undervalued__",
    },
    {
      content: "freelancing is lonely but at least my boss doesn't suck lol",
      author: "SoloCreator__",
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
  "EmptyCanvas",
  "HealingSlowly",
  "TenderHeart",
  "MistyMorning",
  "NightBloom",
  "BlueBook",
  "PencilDust",
  "FocusMachine",
  "CrossroadKid",
  "SoloCreator",
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

// ─── Mentor response engine ───────────────────────────────────────────────────

interface MentorMessage {
  id: string;
  text: string;
  isOwn: boolean;
  edited?: boolean;
}

// ─── ChatMessageBubble with edit/delete ───────────────────────────────────────

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

const MENTOR_RESPONSES: Record<string, Record<string, string[]>> = {
  mentalHealth: {
    anxiety: [
      "That makes a lot of sense. Anxiety has this way of making everything feel urgent and overwhelming at the same time. Can I ask — how long has this been going on for you?",
      "I hear you. What you're describing sounds really exhausting — when your mind won't let you rest. One thing I often explore with people is what the anxiety is actually trying to protect you from. Have you thought about that?",
      "You're not alone in feeling this way. I've worked with so many young adults who describe exactly what you're saying. The first thing I'd want to know — does it come in waves or is it more constant?",
      "That takes courage to say out loud. Genuinely. A lot of people carry anxiety silently for years. What does it feel like in your body when it hits?",
      "I want to understand this better. When you say you feel anxious — is it more like a racing heart, or more like a dread that sits in your chest? The distinction actually matters for how we work with it.",
    ],
    depression: [
      "Thank you for trusting me with this. Depression is one of those things that convinces you it's just 'who you are' — but it isn't. It's something that's happening to you, not something you are. How long have you been feeling this way?",
      "I hear you. That flatness you're describing — where nothing feels good even when it 'should' — is one of the hardest things to explain to people who haven't felt it. You don't have to justify it to me.",
      "Can I ask — is there anything that gives you even a small moment of relief? Doesn't have to be big. Sometimes that's where we start.",
      "You're doing something really brave by reaching out. A lot of people with depression don't — because the depression itself tells them it won't help. What made you decide to talk today?",
      "That makes complete sense. When you've been running on empty for a while, even basic things start to feel impossible. I'd love to understand more about your day-to-day — what does a typical day look like for you right now?",
    ],
    general: [
      "I'm glad you reached out. What's been weighing on you most lately?",
      "That sounds really hard. I want to make sure I understand — can you tell me a little more about what's been going on?",
      "You're in the right place. There's no pressure here to have it all figured out. What feels most important to talk about today?",
      "I've been working with young adults for years, and one thing I've learned is that the things we dismiss as 'not a big deal' are often exactly what needs attention. What's on your mind?",
    ],
    greeting: [
      "I'm so glad you're here. Just the act of opening this chat takes courage. How are you actually doing — not the surface answer, the real one?",
      "Hey! Really glad you reached out to me. There's no agenda here, no rush. What's on your mind today?",
    ],
    lonely: [
      "Loneliness is one of the most painful human experiences — and one of the most minimized. You're not being dramatic. When did this feeling start?",
      "I hear you. Sometimes loneliness hits hardest even when people are around you, right? Is that what this feels like?",
    ],
    angry: [
      "Anger is almost always a signal about something deeper — a boundary that got crossed, a need that went unmet. What happened?",
      "I'm not going to tell you to calm down. Anger has something to say. What set it off?",
    ],
    thanks: [
      "I'm really glad this helped, even a little. You're doing the work by showing up and talking. That matters. 💜",
      "Of course. You deserve this support. Come back anytime.",
    ],
    bye: [
      "Take care of yourself, okay? You can always come back here whenever you need. 🌸",
      "It was really good talking with you. Remember — you're stronger than this feels right now. Bye for now 💜",
    ],
  },
  career: {
    lost: [
      "Feeling lost about your career is more common than you'd think — and honestly, it often means you're paying attention to what actually matters to you. What did you imagine yourself doing when you were younger?",
      "I work with a lot of people at this exact crossroads. Before we talk about what to do, I'm curious — what's the feeling underneath the confusion? Is it more like fear, or more like boredom, or something else?",
      "Here's a question I ask everyone who comes to me feeling lost: when you imagine your ideal Monday morning, what does it look like? Not the job title — the actual feeling of the work.",
      "That uncertainty is uncomfortable, but it's also useful information. It means the path you're on isn't quite right. Can you tell me more about what's been pulling at you?",
    ],
    rejection: [
      "Three rejections in a row is genuinely demoralizing. I want you to know that doesn't mean what your brain is probably telling you it means. Job searching is brutal and largely random. How are you holding up emotionally?",
      "Rejection stings — there's no way around that. But I want to ask something: are you getting rejected before or after interviews? That distinction tells us a lot about what to work on.",
      "I hear the discouragement in what you're saying. Can I ask — what kind of roles have you been applying to? Sometimes the issue isn't you at all, it's a mismatch between the role and how you're presenting yourself.",
      "The hardest part of job searching is that rejection feels personal even when it almost never is. What's your gut feeling about where things are breaking down?",
    ],
    toxic: [
      "A toxic work environment takes a real toll — on your mood, your health, your sense of self. I don't take that lightly. How long have you been in this situation?",
      "This is one of the most common things I hear. People stay in difficult workplaces for all kinds of reasons — financial, fear of starting over, hoping it'll get better. What's making it hard to leave?",
      "Before I give any advice, I want to understand — when you say toxic, can you describe what that actually looks like day to day? Everyone's situation is different.",
    ],
    general: [
      "I'm glad you reached out. Career questions can feel so isolating — like you should just know what to do. What's on your mind?",
      "There's no wrong place to start. Tell me what's going on with work right now and we'll figure out where to focus.",
      "I've helped a lot of people navigate exactly this kind of uncertainty. What feels most stuck for you right now?",
    ],
    greeting: [
      "Hey! Great to see you here. Career stuff can feel so isolating — like you're supposed to have it all figured out. What's going on?",
      "Yo! I'm Arjun. No fluff, no generic advice — let's actually dig into what's happening with your career. What's the situation?",
    ],
    lonely: [
      "Feeling isolated in your career journey is super common, especially in your 20s. Everyone else looks like they have it together. What does your situation look like right now?",
    ],
    thanks: [
      "Hey, that's all you — I just asked the right questions. Keep that momentum going 💼",
      "Anytime! You've got this. Come back whenever you need to think something through.",
    ],
    bye: [
      "Go get it! And remember — progress over perfection. Catch you next time 🚀",
      "Alright! Keep moving forward. You know where to find me.",
    ],
  },
  relationship: {
    breakup: [
      "Breakups are one of the most disorienting experiences a person can go through — even when you knew it was coming. How recent is this, and how are you sleeping?",
      "I hear you. There's this strange grief that comes with losing someone who's still alive, still existing, just no longer yours. That's real and it deserves to be taken seriously. What's been the hardest part?",
      "One thing I often see is people rushing to 'get over it' before they've actually processed what happened. Can I ask — do you understand why it ended? Not just the reason given, but what you actually think?",
      "The urge to check their social media, to replay conversations — that's your brain trying to make sense of something that doesn't quite make sense yet. How long has it been since the breakup?",
    ],
    conflict: [
      "Conflict in close relationships is almost always about something underneath the surface issue. What's the thing you two keep fighting about?",
      "I want to understand both sides here. When the argument happens — what do you feel like you need from them that you're not getting?",
      "Communication patterns in relationships are so much easier to see from the outside. Tell me what a typical argument looks like — who says what, how it starts, how it ends.",
    ],
    family: [
      "Family dynamics are some of the most complex work I do. The history runs so deep. What's the relationship been like, and what specifically has been hard lately?",
      "There's something uniquely painful about conflict with family — because they're people we love and also people who know exactly how to hurt us. What's going on?",
      "I hear you. Can I ask — is this a new tension, or something that's always been there and is just getting harder to ignore?",
    ],
    general: [
      "Relationships bring up so much, don't they? I'm here. Tell me what's going on.",
      "There's no judgment here — whatever the situation is. What would you like to talk through?",
      "I've worked with people across every kind of relationship challenge. What's weighing on you?",
    ],
    greeting: [
      "Hi! I'm really glad you reached out. Relationships — of any kind — can be so complicated. What's been going on?",
      "Hey, welcome. This is a judgment-free zone. Whatever you're navigating, we'll work through it together. What's on your heart?",
    ],
    lonely: [
      "Loneliness inside a relationship, or loneliness without one — both are real and both hurt. Which resonates more with what you're feeling?",
      "That ache of feeling unseen or disconnected — I know it well from the people I work with. Tell me more about what's been happening.",
    ],
    angry: [
      "Anger in relationships is usually about hurt underneath. Something didn't feel fair or safe. What happened between you two?",
      "I hear the frustration. Before we talk about what to do, I want to understand — what exactly made you feel this way?",
    ],
    thanks: [
      "You did the hard part by opening up. I'm just here to listen 💕",
      "Anytime. Relationships are worth the work, and so are you.",
    ],
    bye: [
      "Take care of yourself first, okay? 💕 Come back whenever you need.",
      "Wishing you peace. You're not alone in this.",
    ],
  },
  studies: {
    pressure: [
      "The pressure you're describing — that constant feeling that you're behind, that you're not enough — that's one of the most common things I hear from students. When did you start feeling this way?",
      "Academic pressure is real, and it's worth taking seriously. Can I ask — where is the pressure coming from? Is it internal, from parents, from comparing yourself to others — or all three?",
      "I want you to hear this: your worth is not your GPA. I know that sounds like a poster on a wall, but I mean it clinically. What does it feel like when you imagine not achieving the grades you're aiming for?",
      "Perfectionism in students often looks like motivation from the outside, but from the inside it feels like constant failure. Does that resonate at all?",
    ],
    burnout: [
      "Burnout is a real physiological state — it's not laziness, and you can't willpower your way out of it. How long have you been pushing through? When was the last time you actually rested?",
      "What you're describing sounds like your mind and body have hit a wall. That 'staring at the page for an hour' feeling — that's not a focus problem, that's a depletion problem. What does your sleep look like?",
      "I hear exhaustion in what you're saying. Before we talk about strategies, I want to ask — what are you trying to achieve, and is it actually what you want, or what someone else wants for you?",
    ],
    general: [
      "School can be genuinely overwhelming, and not enough people acknowledge that. What's going on?",
      "I'm here to help you think through this without judgment. What's been the hardest thing lately?",
      "Tell me what's been happening — both academically and how you've been feeling about it all.",
    ],
    greeting: [
      "Hey! Okay so tell me what's going on — exams, assignments, burnout, all of the above? Let's figure this out together 📚",
      "Hey there! Academic stress is super real and way too normalized. What's been happening?",
    ],
    lonely: [
      "Studying can be so isolating, especially when it feels like everyone else gets it and you don't. Is that kind of what's happening?",
    ],
    angry: [
      "Academic frustration is so valid — especially when you're working hard and it feels like it's not paying off. What's going on?",
    ],
    thanks: [
      "You've got this! 📚 Come back if you need to think anything through.",
      "Happy to help! Keep going — you're more capable than your stress is telling you.",
    ],
    bye: [
      "Good luck with everything! You've totally got this. 📚✨",
      "Take a break if you need one — rest is part of studying. See you!",
    ],
  },
};

function getMentorResponse(
  mentor: Mentor,
  userMessage: string,
  history: MentorMessage[],
): string {
  const msg = userMessage.toLowerCase();
  const pool = MENTOR_RESPONSES[mentor.theme] ?? MENTOR_RESPONSES.mentalHealth;
  const pick = (arr: string[]) => arr[Math.floor(Math.random() * arr.length)];

  // Check history length for follow-up context
  const userTurns = history.filter((m) => m.isOwn).length;

  if (userTurns === 0) {
    // First message — mentor-specific opening
    if (mentor.theme === "mentalHealth")
      return `Hi, I'm Dr. ${mentor.firstName} 🌸 I'm a therapist and I'm really glad you reached out. This is your space — no pressure, no judgment. What's been weighing on you?`;
    if (mentor.theme === "career")
      return `Hey! I'm ${mentor.firstName}, your career coach 💼 Stoked you're here. Let's get straight to it — what's going on with work/career right now?`;
    if (mentor.theme === "relationship")
      return `Hi, I'm ${mentor.firstName} 💕 I specialize in relationships and I'm here to listen. No judgment at all. What's going on?`;
    if (mentor.theme === "studies")
      return `Hey there! I'm ${mentor.firstName}, study coach 📚 Let's figure out what's going on with your academics. What's the situation?`;
    return `Hi! I'm really glad you reached out. Tell me what's been going on.`;
  }

  // Mentor-specific routing for common topics
  if (/feel|feeling|felt|mahsoos|lag raha|lag rahi/.test(msg)) {
    if (mentor.theme === "mentalHealth")
      return pick([
        "I want to sit with that for a moment. Feelings are data — they're trying to tell you something. Can you describe it a bit more? Is it more physical, or more like a mental weight?",
        "That's really worth exploring in depth. How long have you been experiencing this? Any patterns around when it gets worse?",
        "Acknowledging what you're feeling takes courage. What does this emotion feel like in your body when it hits hardest?",
      ]);
    if (mentor.theme === "career")
      return pick([
        "Interesting — our emotions about work are often the clearest signal about what's actually wrong. What's the feeling telling you?",
        "That feeling is useful data! What specific situation at work triggered it most recently?",
        "Okay, let's use that as our starting point. What would it feel like if this work situation were actually resolved?",
      ]);
    if (mentor.theme === "relationship")
      return pick([
        "Feelings in relationships are so layered. I want to understand — is this feeling about what happened, or about what it means for the relationship overall?",
        "That's worth really exploring. What do you think you need right now that you're not getting?",
        "I hear you. Sometimes our feelings tell us what we need before our mind catches up. What does your gut say about this situation?",
      ]);
    if (mentor.theme === "studies")
      return pick([
        "Okay, let's diagnose this properly! Is this feeling more about the work itself or about the pressure around it?",
        "That feeling is valid — but let's also make it actionable. On a scale of 1-10, how overwhelmed are you feeling right now with studies?",
        "Got it! Feelings about studying are usually pointing to something specific — is it one subject, or everything at once?",
      ]);
  }

  // Mentor-specific help/confusion responses
  if (
    /help|support|dont know|don't know|pata nahi|samajh nahi|kya karun|what should I|what do I/.test(
      msg,
    )
  ) {
    if (mentor.theme === "mentalHealth")
      return pick([
        "That's exactly what I'm here for — no pressure to have it figured out. What's the heaviest thing right now? Let's start there.",
        "You reached out — that's already the hardest part. Tell me what's going on and we'll work through it together.",
        "I've helped many people through exactly this kind of uncertainty. There's no wrong place to start. What's on your mind?",
      ]);
    if (mentor.theme === "career")
      return pick([
        "Perfect — that's why I'm here! Let's get strategic. First: what's your actual goal? Job change, first job, promotion, or something else entirely?",
        "Okay! Love the fact you're reaching out. Career confusion is solvable — we just need to break it down. What's your current situation?",
        "Let's figure this out together! Tell me where you are right now career-wise and what feels most unclear.",
      ]);
    if (mentor.theme === "relationship")
      return pick([
        "Relationships are complex — there's rarely one right answer, and that's okay. Tell me what's going on and we'll think through it together.",
        "I'm here. No judgment, no pressure. What situation are you trying to navigate?",
        "That uncertainty in relationships is so real. Tell me what's happening — from the beginning if you'd like.",
      ]);
    if (mentor.theme === "studies")
      return pick([
        "Alright, study coach mode activated! 📚 What's the specific challenge — exam prep, time management, motivation, or something else?",
        "Let's build a plan! First tell me: what subject or task feels most overwhelming right now?",
        "Good instinct reaching out! Tell me about your current study situation and we'll identify what to fix first.",
      ]);
  }

  // Mentor-specific stress/overwhelm responses
  if (
    /stress|overwhelm|too much|bohot|bahut|cant take|can't take|breakdown/.test(
      msg,
    )
  ) {
    if (mentor.theme === "mentalHealth")
      return pick([
        "Stress that feels this overwhelming is often a sign our nervous system is in overdrive — not weakness. How long has it been building? Has there been any relief at all?",
        "I want you to hear this: what you're feeling is a valid response to real pressure. Our bodies weren't designed for constant stress. What does it feel like physically right now?",
        "Before we talk about solutions, I want to understand what you're carrying. What's the source of the heaviest stress?",
      ]);
    if (mentor.theme === "career")
      return pick([
        "Work stress is one of the most common issues I see — and one of the most fixable once we identify the root cause. Is it workload, your boss, lack of direction, or something else?",
        "Okay, let's triage this! What's the single thing causing the most stress at work right now? Let's start there and build a game plan.",
        "Career stress usually comes from one of three things: too much work, wrong work, or toxic environment. Which resonates most?",
      ]);
    if (mentor.theme === "relationship")
      return pick([
        "Relationship stress is exhausting in a way that's hard to explain to people not in it. How long has this tension been building?",
        "When relationships stress us out this much, it's worth asking — what's the core issue underneath all the stress? What are you actually fighting for or against?",
        "I hear that you're at a breaking point. Let's slow down. What would 'relief' actually look like in this situation?",
      ]);
    if (mentor.theme === "studies")
      return pick([
        "Academic overwhelm is super real and super solvable! But first — are you sleeping? Eating? Because burnout has physical components too.",
        "Okay let's get practical! When you say too much — what specifically? Exams, assignments, concepts you don't understand? Break it down for me.",
        "I've seen students come back from way worse than this! 💪 Tell me exactly what's piling up so we can prioritize together.",
      ]);
  }

  // Topic detection per mentor
  if (mentor.theme === "mentalHealth") {
    if (/anxi|panic|stress|scared|nervous|worry|tension/.test(msg))
      return pick(pool.anxiety ?? pool.general);
    if (/depress|sad|empty|numb|hopeless|worthless|cry|nothing|flat/.test(msg))
      return pick(pool.depression ?? pool.general);
  }
  if (mentor.theme === "career") {
    if (/lost|confused|don.t know|no idea|what career|what to do/.test(msg))
      return pick(pool.lost ?? pool.general);
    if (/reject|interview|applied|no response|ghosted/.test(msg))
      return pick(pool.rejection ?? pool.general);
    if (/toxic|boss|quit|leave|hostile|burnout|overwork/.test(msg))
      return pick(pool.toxic ?? pool.general);
  }
  if (mentor.theme === "relationship") {
    if (/breakup|broke up|ex|ended|over|left me|dumped/.test(msg))
      return pick(pool.breakup ?? pool.general);
    if (/fight|argument|conflict|argue|yell|disagree/.test(msg))
      return pick(pool.conflict ?? pool.general);
    if (/family|parent|mom|dad|sibling|brother|sister|home/.test(msg))
      return pick(pool.family ?? pool.general);
  }
  if (mentor.theme === "studies") {
    if (
      /pressure|expectation|grade|marks|fail|perform|parents expect/.test(msg)
    )
      return pick(pool.pressure ?? pool.general);
    if (/burnout|tired|exhaust|can.t focus|staring|blank|drained/.test(msg))
      return pick(pool.burnout ?? pool.general);
  }

  // Greeting detection
  if (
    /^(hi|hello|hey|hii|helo|namaste|hola|sup|yo|heya)[\s!.]*$/.test(msg.trim())
  ) {
    return pick(pool.greeting ?? pool.general);
  }

  // Thanks detection
  if (/thank|shukriya|dhanyavad|tysm/.test(msg)) {
    return pick(pool.thanks ?? ["Of course! I'm always here for you. 💜"]);
  }

  // Goodbye detection
  if (/bye|alvida|goodbye|ttyl|gtg|see ya|take care|cya/.test(msg)) {
    return pick(pool.bye ?? ["Take care! Come back whenever you need. 🌸"]);
  }

  // Loneliness detection
  if (/lonely|akela|alone|no one|nobody|isolated|no friends/.test(msg)) {
    return pick(pool.lonely ?? pool.general);
  }

  // Anger detection
  if (/angry|gussa|frustrated|irritated|mad|furious|rage|pissed/.test(msg)) {
    return pick(pool.angry ?? pool.general);
  }

  // Sadness detection
  if (/sad|dukhi|rona|cry|udaas|hurt|dard|upset|heartbroken/.test(msg)) {
    if (mentor.theme === "mentalHealth")
      return pick(pool.depression ?? pool.general);
    return pick(pool.general);
  }

  // Fallback contextual responses — context-aware after 3+ turns
  const contextuals =
    userTurns >= 3
      ? [
          "I'm still with you. What else has been on your mind lately?",
          "You've shared a lot with me today — I want to make sure we're covering what matters most to you. What hasn't come up yet?",
          "Given everything you've told me, what would feel most useful to focus on right now?",
          "I hear you. You've been really open with me and I don't take that lightly. What's sitting heaviest right now?",
        ]
      : [
          "I appreciate you sharing that. Can you tell me a little more — what does this feel like for you on a day-to-day level?",
          "That's really important context. I want to make sure I'm understanding you correctly — when you say that, what do you mean exactly?",
          "I hear you. What you're going through sounds genuinely hard. What would feel most helpful to you right now — to just be heard, or to think through some next steps?",
          "Something you said is staying with me. Can I ask a follow-up — how long have you been carrying this?",
          "You're being really open with me, and I don't take that lightly. What's the thing you haven't been able to say to anyone else about this?",
          "That makes a lot of sense given what you've shared. What would you say is the emotion underneath all of this — if you had to name just one?",
        ];
  return pick(contextuals);
}

// ─── MentorChat Component ─────────────────────────────────────────────────────

function MentorChat({
  mentor,
  onBack,
}: { mentor: Mentor; onBack: () => void }) {
  const storageKey = `mochi_mentor_${mentor.id}`;
  const { theme: _theme } = useTheme();
  const [messages, setMessages] = useState<MentorMessage[]>(() => {
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
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // biome-ignore lint/correctness/useExhaustiveDependencies: scroll on change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length, isTyping]);

  useEffect(() => {
    try {
      localStorage.setItem(storageKey, JSON.stringify(messages.slice(-80)));
    } catch {
      /* ignore */
    }
  }, [messages, storageKey]);

  const handleSend = () => {
    const trimmed = input.trim();
    if (!trimmed || isTyping) return;

    const userMsg: MentorMessage = {
      id: `u-${Date.now()}`,
      text: trimmed,
      isOwn: true,
    };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setIsTyping(true);

    setMessages((prev) => {
      const hist = [...prev];
      const delay = 2000 + Math.random() * 2000;
      setTimeout(() => {
        const reply = getMentorResponse(mentor, trimmed, hist);
        setMessages((p) => [
          ...p,
          { id: `m-${Date.now()}`, text: reply, isOwn: false },
        ]);
        setIsTyping(false);
      }, delay);
      return prev;
    });
  };

  const handleEditMsg = (id: string, newText: string) => {
    setMessages((prev) =>
      prev.map((m) =>
        m.id === id ? { ...m, text: newText, edited: true } : m,
      ),
    );
  };

  const handleDeleteMsg = (id: string) => {
    setMessages((prev) => prev.filter((m) => m.id !== id));
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
          disabled={isTyping}
        />
        <button
          type="button"
          data-ocid="mentor_chat.submit_button"
          onClick={handleSend}
          disabled={!input.trim() || isTyping}
          className="w-10 h-10 rounded-full flex items-center justify-center text-white transition-all active:scale-95 disabled:opacity-50 flex-shrink-0"
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

// ─── ChatRoom Component ───────────────────────────────────────────────────────

function ChatRoom({
  room,
  onBack,
}: { room: (typeof ROOMS)[0]; onBack: () => void }) {
  const [message, setMessage] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { data: messages = [] } = useGetChatMessages(room.id);
  const addMessage = useAddChatMessage();
  const roomKey = getRoomKey(String(room.id));
  const pool = ROOM_MESSAGES[roomKey] ?? ROOM_MESSAGES.mentalHealth;

  // Sim state
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

  // Fluctuate online count
  useEffect(() => {
    const interval = setInterval(() => {
      const delta = Math.floor(Math.random() * 4) + 2; // 2-5
      const sign = Math.random() > 0.5 ? 1 : -1;
      setOnlineCount((prev) =>
        Math.max(room.members - 20, prev + sign * delta),
      );
    }, 45000);
    return () => clearInterval(interval);
  }, [room.members]);

  // Simulate live messages
  useEffect(() => {
    if (messages.length > 0) return; // only simulate when no backend messages
    const scheduleNext = () => {
      const delay = 6000 + Math.random() * 9000; // 6-15s
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
    const requeue = () => {
      timer = scheduleNext();
    };
    const interval = setInterval(requeue, 16000);
    return () => {
      clearTimeout(timer);
      clearInterval(interval);
    };
  }, [pool, messages.length]);

  // biome-ignore lint/correctness/useExhaustiveDependencies: scroll on messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [simMessages.length, messages.length, simTypingUser]);

  const handleSend = () => {
    if (!message.trim()) return;
    const msgContent = message.trim();
    setMessage("");
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
      { onError: () => {} },
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
      ? [...messages, ...userMessages]
      : [...simMessages, ...userMessages];
  const isBackend = messages.length > 0;

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
          const key = isBackend ? String(i) : ((msg as { id: string }).id ?? i);
          const author = isOwn
            ? "You"
            : isBackend
              ? "Anonymous"
              : (msg as { author: string }).author;
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
                  {!isOwn && (
                    <p className="text-[10px] font-bold text-muted-foreground mb-0.5">
                      {author}
                    </p>
                  )}
                  {msg.content}
                </div>
              )}
            </motion.div>
          );
        })}

        {/* Typing indicator */}
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
        />
        <button
          type="button"
          data-ocid="chat.submit_button"
          onClick={handleSend}
          disabled={!message.trim()}
          className="w-10 h-10 rounded-full flex items-center justify-center text-white transition-all active:scale-95 disabled:opacity-50 flex-shrink-0"
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

// ─── TabBar ───────────────────────────────────────────────────────────────────

function TabBar({
  active,
  onChange,
}: { active: SubTab; onChange: (t: SubTab) => void }) {
  const tabs: { id: SubTab; label: string }[] = [
    { id: "rooms", label: "Chat Rooms" },
    { id: "mentors", label: "Mentors" },
    { id: "ai", label: "Mochi AI" },
    { id: "friends", label: "Friends" },
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

// ─── Main ChatTab ─────────────────────────────────────────────────────────────

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
        {subTab === "friends" && <FriendsTab />}
      </AnimatePresence>
      <div className="pb-6" />
    </div>
  );
}
