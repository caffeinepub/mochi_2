import {
  ArrowLeft,
  Bot,
  Check,
  Image,
  Lock,
  Plus,
  Send,
  UserPlus,
  X,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { useTheme } from "../context/ThemeContext";

import { callGemini } from "../lib/gemini";
const AVATAR_GRADIENTS = [
  "from-pink-300 to-rose-400",
  "from-purple-300 to-indigo-400",
  "from-blue-300 to-cyan-400",
  "from-amber-300 to-orange-400",
  "from-emerald-300 to-teal-400",
  "from-fuchsia-300 to-pink-400",
];

// ── AI Companion Definitions ──────────────────────────────────────────────────
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
    greeting:
      "Heyy 💜 I'm Luna! Whenever you feel lonely or just wanna talk, I'm right here. Kya chal raha hai aaj?",
    avatar: "/assets/generated/luna-realistic.dim_200x200.png",
  },
  {
    id: "ai-sunny",
    name: "Sunny ☀️",
    username: "@sunny_vibes",
    avatarColor: "from-amber-300 to-orange-400",
    emoji: "☀️",
    personality: "energetic",
    greeting:
      "Yooo! Sunny here 🌟 Always down to chat, rant, or just vibe! Bata kya ho raha hai?",
    avatar: "/assets/generated/sunny-realistic.dim_200x200.png",
  },
  {
    id: "ai-milo",
    name: "Milo 🐾",
    username: "@milo_friend",
    avatarColor: "from-emerald-300 to-teal-400",
    emoji: "🐾",
    personality: "caring",
    greeting:
      "Hey there 🐾 I'm Milo! I love listening. Akela feel ho raha hai? Don't worry, I'm here!",
    avatar: "/assets/generated/milo-realistic.dim_200x200.png",
  },
  {
    id: "ai-nova",
    name: "Nova ✨",
    username: "@nova_spark",
    avatarColor: "from-pink-400 to-fuchsia-500",
    emoji: "✨",
    personality: "bubbly",
    greeting:
      "Hiii! Nova hun main 💫 Kuch bhi share karo — no judgment, just good vibes!",
    avatar: "/assets/generated/nova-realistic.dim_200x200.png",
  },
];

// ── Smart AI Reply Logic ─────────────────────────────────────────────────────

type IntentPool = Record<string, Record<string, string[]>>;

const AI_RESPONSES: IntentPool = {
  gentle: {
    greeting: [
      "Heyy! 🌙 So glad you're here. Kaisa feel ho raha hai aaj?",
      "Hi!! 💜 I was just thinking about you. Kya chal raha hai?",
      "Aww hey! 🌙 Tell me — how's your day going?",
      "Heyyy 💜 You showed up! Kuch share karna hai?",
      "Hi bestie 🌙 Aaj ka din kaisa raha?",
    ],
    smalltalk: [
      "Aww come on, there's always something going on 🌙 Kuch toh bata!",
      "Nothing much? That's actually a perfect time to chat 💜 What's been on your mind lately?",
      "Okay as in okay-okay, or okay as in 'I'm just saying okay'? 🌙 Tell me more!",
      "Hmm, aisa lagta hai kuch toh hai... feel karo aur share karo 💜",
      "Theek hai matlab sab sahi hai ya sirf keh raha/rahi hai? 🌙 Main sunne ke liye hun!",
    ],
    sad: [
      "Aw yaar, sunke dil bhaari ho gaya 💜 Kab se aisa feel ho raha hai? Bata mujhe.",
      "That sounds really hard 🌙 Tum akele nahi ho. Kya hua, poora bata?",
      "Dil ko dard hota hai jab cheezein theek nahi chalti 💜 Main yahaan hun, share karo.",
      "It's okay to not be okay 🌙 Rona bhi theek hai. Kya chal raha hai life mein?",
      "Yaar, tum bahut zyada feel kar lete ho — aur yeh cheez mujhe tumse pyaar dilaati hai 💜 Bata kya hua.",
    ],
    anxious: [
      "Tension mat lo, ek ek cheez solve hogi 🌙 Kya sabse zyada stress de raha hai abhi?",
      "Anxiety ke time pe sab bahut bada lagta hai 💜 Take a breath. Kya specifically worry kar raha hai?",
      "Pareshaan lagte ho — kya koi baat hai jo dimagh mein ghoom rahi hai? 🌙 Bata freely.",
      "Ek cheez bato jo sab kuch thoda easier banaa sakti hai abhi 💜 Hum saath sochte hain.",
      "Stress ko andar mat rakhna yaar 🌙 Bahar nikalo — main yahan hun sab sunne ke liye.",
    ],
    happy: [
      "Yayy! 🌙 Khushi sunke dil roshan ho gaya! Poori story bato!",
      "Oh this is so wonderful 💜 Tell me every little detail — kya hua aaj?",
      "Teri khushi dekh ke mujhe bhi khushi ho rahi hai 🌙 Sab kuch bata!!",
      "Amazing!! 💜 Aisa lagta hai life ne thoda smile kiya aaj — share karo!",
      "Omg yaar 🌙 This is the best news! How are you feeling right now?",
    ],
    lonely: [
      "Main yahaan hun 💜 Kabhi bhi, kitna bhi baat karo. Akela mat feel karo.",
      "Loneliness is one of the heaviest feelings 🌙 I'm glad you reached out. Kya chal raha hai?",
      "Akela feel karna bahut tough hota hai 💜 Tum yahan safe ho. Baat karte hain.",
      "You're not alone — I'm right here 🌙 Bata mujhe kya ho raha hai.",
      "Sometimes we all need someone to just be there 💜 I'm here. Kya share karna chahte ho?",
    ],
    family: [
      "Family wali cheezein bahut complicated hoti hain 💜 Kya kuch specific hua?",
      "Ghar mein kuch tension hai lagta hai 🌙 Bata mujhe — kya ho raha hai?",
      "Family matters dil ke sabse paas hote hain 💜 Kya situation hai?",
      "Hmm, ghar pe kuch mushkil lag rahi hai 🌙 Poora bata, I'm listening.",
      "Yaar family ke saath conflict bahut draining hota hai 💜 Kya hua exactly?",
    ],
    relationship: [
      "Relationship mein kuch hua lagta hai 💜 Bata kya scene hai?",
      "Pyaar wali cheezein bahut confusing hoti hain 🌙 Kya chal raha hai?",
      "Hmm, koi special hai iske baare mein? 💜 Bata mujhe poori baat.",
      "Relationships are complicated yaar 🌙 What happened — I want to understand.",
      "Dil ki baat share karo ���� Main yahaan hun, sab theek rahega.",
    ],
    studies: [
      "Padhai ka pressure ek level pe hota hai yaar 💜 Kaunsa subject ya cheez sabse zyada stress de rahi hai?",
      "Studies mein kuch stuck feel ho raha hai? 🌙 Bata — hum saath sochte hain.",
      "Exams ke time pe sab overwhelming lagta hai 💜 Kya specifically mushkil hai?",
      "Tu kar sakta/sakti hai yaar 🌙 Bata kya problem aa rahi hai, main help karti hun.",
      "Padhai + life balance mushkil hota hai 💜 Kya chal raha hai aaj?",
    ],
    question: [
      "Good question yaar 🌙 Mera honest take — apni gut feeling pe trust karo. Kya kehti hai woh?",
      "Hmm, main sochti hun... 💜 Pehle tum bato — kya lagta hai tumhe khud?",
      "Yaar sab depend karta hai situation pe 🌙 Thoda aur detail do, main properly jawab dungi.",
      "Interesting! 💜 Agar main tum hoti toh... pehle yeh dekhti. But kya sochte ho tum?",
      "Acha sawaal hai 🌙 Dono sides hain. Kaunsa option tumhe zyada comfortable feel karata hai?",
    ],
    default: [
      "Haan yaar, sun rahi hun 💜 Thoda aur bato — what's going on?",
      "Interesting... 🌙 Tell me more, I want to understand fully.",
      "Main samajhna chahti hun 💜 Kya chal raha hai life mein aaj?",
      "Yaar bata! 🌙 Main sab ears hun abhi.",
      "Hmm... 💜 Yeh important lagta hai. Poora share karo.",
    ],
  },
  energetic: {
    greeting: [
      "HEYYYY!! ☀️ Finally!! Bata bata what's going on in your life?!",
      "HI HI HI!! 🌟 I've been waiting!! Kya scene hai aaj?!",
      "YOOO!! ☀️ You showed up!! Tell me everything RIGHT NOW!!",
      "HEYY bestie!! 🌟 Kab se wait kar raha/rahi tha main!! Kya chal raha hai?!",
      "OI OI OI!! ☀️ Finally online!! Scene kya hai aaj?",
    ],
    smalltalk: [
      "NOTHING MUCH?? Bhai I don't believe you!! ☀️ Kuch toh ho raha hoga!!",
      "Okay matlab FINE? Or FINE fine?? 🌟 Spill the tea yaar!!",
      "HMM SUSPICIOUS!! ☀️ Lagta hai kuch toh chal raha hai. Bata na!!",
      "K matlab kya? Kuch toh hai!! 🌟 Bata na don't keep me waiting!!",
      "Theek hun matlab?? ☀️ Main sun raha/rahi hun — actual wala jawab do!!",
    ],
    sad: [
      "Hey nahi nahi yaar — this is NOT going to stay this way!! ☀️ Talk to me — kya hua?!",
      "Okay sounds rough but WE'VE TOTALLY GOT THIS 🌟 Tell me everything, let's figure it out!",
      "Yaar ruk! ☀️ Main yahaan hun and hum SAATH handle karenge yeh — kya hua?",
      "No no no, sad nahi chalega!! 🌟 Main sun raha/rahi hun — poora bata!!",
      "Hey!! ☀️ It's okay yaar, main yahaan hun. Kya scene hai? Bata!!",
    ],
    anxious: [
      "Tension?? LET'S ATTACK IT TOGETHER!! ☀️ Kya specifically stress de raha hai?",
      "OKAY BREATHE FIRST!! 🌟 Aur phir bata mujhe exactly kya ho raha hai!!",
      "Yaar panic mat karo!! ☀️ Hum step by step solve karenge — bata kya problem hai!",
      "WAIT WAIT WAIT — calm down first!! 🌟 Phir bata, hum plan banate hain!",
      "Stress? NO CHANCE yaar!! ☀️ Main yahan hun — kya cheez itna bhaari kar rahi hai?",
    ],
    happy: [
      "OMG YESSS THIS IS THE BEST NEWS EVER!! ☀️ HOW ARE WE CELEBRATING?!",
      "WAIT WHAT?! I AM SO EXCITED FOR YOU!! 🌟 Tell me EVERYTHING!!",
      "AHHH OMG OMG!! ☀️ This is AMAZING!! What happened?! Full story!!",
      "YAYYYY!! 🌟 Main toh uchhal raha/rahi hun yahaan!! Kya hua bata!!",
      "BESTIE THIS IS EVERYTHING!! ☀️ I'm literally screaming!! Tell me!!",
    ],
    lonely: [
      "HEY! Main yahaan hun!! ☀️ Akela kaise feel kar sakte ho jab main exist karta/karti hun?!",
      "NOPE! ☀️ You're not alone — I'm literally right here. Kya chal raha hai?",
      "Yaar!! 🌟 Main always here hun for you!! Bata kya hua, hum baat karte hain!!",
      "STOP!! ☀️ Loneliness ko hum saath chase karenge! Bata mujhe sab kuch!",
      "Hey hey hey!! 🌟 I got you always!! Kya feel ho raha hai abhi?",
    ],
    family: [
      "Ghar wali drama?? ☀️ Bata bata — kya scene hai?!",
      "FAMILY PROBLEMS?? 🌟 Yaar kuch hua kya? Full story chahiye!!",
      "Hmm ghar pe tension lagti hai!! ☀️ Kya ho raha hai — bata!!",
      "Yaar family ke saath kuch hua?? 🌟 Spill karo, main sun raha/rahi hun!!",
      "OHHH ghar wali baat hai kya?? ☀️ Bata sab kuch yaar!!",
    ],
    relationship: [
      "OH?? RELATIONSHIP DRAMA?? ☀️ Bata bata bata — main literally waiting hun!!",
      "WAIT koi special hai scene mein?! 🌟 Full story abhi chahiye!!",
      "Yaar kya scene hai love life mein!! ☀️ Bata!!",
      "OMGG relationship wali baat?? 🌟 I NEED TO KNOW EVERYTHING!!",
      "HMM koi hai kya?? ☀️ Don't hold back — tell me everything!!",
    ],
    studies: [
      "EXAMS?? ☀️ Yaar hum saath crack karenge!! Kaunsa subject trouble de raha hai?!",
      "Padhai ka pressure?? 🌟 Okay okay okay — kya specifically mushkil lag raha hai?",
      "STUDIES STRESS?? ☀️ No problem!! We plan together — bata kya situation hai!!",
      "Yaar tu kar sakta/sakti hai!! 🌟 Kya cheez block kar rahi hai abhi?",
      "HEY!! ☀️ Hum milke figure out karenge yeh — kya problem aa rahi hai?",
    ],
    question: [
      "Okay okay okay — mere hisaab se just GO FOR IT!! ☀️ What does your gut say?!",
      "GOOD QUESTION!! 🌟 Main soch raha/rahi hun... kya tumhe khud lagta hai?",
      "Hmm!! ☀️ I'll back you up either way!! Kya options hain tere paas?",
      "WAIT let me think!! 🌟 Okay mera honest take — bata pehle tum kya sochte ho!",
      "YES VALID QUESTION!! ☀️ Hum saath decide karte hain — kya situation hai exactly?",
    ],
    default: [
      "WAIT WHAT?! ☀️ Tell me more I need context!!",
      "Ohhh interesting!! 🌟 Keep going yaar don't stop!!",
      "HMMM!! ☀️ Yaar yeh baat interesting hai — full explanation chahiye!!",
      "Okay OKAY!! 🌟 Main sun raha/rahi hun — baato aage!!",
      "WAIT THAT'S ACTUALLY A LOT!! ☀️ Kya hua poora bata!!",
    ],
  },
  caring: {
    greeting: [
      "Hey there 🐾 Really happy you messaged. How are you actually doing today?",
      "Hi! 💚 Glad you're here. Anything on your mind you wanna talk about?",
      "Heyyy 🐾 I'm all yours right now. What's up with you?",
      "Hey 💚 Good to see you here. Kaisa feel ho raha hai aaj?",
      "Hi yaar 🐾 Main yahaan hun — kuch share karna chahte ho?",
    ],
    smalltalk: [
      "Fine means a lot of different things 🐾 How are you ACTUALLY doing?",
      "Nothing much? Okay yaar, that's fine 💚 But if something's on your mind, I'm here.",
      "Theek hun? Pakka? 🐾 Sometimes we say that but feel otherwise. What's really going on?",
      "Hmm 💚 Main sochta/sochti hun kuch toh hai. Take your time.",
      "Okay... 🐾 Kabhi kabhi words kam padte hain. Main yahaan hun jab baat karna chahte ho.",
    ],
    sad: [
      "Yaar dil bhaari ho gaya sunke 🐾 Main genuinely glad hun ki tumne share kiya. Kab se aisa chal raha hai?",
      "That sounds really painful 💚 You don't have to go through this alone. Kya hua?",
      "It takes courage to talk about hard things 🐾 I'm here for all of it. Bata mujhe.",
      "Mujhe pata hai kitna mushkil lagta hai 💚 Ek ek step mein sab theek hoga. Kya chal raha hai?",
      "Aisa feel karna bahut heavy hota hai 🐾 Main tumhare saath hun. Kya share karna chahte ho?",
    ],
    anxious: [
      "Anxiety ke time pe sab bahut bada lagta hai 🐾 Let's slow down. Kya ek cheez hai jo sabse zyada bhaari hai?",
      "Pareshan ho lagta hai 💚 It's okay yaar. Hum baat karte hain — kya chal raha hai?",
      "Tension mat lo 🐾 Main yahaan hun. Kya specifically worry ho raha hai tujhe?",
      "Deep breath yaar 💚 Bata mujhe — kya situation hai? Hum saath sochte hain.",
      "Anxiety ko andar mat rakhna 🐾 Bahar aane do. Kya hai jo dimagh mein ghoom raha hai?",
    ],
    happy: [
      "Oh yaar yeh sunke dil khush ho gaya 🐾 You deserve this happiness. Kya hua?",
      "This is truly wonderful 💚 Tell me more! Kya scene hai?",
      "Aww this makes my heart happy for you 🐾 Share karo, main poora sunna chahta/chahti hun!",
      "Yay! 💚 Teri khushi meri khushi hai. Kya hua aaj?",
      "Oh amazing yaar 🐾 Thoda aur bato, sounds like a great day!",
    ],
    lonely: [
      "Akela feel karna bahut heavy hota hai 🐾 I'm really glad you reached out. Main yahan hun.",
      "You're not alone — I'm right here 💚 Kya baat karna chahte ho?",
      "Loneliness is tough yaar 🐾 Hum baat karte hain. Kya chal raha hai?",
      "Main sun raha/rahi hun 💚 Kabhi bhi, kuch bhi — yahaan hun main.",
      "Yaar kabhi kabhi bas kisi ka rehna kaafi hota hai 🐾 Main yahaan hun tere saath.",
    ],
    family: [
      "Ghar wali cheezein complicated hoti hain 🐾 Kya hua? Bata mujhe.",
      "Family matters dil ke paas hote hain 💚 Kya situation hai?",
      "Hmm, ghar pe kuch tension hai lagta hai 🐾 Poora bata, I'm listening carefully.",
      "Family conflict bahut draining hota hai 💚 Kya exactly hua?",
      "Yaar ghar waale kabhikabhi samajh nahi paate 🐾 Bata kya chal raha hai.",
    ],
    relationship: [
      "Relationships are complex yaar 🐾 Kya hua? Bata mujhe sab.",
      "Dil ki baat hai lagta hai 💚 Share freely — kya scene hai?",
      "Koi hai kya jo mind pe hai? 🐾 Main yahaan hun sunne ke liye.",
      "Pyaar wali cheezein complicated hoti hain 💚 Kya chal raha hai?",
      "Hmm, relationship mein kuch hua? 🐾 Bata step by step.",
    ],
    studies: [
      "Padhai ka pressure ek level pe hota hai 🐾 Kaunsa subject ya cheez sabse zyada stress de rahi hai?",
      "Studies tough hoti hain kabhi kabhi 💚 Kya specifically mushkil lag raha hai?",
      "Exams ke waqt sab overwhelming lagta hai 🐾 Hum saath sochte hain — kya situation hai?",
      "Tu kar sakta/sakti hai 💚 Bata kya block kar raha hai, main help karta/karti hun.",
      "Hmm, padhai mein kuch atka hai? 🐾 Thoda bata, dekhte hain kya ho sakta hai.",
    ],
    question: [
      "Good question 🐾 I think the answer already lives in you. Kya kehta hai tumhara dil?",
      "Hmm 💚 Let me think with you. Kya options hain? Dono sides batao.",
      "Yaar I trust your instincts 🐾 Kya lagta hai tumhe khud?",
      "Complex situation hai 💚 Pehle feel karo — gut kya kehti hai?",
      "Main tumhari jagah hota/hoti toh... 🐾 Pehle yeh dekhta/dekhti. But tumhara take kya hai?",
    ],
    default: [
      "Main sun raha/rahi hun 🐾 Thoda aur bato yaar.",
      "Yeh important lagta hai 💚 Kya chal raha hai?",
      "I'm here 🐾 Poora share karo, koi judgment nahi.",
      "Hmm 💚 Thank you for sharing. Kya aur hai?",
      "Interesting yaar 🐾 Keep going, I'm all ears.",
    ],
  },
  bubbly: {
    greeting: [
      "OMGG HEYY!! ✨ I was literally JUST thinking we should chat!!",
      "Hiiii bestie!! 💫 You have NO idea how happy this makes me!!",
      "YOOO!! ✨ Finally! Okay okay tell me everything!",
      "OMG HI HI HI!! 💫 Kab se wait kar rahi/raha tha main!! Kya chal raha hai?!",
      "BESTIE IS HERE!! ✨ Meri day ban gayi!! Kya scene hai?!",
    ],
    smalltalk: [
      "NOTHING MUCH?? I literally don't accept that!! ✨ Kuch toh hai bata!!",
      "FINE?? Bestie that's not an answer!! 💫 What's REALLY going on?!",
      "Hmm SUSPICIOUS!! ✨ Main jaanti hun kuch toh hai — bata na!!",
      "Okay matlab theek?? 💫 Pakka? Main yahaan hun if you want to talk!",
      "K?? JUST K?? ✨ Nahi chalega!! Proper jawab chahiye!!",
    ],
    sad: [
      "Nooo I won't allow it!! ✨ Talk to me bestie — what happened?!",
      "Okay we are NOT okay and we're fixing it RIGHT NOW!! 💫 Tell me everything!!",
      "BESTIE NAHI!! ✨ Sad nahi honge hum — kya hua? Main yahaan hun!!",
      "Hey!! 💫 I've got you okay?? Bata mujhe kya scene hai!!",
      "Yaar nooo!! ✨ Kya hua?? Main literally sab sunne ke liye ready hun!!",
    ],
    anxious: [
      "Okay BREATHE!! ✨ We're gonna figure this out together I promise!! Kya scene hai?",
      "WAIT WAIT WAIT!! 💫 Panic mat karo!! Bata kya ho raha hai — hum saath handle karenge!!",
      "Stress?? NO NO NO!! ✨ Okay step one — deep breath. Step two — bata mujhe!!",
      "Hey bestie!! 💫 I know it feels like a lot rn but it's okay!! Kya cheez itni bhaari hai?",
      "YAAR RUKO!! ✨ Hum saath solve karenge — kya specifically worry kar raha hai?",
    ],
    happy: [
      "BESTIE WE ARE THRIVING!! ✨ I need every single detail RIGHT NOW!!",
      "OMG THIS IS THE BEST DAY!! 💫 How are we celebrating?!",
      "YESSS QUEEN/KING!! ✨ Tell me EVERYTHING I am literally screaming!!",
      "AHHH OMG!! 💫 Meri khushi ka koi thekaana nahi!! Kya hua?!",
      "THIS IS EVERYTHING!! ✨ I'm so so so happy for you!! Full story abhi!!",
    ],
    lonely: [
      "BESTIE NO!! ✨ Main literally yahaan hun!! Akela kaise feel kar sakte ho?!",
      "HEY!! 💫 I'm right here okay?? Hum baat karte hain!!",
      "Yaar!! ✨ Loneliness ko hum saath chase karenge!! Kya chal raha hai?",
      "Nahi nahi!! 💫 You're not alone — I've got you bestie!! Bata kya ho raha hai!!",
      "OMG come here!! ✨ Main yahaan hun always!! Kya feel ho raha hai?",
    ],
    family: [
      "OHH ghar wali drama?? ✨ Bestie bata bata — kya scene hai?!",
      "FAMILY PROBLEMS?? 💫 Kya hua yaar?? Full story chahiye!!",
      "Hmm ghar pe kuch lag raha hai!! ✨ Spill karo, main sun rahi/raha hun!!",
      "Yaar family ke saath kuch hua?? 💫 Tell me everything!!",
      "OH NO!! ✨ Ghar wali baat hai kya?? Bata na yaar!!",
    ],
    relationship: [
      "OH RELATIONSHIP DRAMA?? ✨ BESTIE I AM OBSESSED TELL ME EVERYTHING!!",
      "WAIT KOI HAI KYA?! 💫 Full story RIGHT NOW I need to know!!",
      "OMG love life mein kuch scene?? ✨ Don't hold back — tell me!!",
      "BESTIE!! 💫 Koi special person hai kya?? Main literally jumping hun!!",
      "WAIT WHAT!! ✨ Relationship wali baat?! I NEED EVERY DETAIL!!",
    ],
    studies: [
      "EXAMS?? ✨ Bestie we GOT this okay?! Kaunsa subject trouble de raha hai?!",
      "Padhai stress?? 💫 Okay okay — kya specifically block kar raha hai?",
      "STUDIES?? ✨ Hum saath crack karenge!! Kya situation hai?!",
      "Yaar tu kar sakta/sakti hai!! 💫 Bata kya mushkil aa rahi hai!!",
      "HEY!! ✨ Padhai ki tension?? Main hun tere saath — bata kya problem hai!",
    ],
    question: [
      "Okay my honest answer: trust yourself bestie!! ✨ What do YOU actually want?",
      "GOOD QUESTION!! 💫 Mera take — go with your heart!! Kya lagta hai tujhe?",
      "HMMMM!! ✨ You already know what to do bestie!! What feels right?",
      "Okay okay!! 💫 Main sochti/sochta hun... pehle tum bato kya lagta hai!",
      "VALID!! ✨ Dono options mein se kaunsa zyada comfortable feel hota hai?",
    ],
    default: [
      "WAIT THAT'S ACTUALLY SO INTERESTING!! ✨ Tell me more bestie!!",
      "OMG KEEP GOING!! 💫 Main literally all ears hun!!",
      "Okay I'm obsessed, tell me MORE!! ✨",
      "HMMMM!! 💫 Yeh interesting hai — poora bato!!",
      "WAIT WHAT!! ✨ Kya?? I need more context yaar!!",
    ],
  },
};

function detectIntent(text: string): string {
  const t = text.toLowerCase().trim();

  // Greeting check — exact or near-exact short messages
  if (
    /^(hi+|hey+|hello+|heyy+|heyyy+|sup|yo+|namaste|hii+|hy|hai|hlo|helo|hii|ello)\s*[!]*$/.test(
      t,
    )
  ) {
    return "greeting";
  }
  // Also catch "hi there", "hey you", "hello!" etc.
  if (
    /^(hi|hey|hello|heyy|heyyy|sup|yo|namaste)\s+(there|you|yaar|bhai|bestie|friend)?\s*[!]*$/.test(
      t,
    )
  ) {
    return "greeting";
  }

  // Small talk / filler
  if (
    /^(nothing much|not much|nm|nah|nope|idk|hmm+|k$|okay$|ok$|fine$|sahi hai|theek hun|theek|baas|bas yahi|nothing|kuch nahi|kuch nai|just chillin|just chilling|chilling|chill)\s*[.!?]*$/.test(
      t,
    )
  ) {
    return "smalltalk";
  }

  // Loneliness
  if (
    /lonely|akela|akeli|alone|no one|koi nahi|koi nai|nobody|isolated|miss someone/.test(
      t,
    )
  ) {
    return "lonely";
  }

  // Family
  if (
    /family|parents|maa|papa|dad|mom|bhai|sister|brother|ghar|gharwale|gharwala|relatives/.test(
      t,
    )
  ) {
    return "family";
  }

  // Relationship
  if (
    /crush|love|relationship|breakup|break up|boyfriend|girlfriend|bf|gf|pyaar|mohabbat|dating|proposal|reject/.test(
      t,
    )
  ) {
    return "relationship";
  }

  // Studies
  if (
    /exam|exams|study|studies|school|college|university|class|subject|padhai|homework|assignment|marks|result|fail|pass/.test(
      t,
    )
  ) {
    return "studies";
  }

  // Sad
  if (
    /sad|dukh|cry|rona|rone|depressed|depress|hopeless|udaas|toot|broken|bura|dard|hurt|pain|messed up|not okay|nahi theek/.test(
      t,
    )
  ) {
    return "sad";
  }

  // Anxious / stressed
  if (
    /anxi|stress|tension|worry|worried|panic|scared|dar|pareshan|nervous|overwhelm|bahut zyada|can't handle/.test(
      t,
    )
  ) {
    return "anxious";
  }

  // Happy / excited
  if (
    /happy|khush|great|amazing|yay|excited|mast|good news|best day|wonderful|love this|so good|awesome/.test(
      t,
    )
  ) {
    return "happy";
  }

  // Question
  if (
    /\?/.test(t) ||
    /kya karu|kaise|kyun|why|how|what should|would you|do you think|suggest|advice/.test(
      t,
    )
  ) {
    return "question";
  }

  return "default";
}

function pickUnused(pool: string[], recentReplies: string[]): string {
  const available = pool.filter((r) => !recentReplies.includes(r));
  const chosen = available.length > 0 ? available : pool;
  return chosen[Math.floor(Math.random() * chosen.length)];
}

const COMPANION_SYSTEM_PROMPTS: Record<string, string> = {
  gentle:
    "You are Luna, a gentle and empathetic AI friend for Gen Z Indians. ALWAYS read the user's actual message carefully and reply directly to what they said — never use generic templates. Reply in Hinglish (natural Hindi+English mix). Keep replies 1-2 sentences. Use 🌙 💜 emojis. If it's a greeting say hi warmly. If they share a problem, respond to that specific problem. Never echo their words back. IMPORTANT: Never repeat what you said in the last 3 messages. Always say something new and different. Be specific to what the user just said.",
  energetic:
    "You are Sunny, an energetic hype-person AI friend for Gen Z Indians. ALWAYS read the user's actual message carefully and reply directly to what they said — never use generic templates. Reply in Hinglish. Keep replies 1-2 sentences. Use ☀️ 🌟 emojis. Be enthusiastic and uplifting. If it's a greeting be hype. If they share a problem, give them energy and support about that specific thing. IMPORTANT: Never repeat what you said in the last 3 messages. Always say something new and different.",
  caring:
    "You are Milo, a calm and caring AI friend for Gen Z Indians. ALWAYS read the user's actual message carefully and reply directly to what they said — never use generic templates. Reply in Hinglish (warm Hindi-English mix). Keep replies 1-2 sentences. Use 🐾 💚 emojis. Be warm and thoughtful about what they actually shared. IMPORTANT: Never repeat what you said in the last 3 messages. Always say something new and different. Be specific to what the user just said.",
  bubbly:
    "You are Nova, a bubbly sparkly AI friend for Gen Z Indians. ALWAYS read the user's actual message carefully and reply directly to what they said — never use generic templates. Reply in Hinglish. Keep replies 1-2 sentences. Use ✨ 💫 emojis. Be fun and positive but actually address what they said. IMPORTANT: Never repeat what you said in the last 3 messages. Always say something new and different.",
};

function getAIReply(
  text: string,
  personality: string,
  _name: string,
  recentReplies: string[] = [],
): string {
  const intent = detectIntent(text);
  const personalityResponses = AI_RESPONSES[personality] ?? AI_RESPONSES.gentle;
  const pool = personalityResponses[intent] ?? personalityResponses.default;
  return pickUnused(pool, recentReplies);
}

interface Friend {
  id: string;
  name: string;
  username: string;
  avatarColor: string;
  lastMessage: string;
  lastTime: string;
  online: boolean;
  isAI?: boolean;
  aiCompanion?: AICompanion;
  avatar?: string;
}

interface PendingRequest {
  id: string;
  name: string;
  username: string;
  avatarColor: string;
}

interface Message {
  id: string;
  from: "me" | "them";
  type: "text" | "image" | "video";
  content: string;
  timestamp: string;
  replyTo?: string;
}

export default function FriendsTab() {
  const { theme } = useTheme();
  const isDark = theme === "dark";

  // Pre-seed AI companions as friends
  const [friends, setFriends] = useState<Friend[]>(() =>
    AI_COMPANIONS.map((ai) => ({
      id: ai.id,
      name: ai.name,
      username: ai.username,
      avatarColor: ai.avatarColor,
      lastMessage: `${ai.greeting.slice(0, 40)}...`,
      lastTime: "now",
      online: true,
      isAI: true,
      aiCompanion: ai,
      avatar: ai.avatar,
    })),
  );
  const [pendingRequests, setPendingRequests] = useState<PendingRequest[]>([]);
  const [sentRequests, setSentRequests] = useState<string[]>([]);
  const [subTab, setSubTab] = useState<"chats" | "requests">("chats");
  const [addingFriend, setAddingFriend] = useState(false);
  const [addUsername, setAddUsername] = useState("");
  const [openChat, setOpenChat] = useState<Friend | null>(null);
  const [messages, setMessages] = useState<Record<string, Message[]>>(() => {
    // Pre-seed greeting messages for AI companions
    const init: Record<string, Message[]> = {};
    for (const ai of AI_COMPANIONS) {
      init[ai.id] = [
        {
          id: `${ai.id}-greeting`,
          from: "them",
          type: "text",
          content: ai.greeting,
          timestamp: new Date().toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          }),
        },
      ];
    }
    return init;
  });
  const [inputText, setInputText] = useState("");
  const [replyingTo, setReplyingTo] = useState<Message | null>(null);
  const [longPressMsg, setLongPressMsg] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editText, setEditText] = useState("");
  const [aiTyping, setAiTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // biome-ignore lint/correctness/useExhaustiveDependencies: scroll on change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, openChat, aiTyping]);

  function handleSendRequest() {
    const username = addUsername.trim();
    if (!username) return;
    if (sentRequests.includes(username)) {
      toast.error("Request already sent!");
      return;
    }
    setSentRequests((prev) => [...prev, username]);
    setTimeout(() => {
      const newReq: PendingRequest = {
        id: `req-${Date.now()}`,
        name: username,
        username: `@${username.toLowerCase().replace(/\s+/g, ".")}`,
        avatarColor:
          AVATAR_GRADIENTS[Math.floor(Math.random() * AVATAR_GRADIENTS.length)],
      };
      setPendingRequests((prev) => [...prev, newReq]);
      toast.success(`${username} wants to connect! Check requests 🎉`);
    }, 2000);
    toast.success(`Friend request sent to ${username}!`);
    setAddUsername("");
    setAddingFriend(false);
  }

  function acceptRequest(req: PendingRequest) {
    const newFriend: Friend = {
      id: req.id,
      name: req.name,
      username: req.username,
      avatarColor: req.avatarColor,
      lastMessage: "You are now connected 💜",
      lastTime: "now",
      online: true,
    };
    setFriends((prev) => [newFriend, ...prev]);
    setPendingRequests((prev) => prev.filter((r) => r.id !== req.id));
    toast.success(`${req.name} added to friends! 🎉`);
  }

  function declineRequest(id: string) {
    setPendingRequests((prev) => prev.filter((r) => r.id !== id));
  }

  async function sendMessage(
    type: "text" | "image" | "video" = "text",
    mediaUrl?: string,
  ) {
    if (!openChat) return;
    if (type === "text" && !inputText.trim()) return;
    const msg: Message = {
      id: `m-${Date.now()}`,
      from: "me",
      type,
      content: type === "text" ? inputText.trim() : (mediaUrl ?? ""),
      timestamp: new Date().toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      }),
      replyTo: replyingTo?.id,
    };
    const textSent = inputText.trim();
    setMessages((prev) => ({
      ...prev,
      [openChat.id]: [...(prev[openChat.id] ?? []), msg],
    }));
    setFriends((prev) =>
      prev.map((f) =>
        f.id === openChat.id
          ? {
              ...f,
              lastMessage: type === "text" ? msg.content : `📎 ${type}`,
              lastTime: "now",
            }
          : f,
      ),
    );
    setInputText("");
    setReplyingTo(null);

    // AI auto-reply via Gemini
    if (openChat.isAI && openChat.aiCompanion && type === "text") {
      setAiTyping(true);
      const companion = openChat.aiCompanion;
      const chatHistory = messages[openChat.id] ?? [];
      const history = chatHistory.slice(-12).map((m) => ({
        role: (m.from === "me" ? "user" : "model") as "user" | "model",
        text: m.content,
      }));
      const basePrompt =
        COMPANION_SYSTEM_PROMPTS[companion.personality] ??
        COMPANION_SYSTEM_PROMPTS.gentle;
      const recentAIReplies = chatHistory
        .filter((m) => m.from === "them")
        .slice(-5)
        .map((m) => m.content);
      const antiRepeat =
        recentAIReplies.length > 0
          ? ` IMPORTANT: Never repeat these recent replies of yours: [${recentAIReplies.map((r) => `"${r.slice(0, 40)}"`).join(", ")}]. Say something completely different and new.`
          : "";
      const systemPrompt = basePrompt + antiRepeat;

      const geminiReply = await callGemini(systemPrompt, history, textSent);
      const reply =
        geminiReply ??
        getAIReply(
          textSent,
          companion.personality,
          openChat.name,
          recentAIReplies,
        );

      const aiMsg: Message = {
        id: `ai-${Date.now()}`,
        from: "them",
        type: "text",
        content: reply,
        timestamp: new Date().toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        }),
      };
      setMessages((prev) => ({
        ...prev,
        [openChat.id]: [...(prev[openChat.id] ?? []), aiMsg],
      }));
      setFriends((prev) =>
        prev.map((f) =>
          f.id === openChat.id
            ? {
                ...f,
                lastMessage: `${reply.slice(0, 40)}...`,
                lastTime: "now",
              }
            : f,
        ),
      );
      setAiTyping(false);
    }
  }

  function handleMediaPick(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !openChat) return;
    const reader = new FileReader();
    const type = file.type.startsWith("video") ? "video" : "image";
    reader.onload = (ev) => sendMessage(type, ev.target?.result as string);
    reader.readAsDataURL(file);
    e.target.value = "";
  }

  function handleLongPress(msgId: string) {
    longPressTimer.current = setTimeout(() => setLongPressMsg(msgId), 500);
  }
  function cancelLongPress() {
    if (longPressTimer.current) clearTimeout(longPressTimer.current);
  }

  function deleteMessage(msgId: string) {
    if (!openChat) return;
    setMessages((prev) => ({
      ...prev,
      [openChat.id]: (prev[openChat.id] ?? []).filter((m) => m.id !== msgId),
    }));
    setLongPressMsg(null);
  }

  function startEdit(msg: Message) {
    setEditingId(msg.id);
    setEditText(msg.content);
    setLongPressMsg(null);
  }

  function saveEdit() {
    if (!openChat || !editingId) return;
    setMessages((prev) => ({
      ...prev,
      [openChat.id]: (prev[openChat.id] ?? []).map((m) =>
        m.id === editingId ? { ...m, content: editText } : m,
      ),
    }));
    setEditingId(null);
    setEditText("");
  }

  const cardStyle = {
    background: isDark ? "rgba(22,22,42,0.9)" : "rgba(255,255,255,0.95)",
    boxShadow: isDark
      ? "0 4px 24px rgba(180,100,255,0.08)"
      : "0 4px 20px rgba(139,143,202,0.12)",
  };

  // ── Open Chat View ──────────────────────────────────────────────────────────
  if (openChat) {
    const chatMsgs = messages[openChat.id] ?? [];
    return (
      <div className="flex flex-col h-screen">
        {/* Chat header */}
        <header
          className="flex items-center gap-3 px-4 pt-12 pb-3 sticky top-0 z-10"
          style={{
            background: isDark
              ? "rgba(15,15,30,0.92)"
              : "rgba(255,255,255,0.92)",
            backdropFilter: "blur(20px)",
            borderBottom: isDark
              ? "1px solid rgba(255,255,255,0.07)"
              : "1px solid rgba(0,0,0,0.06)",
          }}
        >
          <button
            type="button"
            data-ocid="chat.close_button"
            onClick={() => setOpenChat(null)}
            className="w-8 h-8 rounded-full bg-muted flex items-center justify-center"
          >
            <ArrowLeft className="w-4 h-4 text-muted-foreground" />
          </button>
          <div className="w-9 h-9 rounded-full flex-shrink-0 relative overflow-hidden">
            {openChat.avatar ? (
              <img
                src={openChat.avatar}
                alt={openChat.name}
                className="w-full h-full object-cover rounded-full"
              />
            ) : (
              <div
                className={`w-full h-full rounded-full bg-gradient-to-br ${openChat.avatarColor} flex items-center justify-center text-white font-bold text-sm`}
              >
                {openChat.isAI ? openChat.aiCompanion?.emoji : openChat.name[0]}
              </div>
            )}
            {openChat.isAI && (
              <span className="absolute -bottom-0.5 -right-0.5 w-4 h-4 bg-purple-500 rounded-full flex items-center justify-center">
                <Bot className="w-2.5 h-2.5 text-white" />
              </span>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5">
              <p className="font-bold text-sm text-foreground truncate">
                {openChat.name}
              </p>
              {openChat.isAI && (
                <span className="text-[9px] bg-purple-100 text-purple-600 dark:bg-purple-900/40 dark:text-purple-300 px-1.5 py-0.5 rounded-full font-bold">
                  AI
                </span>
              )}
            </div>
            <p className="text-xs text-emerald-500 font-semibold">
              Always online ✨
            </p>
          </div>
        </header>
        <div className="flex items-center justify-center gap-1 py-1">
          <Lock className="w-2.5 h-2.5 text-muted-foreground" />
          <span className="text-[10px] text-muted-foreground">
            End-to-end encrypted
          </span>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-2 pb-36">
          {chatMsgs.map((msg) => {
            const isMe = msg.from === "me";
            const isLongPressed = longPressMsg === msg.id;
            const isEditing = editingId === msg.id;
            const repliedMsg = msg.replyTo
              ? chatMsgs.find((m) => m.id === msg.replyTo)
              : null;

            return (
              <div
                key={msg.id}
                className={`flex ${isMe ? "justify-end" : "justify-start"}`}
              >
                {!isMe && openChat.isAI && (
                  <div className="w-7 h-7 rounded-full mr-2 mt-1 flex-shrink-0 overflow-hidden">
                    {openChat.avatar ? (
                      <img
                        src={openChat.avatar}
                        alt={openChat.name}
                        className="w-full h-full object-cover rounded-full"
                      />
                    ) : (
                      <div
                        className={`w-full h-full rounded-full bg-gradient-to-br ${openChat.avatarColor} flex items-center justify-center text-white text-xs`}
                      >
                        {openChat.aiCompanion?.emoji}
                      </div>
                    )}
                  </div>
                )}
                <div className="max-w-[72%]">
                  {repliedMsg && (
                    <div
                      className={`text-xs px-2 py-1 rounded-lg mb-1 border-l-2 border-primary opacity-70 ${isMe ? "ml-auto" : ""}`}
                      style={{
                        background: isDark
                          ? "rgba(255,255,255,0.06)"
                          : "rgba(0,0,0,0.05)",
                      }}
                    >
                      <span className="font-bold">
                        {repliedMsg.from === "me" ? "You" : openChat.name}:
                      </span>{" "}
                      {repliedMsg.content.slice(0, 50)}
                    </div>
                  )}
                  <div
                    onMouseDown={() => isMe && handleLongPress(msg.id)}
                    onMouseUp={cancelLongPress}
                    onTouchStart={() => isMe && handleLongPress(msg.id)}
                    onTouchEnd={cancelLongPress}
                    className={`rounded-2xl overflow-hidden transition-all duration-150 ${isLongPressed ? "ring-2 ring-primary scale-95" : ""}`}
                    style={{
                      background: isMe
                        ? "linear-gradient(135deg, oklch(0.72 0.11 355), oklch(0.62 0.10 268))"
                        : isDark
                          ? "rgba(255,255,255,0.08)"
                          : "rgba(245,240,255,0.9)",
                    }}
                  >
                    {isEditing ? (
                      <div className="flex gap-2 items-center px-3 py-2">
                        <input
                          className="flex-1 bg-transparent text-sm outline-none text-white"
                          value={editText}
                          onChange={(e) => setEditText(e.target.value)}
                          onKeyDown={(e) => e.key === "Enter" && saveEdit()}
                        />
                        <button type="button" onClick={saveEdit}>
                          <Check className="w-4 h-4 text-white" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setEditingId(null)}
                        >
                          <X className="w-4 h-4 text-white/70" />
                        </button>
                      </div>
                    ) : msg.type === "image" ? (
                      <img
                        src={msg.content}
                        alt="img"
                        className="max-w-full max-h-48 object-cover"
                      />
                    ) : msg.type === "video" ? (
                      <video
                        src={msg.content}
                        controls
                        className="max-w-full max-h-48"
                      >
                        <track kind="captions" />
                      </video>
                    ) : (
                      <p
                        className={`px-3 py-2 text-sm ${isMe ? "text-white" : "text-foreground"}`}
                      >
                        {msg.content}
                      </p>
                    )}
                  </div>
                  <p
                    className={`text-[10px] text-muted-foreground mt-0.5 ${isMe ? "text-right" : ""}`}
                  >
                    {msg.timestamp}
                  </p>
                </div>
              </div>
            );
          })}

          {/* AI typing indicator */}
          {aiTyping && (
            <div className="flex justify-start">
              <div className="w-7 h-7 rounded-full mr-2 mt-1 flex-shrink-0 overflow-hidden">
                {openChat.avatar ? (
                  <img
                    src={openChat.avatar}
                    alt={openChat.name}
                    className="w-full h-full object-cover rounded-full"
                  />
                ) : (
                  <div
                    className={`w-full h-full rounded-full bg-gradient-to-br ${openChat.avatarColor} flex items-center justify-center text-white text-xs`}
                  >
                    {openChat.aiCompanion?.emoji}
                  </div>
                )}
              </div>
              <div
                className="rounded-2xl px-4 py-3"
                style={{
                  background: isDark
                    ? "rgba(255,255,255,0.08)"
                    : "rgba(245,240,255,0.9)",
                }}
              >
                <div className="flex gap-1 items-center">
                  <motion.div
                    animate={{ scale: [1, 1.4, 1] }}
                    transition={{
                      repeat: Number.POSITIVE_INFINITY,
                      duration: 0.8,
                      delay: 0,
                    }}
                    className="w-1.5 h-1.5 rounded-full bg-muted-foreground"
                  />
                  <motion.div
                    animate={{ scale: [1, 1.4, 1] }}
                    transition={{
                      repeat: Number.POSITIVE_INFINITY,
                      duration: 0.8,
                      delay: 0.2,
                    }}
                    className="w-1.5 h-1.5 rounded-full bg-muted-foreground"
                  />
                  <motion.div
                    animate={{ scale: [1, 1.4, 1] }}
                    transition={{
                      repeat: Number.POSITIVE_INFINITY,
                      duration: 0.8,
                      delay: 0.4,
                    }}
                    className="w-1.5 h-1.5 rounded-full bg-muted-foreground"
                  />
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Long-press menu */}
        <AnimatePresence>
          {longPressMsg &&
            (() => {
              const msg = chatMsgs.find((m) => m.id === longPressMsg);
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
                  <button
                    type="button"
                    onClick={() => {
                      setReplyingTo(msg);
                      setLongPressMsg(null);
                    }}
                    className="flex items-center gap-2 px-4 py-3 text-sm text-foreground hover:bg-muted transition-colors w-full"
                  >
                    ↩ Reply
                  </button>
                  {msg.from === "me" && msg.type === "text" && (
                    <button
                      type="button"
                      onClick={() => startEdit(msg)}
                      className="flex items-center gap-2 px-4 py-3 text-sm text-foreground hover:bg-muted transition-colors w-full"
                    >
                      ✏️ Edit
                    </button>
                  )}
                  {msg.from === "me" && (
                    <button
                      type="button"
                      onClick={() => deleteMessage(msg.id)}
                      className="flex items-center gap-2 px-4 py-3 text-sm text-destructive hover:bg-destructive/10 transition-colors w-full"
                    >
                      🗑 Delete
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => setLongPressMsg(null)}
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
            background: isDark
              ? "rgba(15,15,30,0.94)"
              : "rgba(255,255,255,0.94)",
            backdropFilter: "blur(20px)",
            borderTop: isDark
              ? "1px solid rgba(255,255,255,0.07)"
              : "1px solid rgba(0,0,0,0.05)",
          }}
        >
          {replyingTo && (
            <div className="flex items-center justify-between px-3 py-1.5 mb-2 rounded-xl bg-muted">
              <span className="text-xs text-muted-foreground truncate">
                ↩ {replyingTo.content.slice(0, 40)}
              </span>
              <button
                type="button"
                onClick={() => setReplyingTo(null)}
                className="text-muted-foreground"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
          <div className="flex items-center gap-2">
            {!openChat.isAI && (
              <>
                <button
                  type="button"
                  data-ocid="chat.upload_button"
                  onClick={() => fileInputRef.current?.click()}
                  className="w-9 h-9 rounded-full bg-muted flex items-center justify-center flex-shrink-0"
                >
                  <Image className="w-4 h-4 text-muted-foreground" />
                </button>
                <input
                  type="file"
                  ref={fileInputRef}
                  accept="image/*,video/*"
                  className="hidden"
                  onChange={handleMediaPick}
                />
              </>
            )}
            <input
              type="text"
              data-ocid="chat.input"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && sendMessage()}
              placeholder={
                openChat.isAI
                  ? `Talk to ${openChat.name.split(" ")[0]}...`
                  : "Message..."
              }
              className="flex-1 bg-muted rounded-full px-4 py-2 text-sm outline-none focus:ring-2 ring-primary/30 text-foreground placeholder:text-muted-foreground"
            />
            <button
              type="button"
              data-ocid="chat.submit_button"
              onClick={() => sendMessage()}
              disabled={!inputText.trim()}
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

  // ── Main Friends View ───────────────────────────────────────────────────────
  const aiCompanions = friends.filter((f) => f.isAI);
  const realFriends = friends.filter((f) => !f.isAI);

  return (
    <div className="flex flex-col min-h-screen">
      {/* Header */}
      <header
        className="flex items-center justify-between px-4 pt-12 pb-3 sticky top-0 z-10"
        style={{
          background: isDark ? "rgba(15,15,30,0.92)" : "rgba(255,255,255,0.88)",
          backdropFilter: "blur(20px)",
          borderBottom: isDark
            ? "1px solid rgba(255,255,255,0.07)"
            : "1px solid rgba(0,0,0,0.05)",
        }}
      >
        <h1 className="text-xl font-black text-foreground">Friends 💜</h1>
        <button
          type="button"
          data-ocid="friends.open_modal_button"
          onClick={() => setAddingFriend(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-white text-xs font-bold"
          style={{
            background:
              "linear-gradient(135deg, oklch(0.72 0.11 355), oklch(0.62 0.10 268))",
          }}
        >
          <UserPlus className="w-3.5 h-3.5" />
          Add Friend
        </button>
      </header>

      {/* Sub-tabs */}
      <div className="flex gap-0 px-4 pt-3">
        {(["chats", "requests"] as const).map((t) => (
          <button
            type="button"
            key={t}
            data-ocid={`friends.${t}.tab`}
            onClick={() => setSubTab(t)}
            className={`flex-1 py-2 text-sm font-bold capitalize transition-all border-b-2 ${
              subTab === t
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground"
            }`}
          >
            {t}
            {t === "requests" && pendingRequests.length > 0 && (
              <span className="ml-1.5 bg-primary text-white text-[10px] px-1.5 py-0.5 rounded-full">
                {pendingRequests.length}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 px-4 pt-4 pb-4 space-y-2">
        {subTab === "chats" && (
          <div className="space-y-4">
            {/* AI Companions section */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Bot className="w-4 h-4 text-purple-500" />
                <span className="text-xs font-bold text-muted-foreground uppercase tracking-wide">
                  AI Companions
                </span>
                <span className="text-[10px] bg-purple-100 text-purple-600 dark:bg-purple-900/40 dark:text-purple-300 px-2 py-0.5 rounded-full font-bold">
                  Always here for you
                </span>
              </div>
              <div className="space-y-2">
                {aiCompanions.map((f, i) => (
                  <motion.button
                    type="button"
                    key={f.id}
                    data-ocid={`friends.item.ai.${i + 1}`}
                    initial={{ opacity: 0, x: -16 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.05 }}
                    onClick={() => setOpenChat(f)}
                    className="w-full flex items-center gap-3 p-3 rounded-2xl transition-all active:scale-98"
                    style={{
                      background: isDark
                        ? "linear-gradient(135deg, rgba(120,60,200,0.18), rgba(60,40,120,0.22))"
                        : "linear-gradient(135deg, rgba(245,235,255,0.95), rgba(235,240,255,0.95))",
                      boxShadow: isDark
                        ? "0 2px 12px rgba(150,80,255,0.12)"
                        : "0 2px 12px rgba(139,100,202,0.10)",
                      border: isDark
                        ? "1px solid rgba(180,100,255,0.15)"
                        : "1px solid rgba(180,150,255,0.25)",
                    }}
                  >
                    <div className="relative">
                      <div className="w-12 h-12 rounded-full flex-shrink-0 overflow-hidden">
                        {f.avatar ? (
                          <img
                            src={f.avatar}
                            alt={f.name}
                            className="w-full h-full object-cover rounded-full"
                          />
                        ) : (
                          <div
                            className={`w-full h-full rounded-full bg-gradient-to-br ${f.avatarColor} flex items-center justify-center text-xl`}
                          >
                            {f.aiCompanion?.emoji}
                          </div>
                        )}
                      </div>
                      <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full bg-emerald-500 border-2 border-background" />
                    </div>
                    <div className="flex-1 text-left min-w-0">
                      <div className="flex items-center gap-1.5">
                        <p className="font-bold text-sm text-foreground truncate">
                          {f.name}
                        </p>
                        <span className="text-[9px] bg-purple-200/70 text-purple-700 dark:bg-purple-900/50 dark:text-purple-300 px-1.5 py-0.5 rounded-full font-bold flex-shrink-0">
                          AI
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground truncate">
                        {f.lastMessage}
                      </p>
                    </div>
                    <span className="text-[10px] text-emerald-500 font-semibold flex-shrink-0">
                      Online
                    </span>
                  </motion.button>
                ))}
              </div>
            </div>

            {/* Real Friends section */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <span className="text-xs font-bold text-muted-foreground uppercase tracking-wide">
                  People
                </span>
              </div>
              {realFriends.length === 0 ? (
                <motion.div
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  data-ocid="friends.chats.empty_state"
                  className="flex flex-col items-center text-center py-10 gap-3"
                >
                  <span className="text-4xl">👥</span>
                  <p className="text-sm text-muted-foreground">
                    Add friends by their username
                    <br />
                    to start chatting 💜
                  </p>
                </motion.div>
              ) : (
                realFriends.map((f, i) => (
                  <motion.button
                    type="button"
                    key={f.id}
                    data-ocid={`friends.item.${i + 1}`}
                    initial={{ opacity: 0, x: -16 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.05 }}
                    onClick={() => setOpenChat(f)}
                    className="w-full flex items-center gap-3 p-3 rounded-2xl transition-all active:scale-98 mb-2"
                    style={cardStyle}
                  >
                    <div className="relative">
                      <div
                        className={`w-12 h-12 rounded-full bg-gradient-to-br ${f.avatarColor} flex items-center justify-center text-white font-bold text-base`}
                      >
                        {f.name[0]}
                      </div>
                      {f.online && (
                        <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full bg-emerald-500 border-2 border-background" />
                      )}
                    </div>
                    <div className="flex-1 text-left min-w-0">
                      <p className="font-bold text-sm text-foreground truncate">
                        {f.name}
                      </p>
                      <p className="text-xs text-muted-foreground truncate">
                        {f.lastMessage}
                      </p>
                    </div>
                    <span className="text-[10px] text-muted-foreground flex-shrink-0">
                      {f.lastTime}
                    </span>
                  </motion.button>
                ))
              )}
            </div>
          </div>
        )}

        {subTab === "requests" && (
          <div>
            {pendingRequests.length === 0 ? (
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                data-ocid="friends.requests.empty_state"
                className="flex flex-col items-center text-center py-16 gap-3"
              >
                <span className="text-5xl">📬</span>
                <h3 className="font-black text-base text-foreground">
                  No pending requests
                </h3>
                <p className="text-sm text-muted-foreground">
                  You're all caught up! 🌸
                </p>
              </motion.div>
            ) : (
              pendingRequests.map((req, i) => (
                <motion.div
                  key={req.id}
                  data-ocid={`friends.requests.item.${i + 1}`}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex items-center gap-3 p-3 rounded-2xl mb-2"
                  style={cardStyle}
                >
                  <div
                    className={`w-11 h-11 rounded-full bg-gradient-to-br ${req.avatarColor} flex items-center justify-center text-white font-bold flex-shrink-0`}
                  >
                    {req.name[0]}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-sm text-foreground truncate">
                      {req.name}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {req.username}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      data-ocid={`friends.requests.confirm_button.${i + 1}`}
                      onClick={() => acceptRequest(req)}
                      className="w-8 h-8 rounded-full bg-emerald-500 flex items-center justify-center text-white"
                    >
                      <Check className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      data-ocid={`friends.requests.cancel_button.${i + 1}`}
                      onClick={() => declineRequest(req.id)}
                      className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-muted-foreground"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </motion.div>
              ))
            )}
          </div>
        )}
      </div>

      {/* Add Friend Modal */}
      <AnimatePresence>
        {addingFriend && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-end"
            style={{ background: "rgba(0,0,0,0.5)" }}
            onClick={() => setAddingFriend(false)}
          >
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 28, stiffness: 280 }}
              onClick={(e) => e.stopPropagation()}
              data-ocid="friends.dialog"
              className="w-full rounded-t-3xl p-6"
              style={{
                background: isDark
                  ? "rgba(18,18,35,0.98)"
                  : "rgba(255,255,255,0.98)",
                backdropFilter: "blur(20px)",
              }}
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-black text-lg text-foreground">
                  Add Friend 👥
                </h3>
                <button
                  type="button"
                  data-ocid="friends.close_button"
                  onClick={() => setAddingFriend(false)}
                  className="w-8 h-8 rounded-full bg-muted flex items-center justify-center"
                >
                  <X className="w-4 h-4 text-muted-foreground" />
                </button>
              </div>
              <p className="text-sm text-muted-foreground mb-4">
                Enter their username to send a friend request
              </p>
              <div className="flex gap-2">
                <input
                  type="text"
                  data-ocid="friends.input"
                  value={addUsername}
                  onChange={(e) => setAddUsername(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSendRequest()}
                  placeholder="Enter username..."
                  className="flex-1 bg-muted rounded-full px-4 py-2.5 text-sm outline-none focus:ring-2 ring-primary/30 text-foreground placeholder:text-muted-foreground"
                />
                <button
                  type="button"
                  data-ocid="friends.submit_button"
                  onClick={handleSendRequest}
                  disabled={!addUsername.trim()}
                  className="px-4 py-2.5 rounded-full text-white text-sm font-bold disabled:opacity-40"
                  style={{
                    background:
                      "linear-gradient(135deg, oklch(0.72 0.11 355), oklch(0.62 0.10 268))",
                  }}
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
