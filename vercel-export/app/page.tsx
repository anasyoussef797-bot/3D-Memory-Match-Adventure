"use client";

import { useState, useEffect, useRef } from "react";
import confetti from "canvas-confetti";
import {
  Volume2,
  VolumeX,
  RotateCcw,
  Home,
  CheckCircle,
  Award,
  BookOpen,
  Trophy,
  Compass,
  Sparkles,
  Lock,
  Unlock,
  Check,
  Star,
  Camera,
  ChevronLeft,
  ChevronRight
} from "lucide-react";

// ==========================================
// multilinugual vocab data
// ==========================================
type LanguageCode = "ar" | "en" | "fr" | "de";

interface VocabItem {
  id: string;
  emoji: string;
  ar: { letter: string; letterSpeech: string; word: string; wordSpeech: string };
  en: { letter: string; letterSpeech: string; word: string; wordSpeech: string };
  fr: { letter: string; letterSpeech: string; word: string; wordSpeech: string };
  de: { letter: string; letterSpeech: string; word: string; wordSpeech: string };
}

interface Card {
  id: string;
  itemId: string;
  type: "letter" | "picture" | "word" | "audio";
  content: string;
  isFlipped: boolean;
  isMatched: boolean;
  isCelebrating: boolean;
}

type GameDifficulty = "easy" | "medium" | "hard";

const VOCAB_ITEMS: VocabItem[] = [
  {
    id: "apple",
    emoji: "🍎",
    ar: { letter: "ت", letterSpeech: "تاء", word: "تفاحة", wordSpeech: "تفاحة" },
    en: { letter: "A", letterSpeech: "A", word: "Apple", wordSpeech: "Apple" },
    fr: { letter: "P", letterSpeech: "P", word: "Pomme", wordSpeech: "Pomme" },
    de: { letter: "A", letterSpeech: "A", word: "Apfel", wordSpeech: "Apfel" },
  },
  {
    id: "banana",
    emoji: "🍌",
    ar: { letter: "م", letterSpeech: "ميم", word: "موزة", wordSpeech: "موزة" },
    en: { letter: "B", letterSpeech: "B", word: "Banana", wordSpeech: "Banana" },
    fr: { letter: "B", letterSpeech: "B", word: "Banane", wordSpeech: "Banane" },
    de: { letter: "B", letterSpeech: "B", word: "Banane", wordSpeech: "Banane" },
  },
  {
    id: "camel",
    emoji: "🐫",
    ar: { letter: "ج", letterSpeech: "جيم", word: "جمل", wordSpeech: "جمل" },
    en: { letter: "C", letterSpeech: "C", word: "Camel", wordSpeech: "Camel" },
    fr: { letter: "C", letterSpeech: "C", word: "Chameau", wordSpeech: "Chameau" },
    de: { letter: "K", letterSpeech: "K", word: "Kamel", wordSpeech: "Kamel" },
  },
  {
    id: "dolphin",
    emoji: "🐬",
    ar: { letter: "د", letterSpeech: "دال", word: "دولفين", wordSpeech: "دولفين" },
    en: { letter: "D", letterSpeech: "D", word: "Dolphin", wordSpeech: "Dolphin" },
    fr: { letter: "D", letterSpeech: "D", word: "Dauphin", wordSpeech: "Dauphin" },
    de: { letter: "D", letterSpeech: "D", word: "Delphin", wordSpeech: "Delphin" },
  },
  {
    id: "elephant",
    emoji: "🐘",
    ar: { letter: "ف", letterSpeech: "فاء", word: "فيل", wordSpeech: "فيل" },
    en: { letter: "E", letterSpeech: "E", word: "Elephant", wordSpeech: "Elephant" },
    fr: { letter: "E", letterSpeech: "E", word: "Éléphant", wordSpeech: "Éléphant" },
    de: { letter: "E", letterSpeech: "E", word: "Elefant", wordSpeech: "Elefant" },
  },
  {
    id: "frog",
    emoji: "🐸",
    ar: { letter: "ض", letterSpeech: "ضاد", word: "ضفدع", wordSpeech: "ضفدع" },
    en: { letter: "F", letterSpeech: "F", word: "Frog", wordSpeech: "Frog" },
    fr: { letter: "G", letterSpeech: "G", word: "Grenouille", wordSpeech: "Grenouille" },
    de: { letter: "F", letterSpeech: "F", word: "Frosch", wordSpeech: "Frosch" },
  },
  {
    id: "grape",
    emoji: "🍇",
    ar: { letter: "ع", letterSpeech: "عين", word: "عنب", wordSpeech: "عنب" },
    en: { letter: "G", letterSpeech: "G", word: "Grape", wordSpeech: "Grape" },
    fr: { letter: "R", letterSpeech: "R", word: "Raisin", wordSpeech: "Raisin" },
    de: { letter: "W", letterSpeech: "W", word: "Weintraube", wordSpeech: "Weintraube" },
  },
  {
    id: "rabbit",
    emoji: "🐰",
    ar: { letter: "أ", letterSpeech: "ألف", word: "أرنب", wordSpeech: "أرنب" },
    en: { letter: "R", letterSpeech: "R", word: "Rabbit", wordSpeech: "Rabbit" },
    fr: { letter: "L", letterSpeech: "L", word: "Lapin", wordSpeech: "Lapin" },
    de: { letter: "H", letterSpeech: "H", word: "Hase", wordSpeech: "Hase" },
  },
];

const GAME_MODES = [
  {
    id: 1,
    title: { ar: "حرف ↔ حرف", en: "Letter ↔ Letter", fr: "Lettre ↔ Lettre", de: "Buchstabe ↔ Buchstabe" },
    description: {
      ar: "طابق الحروف المتشابهة وتعلّم نطقها السليم!",
      en: "Match letters that look and sound the same!",
      fr: "Associe les lettres identiques et apprends leur son !",
      de: "Finde gleiche Buchstaben und lerne die Aussprache!",
    },
  },
  {
    id: 2,
    title: { ar: "حرف ↔ صورة", en: "Letter ↔ Picture", fr: "Lettre ↔ Image", de: "Buchstabe ↔ Bild" },
    description: {
      ar: "طابق الحرف مع الصورة التي تبدأ به!",
      en: "Match the starting letter with the correct picture!",
      fr: "Associe la lettre de départ à la bonne image !",
      de: "Ordne den Anfangsbuchstaben dem richtigen Bild zu!",
    },
  },
  {
    id: 3,
    title: { ar: "صورة ↔ كلمة", en: "Picture ↔ Word", fr: "Image ↔ Mot", de: "Bild ↔ Wort" },
    description: {
      ar: "طابق الصورة مع الكلمة المكتوبة المناسبة!",
      en: "Match the cute illustration with its written name!",
      fr: "Associe l'image mignonne à son mot écrit !",
      de: "Verbinde das niedliche Bild mit dem geschriebenen Wort!",
    },
  },
  {
    id: 4,
    title: { ar: "صوت ↔ صورة", en: "Audio ↔ Picture", fr: "Audio ↔ Image", de: "Audio ↔ Bild" },
    description: {
      ar: "استمع لنطق الكلمة ثم ابحث عن صورتها الصحيحة!",
      en: "Listen to the word pronunciation and find the correct picture!",
      fr: "Écoute la prononciation du mot et trouve l'image !",
      de: "Hör dir die Aussprache an und finde das passende Bild!",
    },
  },
  {
    id: 5,
    title: { ar: "صوت ↔ كلمة", en: "Audio ↔ Word", fr: "Audio ↔ Mot", de: "Audio ↔ Wort" },
    description: {
      ar: "استمع لنطق الكلمة ثم اختر الكلمة المكتوبة المطابقة!",
      en: "Listen to the word pronunciation and select the correct written word!",
      fr: "Écoute le mot parlé et sélectionne le mot écrit !",
      de: "Hör dir das Wort an und wähle das geschriebene Wort!",
    },
  },
];

const TRANSLATIONS = {
  ar: {
    hubName: "إمباكت هاب مصر",
    hubDev: "طوّر بواسطة إمباكت هاب مصر",
    collectionName: "مجموعة ألعاب مصر التعليمية - لعبة رقم ٦",
    gameTitle: "مغامرة مطابقة الذاكرة ثلاثية الأبعاد",
    chooseLang: "اختر لغتك المفضلة للبدء",
    chooseMode: "اختر طريقة اللعب",
    chooseDifficulty: "اختر مستوى الصعوبة",
    stars: "النجوم",
    level: "المستوى",
    mode: "النمط",
    unlocked: "تم فتح القفل!",
    progress: "التقدم",
    restart: "إعادة البدء",
    home: "الرئيسية",
    soundOn: "تشغيل الصوت",
    soundOff: "كتم الصوت",
    screenshot: "شهادة نجاح",
    easy: "سهل (٣ أزواج)",
    medium: "متوسط (٤ أزواج)",
    hard: "صعب (٦ أزواج)",
    wellDone: "أحسنت يا بطل!",
    levelUnlockedMsg: "لقد فتحت مستوى جديداً!",
    playAgain: "العب مجدداً",
    nextLevel: "المستوى التالي",
    matches: "المطابقات",
    turns: "المحاولات",
    audioInstructions: "اضغط على السماعة لسماع الصوت!",
    back: "رجوع",
    certificateTitle: "شهادة بطل الذاكرة",
    certificateSub: "تمنح هذه الشهادة بكل فخر للبطل المتميز لإتمامه:",
    certificateDate: "التاريخ",
    certificateVerify: "مقدمة من إمباكت هاب مصر",
    cheatUnlock: "فتح جميع الأنماط للأهل والمعلمين",
    allUnlocked: "تم فتح جميع الأنماط!",
    promptFlipTwo: "اقلب بطاقتين للبحث عن أزواج متطابقة!",
    promptPressSpeaker: "اضغط على زر السماعة لسماع النطق!",
    matchFoundText: "رائع! تطابق ممتاز!",
    keepTryingText: "حاول مرة أخرى يا بطل!",
    loadingAudio: "جاري تحميل الصوت المميز...",
  },
  en: {
    hubName: "Impact Hub Egypt",
    hubDev: "Developed by Impact Hub Egypt",
    collectionName: "Egypt Educational Games Collection - Game #6",
    gameTitle: "3D Memory Match Adventure",
    chooseLang: "Choose your language to start",
    chooseMode: "Select Game Mode",
    chooseDifficulty: "Choose Difficulty",
    stars: "Stars",
    level: "Level",
    mode: "Mode",
    unlocked: "Unlocked!",
    progress: "Progress",
    restart: "Restart",
    home: "Home",
    soundOn: "Sound On",
    soundOff: "Mute Sound",
    screenshot: "Get Certificate",
    easy: "Easy (3 Pairs)",
    medium: "Medium (4 Pairs)",
    hard: "Hard (6 Pairs)",
    wellDone: "Well Done, Champ!",
    levelUnlockedMsg: "You have unlocked a new game mode!",
    playAgain: "Play Again",
    nextLevel: "Next Mode",
    matches: "Matches",
    turns: "Turns",
    audioInstructions: "Tap the speaker on the card to hear!",
    back: "Back",
    certificateTitle: "Memory Champ Certificate",
    certificateSub: "This certificate is proudly awarded to our amazing memory master for completing:",
    certificateDate: "Date",
    certificateVerify: "Verified by Impact Hub Egypt",
    cheatUnlock: "Parent/Teacher Bypass: Unlock All Modes",
    allUnlocked: "All modes successfully unlocked!",
    promptFlipTwo: "Flip any two cards to find a matching pair!",
    promptPressSpeaker: "Tap the speaker icon to play the sound!",
    matchFoundText: "Hooray! Perfect Match!",
    keepTryingText: "Keep trying, you can do it!",
    loadingAudio: "Loading magic voice...",
  },
  fr: {
    hubName: "Impact Hub Égypte",
    hubDev: "Développé par Impact Hub Égypte",
    collectionName: "Collection d'jeux Éducatifs d'Égypte - Jeu #6",
    gameTitle: "Aventure de Mémoire 3D",
    chooseLang: "Choisissez votre langue pour commencer",
    chooseMode: "Sélectionnez le mode de jeu",
    chooseDifficulty: "Choisissez la difficulté",
    stars: "Étoiles",
    level: "Niveau",
    mode: "Mode",
    unlocked: "Débloqué !",
    progress: "Progrès",
    restart: "Recommencer",
    home: "Accueil",
    soundOn: "Son Activé",
    soundOff: "Couper le Son",
    screenshot: "Certificat",
    easy: "Facile (3 paires)",
    medium: "Moyen (4 paires)",
    hard: "Difficile (6 paires)",
    wellDone: "Bien joué, Champion !",
    levelUnlockedMsg: "Tu as débloqué un nouveau mode de jeu !",
    playAgain: "Rejouer",
    nextLevel: "Mode Suivant",
    matches: "Paires",
    turns: "Essais",
    audioInstructions: "Appuie sur le haut-parleur de la carte !",
    back: "Retour",
    certificateTitle: "Certificat de Champion de Mémoire",
    certificateSub: "Ce certificat est fièrement décerné à notre super maître de mémoire pour avoir terminé :",
    certificateDate: "Date",
    certificateVerify: "Vérifié par Impact Hub Égypte",
    cheatUnlock: "Contrôle Parental : Débloquer tout",
    allUnlocked: "Tous les modes débloqués !",
    promptFlipTwo: "Retourne deux cartes pour trouver une paire !",
    promptPressSpeaker: "Appuie sur le haut-parleur pour entendre !",
    matchFoundText: "Super ! Une paire assortie !",
    keepTryingText: "Continue d'essayer, tu vas y arriver !",
    loadingAudio: "Chargement de la voix magique...",
  },
  de: {
    hubName: "Impact Hub Ägypten",
    hubDev: "Entwickelt von Impact Hub Ägypten",
    collectionName: "Ägypten Lernspiel-Sammlung - Spiel #6",
    gameTitle: "3D-Gedächtnis-Abenteuer",
    chooseLang: "Wähle deine Sprache zum Starten",
    chooseMode: "Wähle den Spielmodus",
    chooseDifficulty: "Schwierigkeit wählen",
    stars: "Sterne",
    level: "Stufe",
    mode: "Modus",
    unlocked: "Freigeschaltet!",
    progress: "Fortschritt",
    restart: "Neustart",
    home: "Hauptmenü",
    soundOn: "Ton An",
    soundOff: "Stumm schalten",
    screenshot: "Zertifikat",
    easy: "Einfach (3 Paare)",
    medium: "Mittel (4 Paare)",
    hard: "Schwer (6 Paare)",
    wellDone: "Gut gemacht, Champion!",
    levelUnlockedMsg: "Du hast einen neuen Spielmodus freigeschaltet!",
    playAgain: "Nochmal spielen",
    nextLevel: "Nächster Modus",
    matches: "Paare",
    turns: "Versuche",
    audioInstructions: "Tippe auf den Lautsprecher, um zu hören!",
    back: "Zurück",
    certificateTitle: "Gedächtnis-Champion-Zertifikat",
    certificateSub: "Dieses Zertifikat wird unserem fantastischen Gedächtnismeister verliehen für:",
    certificateDate: "Datum",
    certificateVerify: "Verifiziert durch Impact Hub Ägypten",
    cheatUnlock: "Eltern-Bypass: Alle Modi freischalten",
    allUnlocked: "Alle Modi erfolgreich freigeschaltet!",
    promptFlipTwo: "Drehe zwei Karten um, um ein Paar zu finden!",
    promptPressSpeaker: "Tippe auf den Lautsprecher für den Ton!",
    matchFoundText: "Hurra! Perfektes Paar gefunden!",
    keepTryingText: "Versuch es weiter, du schaffst das!",
    loadingAudio: "Lade magische Stimme...",
  },
};

export default function HomeApp() {
  const [lang, setLang] = useState<LanguageCode | null>(null);
  const [selectedMode, setSelectedMode] = useState<number | null>(null);
  const [difficulty, setDifficulty] = useState<GameDifficulty>("easy");
  const [gameState, setGameState] = useState<"welcome" | "mode-select" | "playing" | "complete">("welcome");

  const [stars, setStars] = useState<number>(0);
  const [unlockedModes, setUnlockedModes] = useState<number[]>([1]);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [isAudioLoading, setIsAudioLoading] = useState<boolean>(false);

  const [cards, setCards] = useState<Card[]>([]);
  const [flippedCardsIndices, setFlippedCardsIndices] = useState<number[]>([]);
  const [matchesCount, setMatchesCount] = useState<number>(0);
  const [turnsCount, setTurnsCount] = useState<number>(0);
  const [promptText, setPromptText] = useState<string>("");

  const currentAudioRef = useRef<HTMLAudioElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const isRtl = lang === "ar";
  const t = lang ? TRANSLATIONS[lang] : TRANSLATIONS["en"];

  // Fallback Speech synthesizer with premium native voice-matching
  const playSpeechSynthesis = (text: string, voiceLang: LanguageCode) => {
    if (isMuted || !("speechSynthesis" in window)) {
      setIsAudioLoading(false);
      return;
    }
    try {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      
      // Select exact standard locale
      if (voiceLang === "ar") {
        utterance.lang = "ar-EG";
      } else if (voiceLang === "fr") {
        utterance.lang = "fr-FR";
      } else if (voiceLang === "de") {
        utterance.lang = "de-DE";
      } else {
        utterance.lang = "en-US";
      }

      // Find best available native browser voice matching the requested locale
      const voices = window.speechSynthesis.getVoices();
      const matchedVoice = voices.find((v) => {
        const nameLower = v.name.toLowerCase();
        const langLower = v.lang.toLowerCase();
        if (voiceLang === "ar") {
          return langLower.startsWith("ar") || nameLower.includes("arabic") || nameLower.includes("maged") || nameLower.includes("tarik") || nameLower.includes("leila");
        }
        return langLower.startsWith(voiceLang);
      });

      if (matchedVoice) {
        utterance.voice = matchedVoice;
      }

      utterance.onend = () => setIsAudioLoading(false);
      utterance.onerror = () => setIsAudioLoading(false);
      window.speechSynthesis.speak(utterance);
    } catch (err) {
      console.error("SpeechSynthesis error:", err);
      setIsAudioLoading(false);
    }
  };

  // Ultra-robust dual-layer playTts with HTML5 Audio error tracking and timeouts
  const playTts = async (text: string, voiceLang: LanguageCode) => {
    if (isMuted) return;

    // Halt any currently active audio
    if (currentAudioRef.current) {
      try {
        currentAudioRef.current.pause();
      } catch (e) {}
      currentAudioRef.current = null;
    }

    setIsAudioLoading(true);

    try {
      const serverUrl = `/api/tts?text=${encodeURIComponent(text)}&lang=${voiceLang}`;
      const audio = new Audio();
      
      let fallbackTriggered = false;
      const triggerFallback = () => {
        if (!fallbackTriggered) {
          fallbackTriggered = true;
          console.warn(`[TTS Proxy failed or timed out for text: "${text}"]. Falling back to browser native voice engine.`);
          playSpeechSynthesis(text, voiceLang);
        }
      };

      // Handle async loading or format errors
      audio.onerror = () => {
        triggerFallback();
      };

      // Prevent infinite waiting if server doesn't respond or hangs
      const timeoutId = setTimeout(() => {
        if (!fallbackTriggered) {
          triggerFallback();
        }
      }, 3000);

      currentAudioRef.current = audio;
      audio.src = serverUrl;

      audio.play()
        .then(() => {
          clearTimeout(timeoutId);
          setIsAudioLoading(false);
        })
        .catch((err) => {
          clearTimeout(timeoutId);
          console.warn("Audio play promise rejected, using fallback speech synthesis.", err);
          triggerFallback();
        });

    } catch (err) {
      console.error("Audio initialization exception, falling back to speech synthesis.", err);
      playSpeechSynthesis(text, voiceLang);
    }
  };

  const startGame = (modeId: number, diff: GameDifficulty) => {
    setSelectedMode(modeId);
    setDifficulty(diff);
    setFlippedCardsIndices([]);
    setMatchesCount(0);
    setTurnsCount(0);
    setGameState("playing");

    let pairCount = 3;
    if (diff === "medium") pairCount = 4;
    else if (diff === "hard") pairCount = 6;

    const shuffled = [...VOCAB_ITEMS].sort(() => Math.random() - 0.5);
    const selectedItems = shuffled.slice(0, pairCount);

    let deck: Card[] = [];
    selectedItems.forEach((item) => {
      const cardA = createCardForMode(item, modeId, true);
      const cardB = createCardForMode(item, modeId, false);
      deck.push(cardA, cardB);
    });

    deck = deck.sort(() => Math.random() - 0.5);
    setCards(deck);

    const initialPrompt = modeId >= 4 ? t.promptPressSpeaker : t.promptFlipTwo;
    setPromptText(initialPrompt);
  };

  const createCardForMode = (item: VocabItem, modeId: number, isFirstPart: boolean): Card => {
    if (!lang) throw new Error("No language set");
    const dict = item[lang];

    switch (modeId) {
      case 1:
        return {
          id: `${item.id}-${isFirstPart ? "L1" : "L2"}`,
          itemId: item.id,
          type: "letter",
          content: dict.letter,
          isFlipped: false,
          isMatched: false,
          isCelebrating: false,
        };
      case 2:
        return isFirstPart
          ? {
              id: `${item.id}-L`,
              itemId: item.id,
              type: "letter",
              content: dict.letter,
              isFlipped: false,
              isMatched: false,
              isCelebrating: false,
            }
          : {
              id: `${item.id}-P`,
              itemId: item.id,
              type: "picture",
              content: item.emoji,
              isFlipped: false,
              isMatched: false,
              isCelebrating: false,
            };
      case 3:
        return isFirstPart
          ? {
              id: `${item.id}-P`,
              itemId: item.id,
              type: "picture",
              content: item.emoji,
              isFlipped: false,
              isMatched: false,
              isCelebrating: false,
            }
          : {
              id: `${item.id}-W`,
              itemId: item.id,
              type: "word",
              content: dict.word,
              isFlipped: false,
              isMatched: false,
              isCelebrating: false,
            };
      case 4:
        return isFirstPart
          ? {
              id: `${item.id}-A`,
              itemId: item.id,
              type: "audio",
              content: "🔊",
              isFlipped: false,
              isMatched: false,
              isCelebrating: false,
            }
          : {
              id: `${item.id}-P`,
              itemId: item.id,
              type: "picture",
              content: item.emoji,
              isFlipped: false,
              isMatched: false,
              isCelebrating: false,
            };
      case 5:
        return isFirstPart
          ? {
              id: `${item.id}-A`,
              itemId: item.id,
              type: "audio",
              content: "🔊",
              isFlipped: false,
              isMatched: false,
              isCelebrating: false,
            }
          : {
              id: `${item.id}-W`,
              itemId: item.id,
              type: "word",
              content: dict.word,
              isFlipped: false,
              isMatched: false,
              isCelebrating: false,
            };
      default:
        throw new Error("Invalid Mode");
    }
  };

  const handleCardClick = (index: number) => {
    if (flippedCardsIndices.length >= 2) return;
    const card = cards[index];
    if (card.isFlipped || card.isMatched) return;

    const updatedCards = [...cards];
    updatedCards[index] = { ...card, isFlipped: true };
    setCards(updatedCards);

    const currentFlipped = [...flippedCardsIndices, index];
    setFlippedCardsIndices(currentFlipped);

    const item = VOCAB_ITEMS.find((vi) => vi.id === card.itemId);
    if (item && lang) {
      if (card.type === "letter") {
        playTts(item[lang].letterSpeech, lang);
      } else {
        playTts(item[lang].wordSpeech, lang);
      }
    }

    if (currentFlipped.length === 2) {
      setTurnsCount((prev) => prev + 1);
      const [idx1, idx2] = currentFlipped;
      const card1 = updatedCards[idx1];
      const card2 = updatedCards[idx2];

      if (card1.itemId === card2.itemId) {
        setTimeout(() => {
          confetti({ particleCount: 60, spread: 50 });
          const finalCards = [...updatedCards];
          finalCards[idx1] = { ...card1, isMatched: true, isCelebrating: true };
          finalCards[idx2] = { ...card2, isMatched: true, isCelebrating: true };
          setCards(finalCards);

          setPromptText(t.matchFoundText);
          if (lang) {
            playTts(t.matchFoundText, lang);
          }

          setMatchesCount((prev) => {
            const nextCount = prev + 1;
            const requiredMatches = difficulty === "easy" ? 3 : difficulty === "medium" ? 4 : 6;
            if (nextCount === requiredMatches) {
              setTimeout(() => {
                confetti({ particleCount: 150, spread: 80 });
                setGameState("complete");
                setStars((p) => p + (difficulty === "easy" ? 3 : difficulty === "medium" ? 5 : 8));
                if (selectedMode < 5 && !unlockedModes.includes(selectedMode + 1)) {
                  setUnlockedModes((um) => [...um, selectedMode + 1]);
                }
              }, 1000);
            }
            return nextCount;
          });

          setTimeout(() => {
            setCards((prev) =>
              prev.map((c) =>
                c.itemId === card1.itemId ? { ...c, isCelebrating: false } : c
              )
            );
          }, 1000);

          setFlippedCardsIndices([]);
        }, 600);
      } else {
        setTimeout(() => {
          setPromptText(t.keepTryingText);
          const finalCards = [...updatedCards];
          finalCards[idx1] = { ...card1, isFlipped: false };
          finalCards[idx2] = { ...card2, isFlipped: false };
          setCards(finalCards);
          setFlippedCardsIndices([]);
        }, 1400);
      }
    }
  };

  const downloadCertificate = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.fillStyle = "#EEF2F6";
    ctx.fillRect(0, 0, 800, 600);
    ctx.strokeStyle = "#3B82F6";
    ctx.lineWidth = 14;
    ctx.strokeRect(20, 20, 760, 560);

    ctx.fillStyle = "#1E293B";
    ctx.textAlign = "center";
    ctx.font = "bold 38px sans-serif";
    ctx.fillText(t.certificateTitle, 400, 150);

    const dataUrl = canvas.toDataURL("image/png");
    const link = document.createElement("a");
    link.download = "MemoryChamp_Certificate.png";
    link.href = dataUrl;
    link.click();
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 p-4 flex flex-col justify-center items-center" style={{ direction: isRtl ? "rtl" : "ltr" }}>
      {gameState === "welcome" && (
        <div className="text-center p-6 bg-white rounded-3xl shadow-lg border border-slate-100 max-w-md w-full">
          <h1 className="text-2xl font-black mb-4">3D Memory Match Adventure</h1>
          <p className="text-slate-400 text-sm mb-6">Egypt Educational Games Collection - Game #6</p>
          <div className="grid grid-cols-2 gap-3">
            {["ar", "en", "fr", "de"].map((code) => (
              <button
                key={code}
                onClick={() => {
                  setLang(code as LanguageCode);
                  setGameState("mode-select");
                }}
                className="p-4 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold rounded-xl transition-all cursor-pointer"
              >
                {code.toUpperCase()}
              </button>
            ))}
          </div>
        </div>
      )}

      {gameState === "mode-select" && lang && (
        <div className="bg-white p-6 rounded-3xl shadow-lg border border-slate-100 max-w-2xl w-full">
          <h2 className="text-xl font-bold text-center mb-6">{t.chooseMode}</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {GAME_MODES.map((mode) => {
              const isUnlocked = unlockedModes.includes(mode.id);
              return (
                <div key={mode.id} className={`p-4 border rounded-2xl flex flex-col justify-between ${isUnlocked ? "bg-white border-indigo-100" : "bg-slate-50 opacity-60"}`}>
                  <h3 className="font-bold text-sm mb-2">{mode.title[lang]}</h3>
                  <p className="text-xs text-slate-400 mb-4">{mode.description[lang]}</p>
                  {isUnlocked ? (
                    <button
                      onClick={() => startGame(mode.id, difficulty)}
                      className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold py-2 rounded-xl cursor-pointer"
                    >
                      {t.playAgain}
                    </button>
                  ) : (
                    <div className="text-center text-xs text-slate-400 font-bold">Locked</div>
                  )}
                </div>
              );
            })}
          </div>
          <button onClick={() => setGameState("welcome")} className="mt-6 text-xs text-slate-400 block mx-auto">{t.back}</button>
        </div>
      )}

      {gameState === "playing" && selectedMode && lang && (
        <div className="w-full max-w-4xl flex flex-col items-center gap-6">
          <div className="bg-indigo-600 text-white font-bold px-6 py-2 rounded-full">{promptText}</div>
          <div className="grid grid-cols-3 md:grid-cols-4 gap-4 w-full">
            {cards.map((card, index) => (
              <div
                key={card.id}
                onClick={() => handleCardClick(index)}
                className={`aspect-[4/5] bg-white border-2 rounded-2xl flex items-center justify-center text-4xl font-bold cursor-pointer transition-all ${card.isFlipped || card.isMatched ? "border-indigo-500 shadow-md" : "bg-indigo-600 text-white border-white shadow-sm"}`}
              >
                {card.isFlipped || card.isMatched ? (
                  card.type === "audio" ? "🔊" : card.content
                ) : (
                  "⭐"
                )}
              </div>
            ))}
          </div>
          <div className="flex justify-between w-full max-w-md bg-white p-4 rounded-xl border">
            <div>{t.turns}: {turnsCount}</div>
            <button onClick={() => setGameState("mode-select")} className="text-xs text-slate-400">{t.back}</button>
          </div>
        </div>
      )}

      {gameState === "complete" && lang && (
        <div className="bg-white p-8 rounded-3xl shadow-lg border text-center max-w-md w-full">
          <h2 className="text-2xl font-black text-indigo-900 mb-4">{t.wellDone}</h2>
          <canvas ref={canvasRef} className="hidden" width={800} height={600} />
          <button onClick={downloadCertificate} className="w-full bg-amber-500 hover:bg-amber-600 text-slate-900 font-bold py-3 rounded-2xl mb-3 cursor-pointer">
            {t.screenshot}
          </button>
          <button onClick={() => setGameState("mode-select")} className="text-xs text-slate-400">{t.back}</button>
        </div>
      )}
    </div>
  );
}
