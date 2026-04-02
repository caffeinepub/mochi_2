// Simulated multi-user system for Mochi friend network
// Uses localStorage as a shared store

export interface SimUser {
  username: string;
  displayName: string;
  bio: string;
  avatarColor: string;
  emoji: string;
  posts: SimPost[];
  stories: SimStory[];
  replyPool: string[];
}

export interface SimPost {
  id: string;
  content: string;
  timestamp: number;
  category: string;
}

export interface SimStory {
  id: string;
  emoji: string;
  text: string;
  createdAt: number;
}

const SIM_USERS: SimUser[] = [
  {
    username: "stargazer_ria",
    displayName: "Ria ✨",
    bio: "overthinker + midnight snacker",
    avatarColor: "from-purple-400 to-pink-400",
    emoji: "✨",
    posts: [
      {
        id: "ria-1",
        content: "why does 3am hit different when you're trying to sleep 😭",
        timestamp: Date.now() - 1000 * 60 * 30,
        category: "mentalHealth",
      },
      {
        id: "ria-2",
        content: "reminder: you don't have to have it all figured out at 20 💜",
        timestamp: Date.now() - 1000 * 60 * 90,
        category: "mentalHealth",
      },
      {
        id: "ria-3",
        content:
          "hot take: overthinking is just your brain loving you too much",
        timestamp: Date.now() - 1000 * 60 * 200,
        category: "mentalHealth",
      },
    ],
    stories: [
      {
        id: "ria-s1",
        emoji: "📚",
        text: "pulling an all nighter rn",
        createdAt: Date.now() - 1000 * 60 * 40,
      },
      {
        id: "ria-s2",
        emoji: "🌙",
        text: "can't sleep again lol",
        createdAt: Date.now() - 1000 * 60 * 120,
      },
    ],
    replyPool: [
      "omg same yaar 😭 bata kya chal raha hai",
      "hehe you get me fr fr 💜",
      "yaar this is too real 😂",
      "ayyy hello!! ✨ kya scene hai",
      "mood tbh. kuch share karna hai?",
      "finally someone understands 🥺",
      "haha I was literally thinking this today",
    ],
  },
  {
    username: "chill_nikhil",
    displayName: "Nikhil 🎧",
    bio: "music > everything tbh",
    avatarColor: "from-blue-400 to-cyan-400",
    emoji: "🎧",
    posts: [
      {
        id: "nk-1",
        content:
          "the way a good song can fix your whole mood no questions asked 🎵",
        timestamp: Date.now() - 1000 * 60 * 45,
        category: "mentalHealth",
      },
      {
        id: "nk-2",
        content:
          "studied for 3 hours straight and retained nothing. peak performance.",
        timestamp: Date.now() - 1000 * 60 * 150,
        category: "studies",
      },
    ],
    stories: [
      {
        id: "nk-s1",
        emoji: "🎵",
        text: "vibing to lo-fi rn",
        createdAt: Date.now() - 1000 * 60 * 25,
      },
    ],
    replyPool: [
      "yooo what's up 🎧",
      "bro same energy",
      "chill vibes only na 😌",
      "haha that's actually true tho",
      "kya sun raha hai aajkal?",
      "ayo okay respect 🤝",
      "facts. music therapy hits different",
    ],
  },
  {
    username: "anxious_arti",
    displayName: "Arti 🌸",
    bio: "anxiety gang but make it aesthetic",
    avatarColor: "from-pink-400 to-rose-400",
    emoji: "🌸",
    posts: [
      {
        id: "arti-1",
        content: "anxiety said 'hey bestie' at 2am again. fun times ✌️",
        timestamp: Date.now() - 1000 * 60 * 60,
        category: "mentalHealth",
      },
      {
        id: "arti-2",
        content: "going outside was hard today but I did it and I'm proud 🌸",
        timestamp: Date.now() - 1000 * 60 * 180,
        category: "mentalHealth",
      },
      {
        id: "arti-3",
        content:
          "therapy update: I cried, she nodded, I paid ₹1500. healing 🌺",
        timestamp: Date.now() - 1000 * 60 * 300,
        category: "mentalHealth",
      },
    ],
    stories: [
      {
        id: "arti-s1",
        emoji: "✨",
        text: "feeling okay today actually 🌸",
        createdAt: Date.now() - 1000 * 60 * 15,
      },
    ],
    replyPool: [
      "aww hi!! how are you feeling today 🌸",
      "I feel this so much 🥺",
      "you're not alone in this okay? 💜",
      "sending virtual hugs rn 🤗",
      "same honestly. anxiety is rough na",
      "omg bata bata what happened!",
      "hehe hello 🌸 kya chal raha hai?",
    ],
  },
  {
    username: "zaid_zindagi",
    displayName: "Zaid 🌙",
    bio: "finding myself one chai at a time",
    avatarColor: "from-amber-400 to-orange-400",
    emoji: "🌙",
    posts: [
      {
        id: "zaid-1",
        content:
          "chai #4 of the day and I still don't have my life figured out. the grind continues ☕",
        timestamp: Date.now() - 1000 * 60 * 70,
        category: "mentalHealth",
      },
      {
        id: "zaid-2",
        content: "log kehte hain 'find yourself' lekin koi nahi bata ta how 🤷",
        timestamp: Date.now() - 1000 * 60 * 200,
        category: "mentalHealth",
      },
    ],
    stories: [
      {
        id: "zaid-s1",
        emoji: "☕",
        text: "chai time 🌙",
        createdAt: Date.now() - 1000 * 60 * 50,
      },
      {
        id: "zaid-s2",
        emoji: "🌙",
        text: "night walk vibes",
        createdAt: Date.now() - 1000 * 60 * 130,
      },
    ],
    replyPool: [
      "yaar kya scene hai 🌙",
      "chai peena chahiye iss situation mein",
      "bhai/behen kya hua bata",
      "haha sach bolun toh same 😂",
      "thoda relax kar, sab theek hoga",
      "ayo hello! kya chal raha hai?",
      "deep thoughts at this hour? respect 💜",
    ],
  },
  {
    username: "priya_explores",
    displayName: "Priya 🗺️",
    bio: "solo traveler | journal nerd",
    avatarColor: "from-green-400 to-teal-400",
    emoji: "🗺️",
    posts: [
      {
        id: "priya-1",
        content: "solo trip done ✅ loneliness: temporary. memories: forever 🗺️",
        timestamp: Date.now() - 1000 * 60 * 80,
        category: "mentalHealth",
      },
      {
        id: "priya-2",
        content: "my journal has seen things my therapist hasn't. sorry doc.",
        timestamp: Date.now() - 1000 * 60 * 250,
        category: "mentalHealth",
      },
    ],
    stories: [
      {
        id: "priya-s1",
        emoji: "🌿",
        text: "journaling outside today 🗺️",
        createdAt: Date.now() - 1000 * 60 * 20,
      },
    ],
    replyPool: [
      "hello!! 🗺️ kya chal raha hai",
      "ooh tell me more! I'm curious",
      "I feel this in my soul honestly",
      "noted in my journal lol 📝",
      "adventure calls yaar! kya plan hai?",
      "yess!! this is so valid 💚",
      "traveling solo and healing fr 🌿",
    ],
  },
  {
    username: "rohan_reels",
    displayName: "Rohan 🎬",
    bio: "cinematography student | vibe curator",
    avatarColor: "from-indigo-400 to-purple-400",
    emoji: "🎬",
    posts: [
      {
        id: "rohan-1",
        content:
          "spent 4 hours editing a reel only for insta to compress it into potato quality 😭",
        timestamp: Date.now() - 1000 * 60 * 100,
        category: "career",
      },
      {
        id: "rohan-2",
        content:
          "cinematography taught me: life is about finding the right angle 🎬",
        timestamp: Date.now() - 1000 * 60 * 280,
        category: "career",
      },
    ],
    stories: [
      {
        id: "rohan-s1",
        emoji: "🎬",
        text: "shooting golden hour rn",
        createdAt: Date.now() - 1000 * 60 * 35,
      },
    ],
    replyPool: [
      "yooo hello!! 🎬 kya scene hai",
      "bro/sis this is actually cinematic fr",
      "I would make a whole reel about this ngl",
      "okay but the vibe here is immaculate",
      "chal bata more about this situation",
      "interesting perspective tbh 🎥",
      "haha relatable content right here 😂",
    ],
  },
  {
    username: "mehak_mood",
    displayName: "Mehak 💜",
    bio: "therapy helped. journaling helped more.",
    avatarColor: "from-violet-400 to-purple-400",
    emoji: "💜",
    posts: [
      {
        id: "mehak-1",
        content:
          "healing isn't linear. today was a step back but tomorrow is new 💜",
        timestamp: Date.now() - 1000 * 60 * 110,
        category: "mentalHealth",
      },
      {
        id: "mehak-2",
        content:
          "therapy update: boundaries set, tears shed, growth unlocked ✨",
        timestamp: Date.now() - 1000 * 60 * 320,
        category: "mentalHealth",
      },
      {
        id: "mehak-3",
        content:
          "you're allowed to outgrow people, places, and versions of yourself 💜",
        timestamp: Date.now() - 1000 * 60 * 480,
        category: "mentalHealth",
      },
    ],
    stories: [
      {
        id: "mehak-s1",
        emoji: "💜",
        text: "self care sunday ✨",
        createdAt: Date.now() - 1000 * 60 * 10,
      },
      {
        id: "mehak-s2",
        emoji: "📖",
        text: "reading and healing",
        createdAt: Date.now() - 1000 * 60 * 100,
      },
    ],
    replyPool: [
      "hey 💜 how are you really doing?",
      "I hear you, that sounds like a lot",
      "sending you so much love rn 🌸",
      "you're doing amazing even if it doesn't feel like it",
      "aw hello!! 💜 bata kya chal raha hai",
      "this is so valid. your feelings matter",
      "healing era? let's go! 🌷",
    ],
  },
  {
    username: "dev_dreams",
    displayName: "Dev 💻",
    bio: "building things at 2am",
    avatarColor: "from-slate-400 to-blue-400",
    emoji: "💻",
    posts: [
      {
        id: "dev-1",
        content:
          "it's 2am and I finally fixed the bug. the bug was a typo. I hate myself.",
        timestamp: Date.now() - 1000 * 60 * 130,
        category: "studies",
      },
      {
        id: "dev-2",
        content:
          "me: I'll sleep early today. also me at 3am: just one more feature 😭",
        timestamp: Date.now() - 1000 * 60 * 360,
        category: "studies",
      },
    ],
    stories: [
      {
        id: "dev-s1",
        emoji: "💻",
        text: "2am build session 🚀",
        createdAt: Date.now() - 1000 * 60 * 5,
      },
    ],
    replyPool: [
      "yo hello!! 💻 what's up",
      "bro/sis same I'm literally awake rn building stuff",
      "haha okay this is very relatable 😂",
      "debugging my life choices as we speak",
      "kya chal raha hai? build season?",
      "respect honestly. the grind is real",
      "lmao this hit different at 2am",
    ],
  },
];

const KEYS = {
  friends: "mochi_sim_friends",
  sent: "mochi_friend_requests_sent",
  pending: "mochi_friend_requests_pending",
  dmPrefix: "mochi_dm_messages_",
} as const;

function readJSON<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function writeJSON(key: string, val: unknown) {
  localStorage.setItem(key, JSON.stringify(val));
}

export function getAllSimUsers(): SimUser[] {
  return SIM_USERS;
}

export function getSimUser(username: string): SimUser | undefined {
  return SIM_USERS.find((u) => u.username === username);
}

export function getFriends(): string[] {
  return readJSON<string[]>(KEYS.friends, []);
}

export function getSentRequests(): string[] {
  return readJSON<string[]>(KEYS.sent, []);
}

export function getPendingRequests(): string[] {
  return readJSON<string[]>(KEYS.pending, []);
}

export function sendFriendRequest(username: string): void {
  const sent = getSentRequests();
  if (sent.includes(username)) return;
  writeJSON(KEYS.sent, [...sent, username]);
  // Simulate: after 3s the sim user sends back a request (they want to connect too!)
  setTimeout(() => {
    const pending = getPendingRequests();
    const friends = getFriends();
    if (!pending.includes(username) && !friends.includes(username)) {
      writeJSON(KEYS.pending, [...pending, username]);
      window.dispatchEvent(
        new CustomEvent("mochi-friend-request", { detail: { username } }),
      );
    }
  }, 3000);
}

export function acceptRequest(username: string): void {
  const pending = getPendingRequests().filter((u) => u !== username);
  writeJSON(KEYS.pending, pending);
  const friends = getFriends();
  if (!friends.includes(username)) {
    writeJSON(KEYS.friends, [...friends, username]);
  }
  // Also clean from sent (if we sent them one too)
  const sent = getSentRequests().filter((u) => u !== username);
  writeJSON(KEYS.sent, sent);
}

export function declineRequest(username: string): void {
  const pending = getPendingRequests().filter((u) => u !== username);
  writeJSON(KEYS.pending, pending);
}

export function removeFriend(username: string): void {
  writeJSON(
    KEYS.friends,
    getFriends().filter((u) => u !== username),
  );
}

export function getFriendsPosts(): SimPost[] {
  const friends = getFriends();
  const posts: SimPost[] = [];
  for (const username of friends) {
    const user = getSimUser(username);
    if (user)
      posts.push(...user.posts.map((p) => ({ ...p, _author: username })));
  }
  return posts.sort((a, b) => b.timestamp - a.timestamp);
}

export function getFriendsStories(): (SimStory & {
  username: string;
  user: SimUser;
})[] {
  const friends = getFriends();
  const stories: (SimStory & { username: string; user: SimUser })[] = [];
  const TTL = 24 * 60 * 60 * 1000;
  for (const username of friends) {
    const user = getSimUser(username);
    if (!user) continue;
    for (const story of user.stories) {
      if (Date.now() - story.createdAt < TTL) {
        stories.push({ ...story, username, user });
      }
    }
  }
  return stories;
}

export function getSuggestedUsers(): SimUser[] {
  const friends = getFriends();
  const sent = getSentRequests();
  const pending = getPendingRequests();
  return SIM_USERS.filter(
    (u) =>
      !friends.includes(u.username) &&
      !sent.includes(u.username) &&
      !pending.includes(u.username),
  );
}

export function getDMMessages(
  username: string,
): { from: "me" | "them"; content: string; timestamp: string }[] {
  return readJSON(KEYS.dmPrefix + username, []);
}

export function saveDMMessages(
  username: string,
  msgs: { from: "me" | "them"; content: string; timestamp: string }[],
) {
  writeJSON(KEYS.dmPrefix + username, msgs);
}

export function getSimReply(username: string): string {
  const user = getSimUser(username);
  if (!user) return "hey! 👋";
  const pool = user.replyPool;
  return pool[Math.floor(Math.random() * pool.length)];
}
