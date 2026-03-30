import { createContext, useContext, useState } from "react";

export type Language = "en" | "hi" | "es" | "hl";

export const LANGUAGE_NAMES: Record<Language, string> = {
  en: "English",
  hi: "\u0939\u093f\u0902\u0926\u0940",
  es: "Espa\u00f1ol",
  hl: "Hinglish",
};

const translations: Record<string, Record<Language, string>> = {
  home: { en: "Home", hi: "\u0939\u094b\u092e", es: "Inicio", hl: "Home" },
  chat: { en: "Chat", hi: "\u091a\u0948\u091f", es: "Chat", hl: "Chat" },
  post: {
    en: "Post",
    hi: "\u092a\u094b\u0938\u094d\u091f",
    es: "Publicar",
    hl: "Post",
  },
  mood: { en: "Mood", hi: "\u092e\u0942\u0921", es: "Estado", hl: "Mood" },
  profile: {
    en: "Profile",
    hi: "\u092a\u094d\u0930\u094b\u092b\u093c\u093e\u0907\u0932",
    es: "Perfil",
    hl: "Profile",
  },
  tagline: {
    en: "Feel seen. Feel heard. Feel safe.",
    hi: "\u0926\u0947\u0916\u0947 \u091c\u093e\u0913\u0964 \u0938\u0941\u0928\u0947 \u091c\u093e\u0913\u0964 \u0938\u0941\u0930\u0915\u094d\u0937\u093f\u0924 \u0930\u0939\u094b\u0964",
    es: "Si\u00e9ntete visto. Escuchado. Seguro.",
    hl: "Feel dekha. Feel suna. Feel safe. \uD83C\uDF38",
  },
  howAreYouFeeling: {
    en: "How are you feeling today?",
    hi: "\u0906\u091c \u0906\u092a \u0915\u0948\u0938\u0947 \u092e\u0939\u0938\u0942\u0938 \u0915\u0930 \u0930\u0939\u0947 \u0939\u0948\u0902?",
    es: "\u00bfC\u00f3mo te sientes hoy?",
    hl: "Aaj kaisa feel ho raha hai? \uD83C\uDF38",
  },
  yourStory: {
    en: "Share your story anonymously",
    hi: "\u0905\u092a\u0928\u0940 \u0915\u0939\u093e\u0928\u0940 \u0917\u0941\u092e\u0928\u093e\u092e \u0930\u0942\u092a \u0938\u0947 \u0938\u093e\u091d\u093e \u0915\u0930\u0947\u0902",
    es: "Comparte tu historia an\u00f3nimamente",
    hl: "Apni story share karo anonymously",
  },
  welcome: {
    en: "Welcome back",
    hi: "\u0935\u093e\u092a\u0938 \u0938\u094d\u0935\u093e\u0917\u0924 \u0939\u0948",
    es: "Bienvenido",
    hl: "Welcome back yaar",
  },
};

interface LanguageContextType {
  lang: Language;
  setLang: (l: Language) => void;
  t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextType>({
  lang: "en",
  setLang: () => {},
  t: (k) => k,
});

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLang] = useState<Language>("en");
  const t = (key: string) => translations[key]?.[lang] ?? key;
  return (
    <LanguageContext.Provider value={{ lang, setLang, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export const useLanguage = () => useContext(LanguageContext);
