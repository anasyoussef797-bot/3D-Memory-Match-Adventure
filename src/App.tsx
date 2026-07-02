import React, { useState, useEffect, useRef } from "react";
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
  Smartphone,
  ChevronRight,
  ChevronLeft,
  Lock,
  Unlock,
  Check,
  Star,
  Camera,
} from "lucide-react";
import {
  VOCAB_ITEMS,
  GAME_MODES,
  TRANSLATIONS,
  LanguageCode,
  Card,
  GameDifficulty,
  VocabItem,
} from "./types";

// Dynamic Web Audio synthesizer for native child-friendly sound effects (No extra hosting or assets needed)
class SoundEffectsManager {
  private ctx: AudioContext | null = null;
  private muted: boolean = false;

  private init() {
    if (!this.ctx) {
      try {
        this.ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      } catch (e) {
        console.warn("AudioContext not supported in this browser environment", e);
      }
    }
    if (this.ctx && this.ctx.state === "suspended") {
      this.ctx.resume();
    }
  }

  setMuted(muted: boolean) {
    this.muted = muted;
  }

  playFlip() {
    if (this.muted) return;
    this.init();
    if (!this.ctx) return;
    
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    
    osc.type = "sine";
    osc.frequency.setValueAtTime(320, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(650, this.ctx.currentTime + 0.12);
    
    gain.gain.setValueAtTime(0.08, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.12);
    
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    
    osc.start();
    osc.stop(this.ctx.currentTime + 0.12);
  }

  playSuccess() {
    if (this.muted) return;
    this.init();
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    
    // Warm and delightful major key chime arpeggio
    const chord = [329.63, 392.00, 523.25, 659.25]; // E4, G4, C5, E5
    chord.forEach((freq, index) => {
      const osc = this.ctx!.createOscillator();
      const gain = this.ctx!.createGain();
      
      osc.type = "sine";
      osc.frequency.setValueAtTime(freq, now + index * 0.07);
      
      gain.gain.setValueAtTime(0.12, now + index * 0.07);
      gain.gain.exponentialRampToValueAtTime(0.001, now + index * 0.07 + 0.25);
      
      osc.connect(gain);
      gain.connect(this.ctx!.destination);
      
      osc.start(now + index * 0.07);
      osc.stop(now + index * 0.07 + 0.3);
    });
  }

  playFailure() {
    if (this.muted) return;
    this.init();
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    
    osc.type = "triangle";
    osc.frequency.setValueAtTime(180, now);
    osc.frequency.linearRampToValueAtTime(110, now + 0.2);
    
    gain.gain.setValueAtTime(0.1, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);
    
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    
    osc.start();
    osc.stop(now + 0.22);
  }

  playLevelComplete() {
    if (this.muted) return;
    this.init();
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    
    // Triumphant orchestral scale upward ramp
    const scale = [261.63, 293.66, 329.63, 349.23, 392.00, 440.00, 493.88, 523.25, 659.25];
    scale.forEach((freq, index) => {
      const osc = this.ctx!.createOscillator();
      const gain = this.ctx!.createGain();
      
      osc.type = "triangle";
      osc.frequency.setValueAtTime(freq, now + index * 0.05);
      
      gain.gain.setValueAtTime(0.15, now + index * 0.05);
      gain.gain.exponentialRampToValueAtTime(0.001, now + index * 0.05 + 0.35);
      
      osc.connect(gain);
      gain.connect(this.ctx!.destination);
      
      osc.start(now + index * 0.05);
      osc.stop(now + index * 0.05 + 0.4);
    });
  }
}

const sfx = new SoundEffectsManager();

export default function App() {
  // Navigation & Setup State
  const [lang, setLang] = useState<LanguageCode | null>(null);
  const [selectedMode, setSelectedMode] = useState<number | null>(null);
  const [difficulty, setDifficulty] = useState<GameDifficulty>("easy");
  const [gameState, setGameState] = useState<"welcome" | "mode-select" | "playing" | "complete">("welcome");

  // Core Stats state
  const [stars, setStars] = useState<number>(() => {
    const saved = localStorage.getItem("hub_egypt_stars_game6");
    return saved ? parseInt(saved, 10) : 0;
  });
  const [unlockedModes, setUnlockedModes] = useState<number[]>(() => {
    const saved = localStorage.getItem("hub_egypt_unlocked_modes_game6");
    return saved ? JSON.parse(saved) : [1]; // level 1 unlocked by default
  });
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [isAudioLoading, setIsAudioLoading] = useState<boolean>(false);

  // Active Matching Engine State
  const [cards, setCards] = useState<Card[]>([]);
  const [flippedCardsIndices, setFlippedCardsIndices] = useState<number[]>([]);
  const [matchesCount, setMatchesCount] = useState<number>(0);
  const [turnsCount, setTurnsCount] = useState<number>(0);
  const [promptText, setPromptText] = useState<string>("");

  // Refs for tracking audio playback
  const currentAudioRef = useRef<HTMLAudioElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Sync mute state with sound manager
  useEffect(() => {
    sfx.setMuted(isMuted);
  }, [isMuted]);

  // Keep stars and unlocked levels persisted
  useEffect(() => {
    localStorage.setItem("hub_egypt_stars_game6", stars.toString());
  }, [stars]);

  useEffect(() => {
    localStorage.setItem("hub_egypt_unlocked_modes_game6", JSON.stringify(unlockedModes));
  }, [unlockedModes]);

  // Clean up speech or audio on unmount
  useEffect(() => {
    return () => {
      if (currentAudioRef.current) {
        currentAudioRef.current.pause();
      }
    };
  }, []);

  // Set directionality helper
  const isRtl = lang === "ar";
  const t = lang ? TRANSLATIONS[lang] : TRANSLATIONS["en"];

  // Play audio voice pronunciation using Secure Proxy & fallbacks with premium native voice-matching
  const playSpeechSynthesisFallback = (text: string, voiceLang: LanguageCode) => {
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

  const playTts = async (text: string, voiceLang: LanguageCode) => {
    if (isMuted) return;

    // Halt any running voices
    if (currentAudioRef.current) {
      try {
        currentAudioRef.current.pause();
      } catch (e) {}
      currentAudioRef.current = null;
    }

    setIsAudioLoading(true);

    const directUrl = `https://translate.google.com/translate_tts?ie=UTF-8&tl=${voiceLang}&client=tw-ob&q=${encodeURIComponent(text)}`;
    const proxyUrl = `/api/tts?text=${encodeURIComponent(text)}&lang=${voiceLang}`;

    let fallbackTriggered = false;

    // Triple-layer safety net: Direct Google TTS -> Proxy API -> Web SpeechSynthesis
    const tryPlay = (urlsToTry: string[]) => {
      if (urlsToTry.length === 0) {
        if (!fallbackTriggered) {
          fallbackTriggered = true;
          console.warn(`[All Audio URLs failed or timed out for text: "${text}"]. Falling back to browser native SpeechSynthesis.`);
          playSpeechSynthesisFallback(text, voiceLang);
        }
        return;
      }

      const currentUrl = urlsToTry[0];
      const audio = new Audio();
      currentAudioRef.current = audio;

      let isCurrentAttemptDone = false;
      let timeoutId: any = null;

      const handleFailure = (reason: string) => {
        if (isCurrentAttemptDone) return;
        isCurrentAttemptDone = true;
        if (timeoutId) clearTimeout(timeoutId);
        console.warn(`TTS attempt failed for URL: ${currentUrl}. Reason: ${reason}`);
        // Try next URL
        tryPlay(urlsToTry.slice(1));
      };

      audio.onerror = () => {
        handleFailure("audio.onerror triggered");
      };

      timeoutId = setTimeout(() => {
        handleFailure("timeout reached");
      }, 2500);

      audio.src = currentUrl;
      audio.play()
        .then(() => {
          if (!isCurrentAttemptDone) {
            isCurrentAttemptDone = true;
            if (timeoutId) clearTimeout(timeoutId);
            setIsAudioLoading(false);
          }
        })
        .catch((err) => {
          handleFailure(err?.message || "play promise rejected");
        });
    };

    tryPlay([directUrl, proxyUrl]);
  };

  // Launch celebratory star bursts
  const triggerConfettiSuccess = () => {
    confetti({
      particleCount: 80,
      spread: 60,
      origin: { y: 0.75 },
      colors: ["#FBBF24", "#F472B6", "#60A5FA", "#34D399"],
    });
  };

  const triggerConfettiMassive = () => {
    const duration = 2 * 1000;
    const animationEnd = Date.now() + duration;
    const defaults = { startVelocity: 25, spread: 360, ticks: 50, zIndex: 100 };

    function randomInRange(min: number, max: number) {
      return Math.random() * (max - min) + min;
    }

    const interval: any = setInterval(() => {
      const timeLeft = animationEnd - Date.now();
      if (timeLeft <= 0) {
        return clearInterval(interval);
      }
      const particleCount = 40 * (timeLeft / duration);
      confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 } });
      confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 } });
    }, 250);
  };

  // Initialize Memory Deck
  const startGame = (modeId: number, diff: GameDifficulty) => {
    sfx.playFlip();
    setSelectedMode(modeId);
    setDifficulty(diff);
    setFlippedCardsIndices([]);
    setMatchesCount(0);
    setTurnsCount(0);
    setGameState("playing");

    // Map difficulty to pair count
    let pairCount = 3; // easy
    if (diff === "medium") pairCount = 4;
    else if (diff === "hard") pairCount = 6;

    // Randomize sub-selection of VocabItems
    const shuffledItems = [...VOCAB_ITEMS].sort(() => Math.random() - 0.5);
    const selectedItems = shuffledItems.slice(0, pairCount);

    // Build matching cards
    let deck: Card[] = [];
    selectedItems.forEach((item) => {
      const cardA = createCardForMode(item, modeId, true);
      const cardB = createCardForMode(item, modeId, false);
      deck.push(cardA, cardB);
    });

    // Shuffle final deck
    deck = deck.sort(() => Math.random() - 0.5);
    setCards(deck);

    // Set initial instructive prompt
    const initialPrompt = modeId >= 4 ? t.promptPressSpeaker : t.promptFlipTwo;
    setPromptText(initialPrompt);

    // Speak initial welcome instruction for the selected level mode
    const currentMode = GAME_MODES.find(m => m.id === modeId);
    if (currentMode && lang) {
      setTimeout(() => {
        playTts(currentMode.description[lang], lang);
      }, 500);
    }
  };

  // Utility to map a card config based on selected mode
  const createCardForMode = (item: VocabItem, modeId: number, isFirstPart: boolean): Card => {
    if (!lang) throw new Error("No language set");
    const dict = item[lang];

    switch (modeId) {
      case 1: // Letter ↔ Letter
        return {
          id: `${item.id}-${isFirstPart ? "L1" : "L2"}`,
          itemId: item.id,
          type: "letter",
          content: dict.letter,
          isFlipped: false,
          isMatched: false,
          isCelebrating: false,
        };
      case 2: // Letter ↔ Picture
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
      case 3: // Picture ↔ Word
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
      case 4: // Audio ↔ Picture
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
      case 5: // Audio ↔ Word
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

  // Card Flip interaction handler
  const handleCardClick = (index: number) => {
    // Lock guard checks
    if (flippedCardsIndices.length >= 2) return;
    const card = cards[index];
    if (card.isFlipped || card.isMatched) return;

    // Flip sound
    sfx.playFlip();

    // Update state
    const updatedCards = [...cards];
    updatedCards[index] = { ...card, isFlipped: true };
    setCards(updatedCards);

    const currentFlipped = [...flippedCardsIndices, index];
    setFlippedCardsIndices(currentFlipped);

    // Speak card content immediately on reveal to reinforce pronunciation
    const item = VOCAB_ITEMS.find((vi) => vi.id === card.itemId);
    if (item && lang) {
      if (card.type === "letter") {
        playTts(item[lang].letterSpeech, lang);
      } else {
        playTts(item[lang].wordSpeech, lang);
      }
    }

    // Matching logic
    if (currentFlipped.length === 2) {
      setTurnsCount((prev) => prev + 1);
      const [idx1, idx2] = currentFlipped;
      const card1 = updatedCards[idx1];
      const card2 = updatedCards[idx2];

      if (card1.itemId === card2.itemId) {
        // MATCH DETECTED!
        setTimeout(() => {
          sfx.playSuccess();
          triggerConfettiSuccess();

          const finalCards = [...updatedCards];
          finalCards[idx1] = { ...card1, isMatched: true, isCelebrating: true };
          finalCards[idx2] = { ...card2, isMatched: true, isCelebrating: true };
          setCards(finalCards);

          // Praise child in correct language
          setPromptText(t.matchFoundText);
          if (lang) {
            playTts(t.matchFoundText, lang);
          }

          setMatchesCount((prev) => {
            const nextCount = prev + 1;
            const requiredMatches = difficulty === "easy" ? 3 : difficulty === "medium" ? 4 : 6;

            // Check Level completion
            if (nextCount === requiredMatches) {
              handleLevelVictory();
            }
            return nextCount;
          });

          // End card celebration state shortly after
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
        // MISMATCH!
        setTimeout(() => {
          sfx.playFailure();
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

  // Re-play audio prompt inside interactive speaker cards
  const handleReplaySpeakerAudio = (index: number, e: React.MouseEvent) => {
    e.stopPropagation(); // Avoid triggering double flips
    const card = cards[index];
    if (!card.isFlipped || card.isMatched || card.type !== "audio") return;

    const item = VOCAB_ITEMS.find((vi) => vi.id === card.itemId);
    if (item && lang) {
      playTts(item[lang].wordSpeech, lang);
    }
  };

  // Level Completion state setup
  const handleLevelVictory = () => {
    setTimeout(() => {
      sfx.playLevelComplete();
      triggerConfettiMassive();
      setGameState("complete");

      // Award dynamic stats
      const bonusStars = difficulty === "easy" ? 3 : difficulty === "medium" ? 5 : 8;
      setStars((prev) => prev + bonusStars);

      // Level Progression: Auto unlock next level
      if (selectedMode && selectedMode < 5) {
        const nextMode = selectedMode + 1;
        if (!unlockedModes.includes(nextMode)) {
          setUnlockedModes((prev) => [...prev, nextMode]);
        }
      }
    }, 1200);
  };

  // Parent Cheat Code to bypass lock checks
  const bypassAllUnlocks = () => {
    setUnlockedModes([1, 2, 3, 4, 5]);
    alert(t.allUnlocked);
  };

  // Restart Active Round
  const handleRestartMode = () => {
    if (selectedMode) {
      startGame(selectedMode, difficulty);
    }
  };

  // Certificate PDF/PNG generation using high-quality custom Canvas Renderer (Fully functional, responsive, offline-proof, Iframe-safe)
  const downloadCertificate = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Draw high quality graphic certificate
    ctx.fillStyle = "#EEF2F6";
    ctx.fillRect(0, 0, 800, 600);

    // Decorative Borders
    ctx.strokeStyle = "#3B82F6";
    ctx.lineWidth = 14;
    ctx.strokeRect(20, 20, 760, 560);

    ctx.strokeStyle = "#FBBF24";
    ctx.lineWidth = 4;
    ctx.strokeRect(34, 34, 732, 532);

    // Dynamic Title Typography
    ctx.fillStyle = "#1E293B";
    ctx.textAlign = "center";
    ctx.font = "bold 38px 'Inter', sans-serif";
    ctx.fillText(t.certificateTitle, 400, 110);

    // Decorative Ribbon/Star Logo
    ctx.font = "52px sans-serif";
    ctx.fillText("🌟🏆🌟", 400, 185);

    // Body content
    ctx.fillStyle = "#475569";
    ctx.font = "19px sans-serif";
    ctx.fillText(t.certificateSub, 400, 240);

    // Selected Mode Details
    const modeObj = GAME_MODES.find((m) => m.id === selectedMode);
    const modeTitle = modeObj && lang ? modeObj.title[lang] : `Mode ${selectedMode}`;
    ctx.fillStyle = "#1E3A8A";
    ctx.font = "bold 24px sans-serif";
    ctx.fillText(`"${modeTitle}"`, 400, 290);

    // Kid Stats
    ctx.fillStyle = "#475569";
    ctx.font = "bold 20px sans-serif";
    ctx.fillText(`${t.difficulty}: ${t[difficulty]}   |   ${t.turns}: ${turnsCount}`, 400, 340);

    // Impact Hub Egyptian garden illustration background sketch
    // Pyramids vector representation on canvas
    ctx.fillStyle = "#FDE047"; // Golden Sand
    ctx.beginPath();
    ctx.moveTo(150, 500);
    ctx.lineTo(250, 420);
    ctx.lineTo(350, 500);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = "#EAB308"; // Darker gold shade for 3D depth
    ctx.beginPath();
    ctx.moveTo(250, 420);
    ctx.lineTo(290, 430);
    ctx.lineTo(350, 500);
    ctx.lineTo(250, 500);
    ctx.closePath();
    ctx.fill();

    // Little Nil river curve
    ctx.strokeStyle = "#60A5FA";
    ctx.lineWidth = 8;
    ctx.beginPath();
    ctx.moveTo(50, 520);
    ctx.bezierCurveTo(200, 480, 350, 560, 500, 510);
    ctx.stroke();

    // Badge Circle
    ctx.fillStyle = "#F59E0B";
    ctx.beginPath();
    ctx.arc(620, 460, 55, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = "#FFFFFF";
    ctx.lineWidth = 4;
    ctx.stroke();

    ctx.fillStyle = "#FFFFFF";
    ctx.font = "bold 13px sans-serif";
    ctx.fillText(t.hubName, 620, 452);
    ctx.font = "11px sans-serif";
    ctx.fillText(t.unlocked, 620, 474);

    // Footer lines
    ctx.fillStyle = "#334155";
    ctx.font = "15px sans-serif";
    ctx.fillText(t.certificateVerify, 400, 545);

    const todayStr = new Date().toLocaleDateString(lang || "en", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
    ctx.font = "14px sans-serif";
    ctx.fillText(`${t.certificateDate}: ${todayStr}`, 400, 515);

    // Trigger immediate Browser download
    const dataUrl = canvas.toDataURL("image/png");
    const link = document.createElement("a");
    link.download = `ImpactHub_MemoryChamp_Level${selectedMode}.png`;
    link.href = dataUrl;
    link.click();
  };

  return (
    <div
      className="min-h-screen relative overflow-x-hidden flex flex-col font-sans select-none bg-gradient-to-b from-[#A5F3FC] to-[#D8B4FE] text-slate-800"
      style={{ direction: isRtl ? "rtl" : "ltr" }}
    >
      {/* Soft Blurred Backdrops from Artistic Flair Theme */}
      <div className="absolute top-10 left-20 w-32 h-16 bg-white/60 rounded-full blur-xl pointer-events-none z-0"></div>
      <div className="absolute top-40 right-40 w-48 h-20 bg-white/40 rounded-full blur-2xl pointer-events-none z-0"></div>
      <div className="absolute bottom-20 left-10 w-24 h-12 bg-white/50 rounded-full blur-lg pointer-events-none z-0"></div>

      {/* Dynamic Keyframes Injection */}
      <style>{`
        @keyframes floatIsland {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-8px); }
        }
        @keyframes driftCloud {
          0% { transform: translateX(-150px); }
          100% { transform: translateX(110vw); }
        }
        @keyframes customShake {
          0%, 100% { transform: rotate(0deg); }
          25% { transform: rotate(-3deg); }
          75% { transform: rotate(3deg); }
        }
        .animate-float-island {
          animation: floatIsland 6s ease-in-out infinite;
        }
        .cloud-one {
          animation: driftCloud 38s linear infinite;
        }
        .cloud-two {
          animation: driftCloud 48s linear infinite 10s;
        }
        .animate-victory-shake {
          animation: customShake 0.4s ease-in-out infinite;
        }
        .perspective-600 {
          perspective: 600px;
        }
        .preserve-3d {
          transform-style: preserve-3d;
        }
        .backface-hidden {
          backface-visibility: hidden;
        }
        .rotate-y-180 {
          transform: rotateY(180deg);
        }
      `}</style>

      {/* BACKGROUND GRAPHIC LAYER: Gorgeous Animated Floating Garden with Egyptian Accents */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
        {/* Floating Cartoon Clouds */}
        <div className="absolute top-[10%] left-[-150px] cloud-one opacity-60">
          <div className="w-32 h-10 bg-white rounded-full relative before:content-[''] before:absolute before:-top-6 before:left-5 before:w-16 before:h-16 before:bg-white before:rounded-full after:content-[''] after:absolute after:-top-4 after:right-4 after:w-12 after:h-12 after:bg-white after:rounded-full"></div>
        </div>
        <div className="absolute top-[22%] left-[-150px] cloud-two opacity-40">
          <div className="w-40 h-12 bg-white rounded-full relative before:content-[''] before:absolute before:-top-8 before:left-8 before:w-20 before:h-20 before:bg-white before:rounded-full after:content-[''] after:absolute after:-top-5 after:right-5 after:w-14 after:h-14 after:bg-white after:rounded-full"></div>
        </div>

        {/* Ambient Egyptian Garden Silhouette Floating */}
        <div className="absolute bottom-0 inset-x-0 h-44 md:h-56 bg-gradient-to-t from-emerald-400/30 to-transparent flex items-end justify-between px-10 animate-float-island">
          {/* Stylized cartoon pyramids left */}
          <div className="flex items-end gap-1 opacity-25">
            <div className="w-32 h-20 bg-amber-400 rounded-t-sm" style={{ clipPath: "polygon(50% 0%, 0% 100%, 100% 100%)" }}></div>
            <div className="w-24 h-14 bg-amber-500 rounded-t-sm" style={{ clipPath: "polygon(50% 0%, 0% 100%, 100% 100%)" }}></div>
          </div>

          {/* Cute Lotus reeds & Nile stream right */}
          <div className="flex items-end gap-3 opacity-30">
            <div className="w-4 h-16 bg-teal-500 rounded-full"></div>
            <div className="w-6 h-20 bg-teal-600 rounded-full flex justify-center items-start pt-1">
              <span className="text-pink-400 text-xs">🌸</span>
            </div>
            <div className="w-5 h-14 bg-teal-500 rounded-full"></div>
          </div>
        </div>
      </div>

      {/* GLOBAL HEADER & TOP BAR - Glassmorphic Artistic Theme */}
      <header className="relative z-10 w-full bg-white/20 backdrop-blur-md border-b border-white/30 px-4 py-3 md:py-4">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-3">
          
          {/* Brand/Collection Emblem */}
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-white rounded-xl shadow-lg flex items-center justify-center text-indigo-600 font-black text-2xl">
              ٦
            </div>
            <div className="text-center md:text-left">
              <div className="flex items-center gap-2 justify-center md:justify-start">
                <span className="text-[10px] font-bold text-indigo-700/70 tracking-widest uppercase">
                  {lang ? t.hubName : "Impact Hub Egypt"}
                </span>
                <span className="text-[10px] bg-white/30 text-indigo-900 font-bold px-2 py-0.5 rounded-full uppercase border border-white/40">
                  {lang ? t.collectionName : "Game #6"}
                </span>
              </div>
              <h1 className="text-xl font-bold text-indigo-900 leading-none tracking-tight">
                {lang ? t.gameTitle : "3D Memory Match Adventure"}
              </h1>
            </div>
          </div>

          {/* Gameplay HUD / Control Bar */}
          <div className="flex items-center gap-2 flex-wrap justify-center">
            
            {/* Stars Progress Bar (Artistic Theme) */}
            <div className="hidden lg:flex items-center px-4 w-64">
              <div className="w-full relative h-6 bg-white/30 rounded-full border border-white/50 p-1 flex items-center">
                <div
                  className="h-full bg-gradient-to-r from-yellow-400 to-orange-400 rounded-full relative transition-all duration-500"
                  style={{ width: `${Math.max(12, Math.min(100, (stars / 40) * 100))}%` }}
                >
                  <div className="absolute -right-2 -top-2 text-md shadow-sm">⭐</div>
                </div>
                <div className="absolute inset-0 flex justify-center items-center text-[9px] font-black text-indigo-950 uppercase tracking-wider">
                  {lang ? t.stars : "Stars"}: {stars} / 40
                </div>
              </div>
            </div>

            {/* Stars counter with high contrast yellow for smaller screens */}
            <div className="lg:hidden bg-amber-50 border border-amber-200 text-amber-800 font-bold px-3 py-1 rounded-full flex items-center gap-1.5 shadow-sm">
              <span className="text-yellow-500 animate-spin-slow">⭐</span>
              <span className="text-sm">
                {stars} {lang ? t.stars : "Stars"}
              </span>
            </div>

            {/* Current Active Mode indicator */}
            {gameState === "playing" && selectedMode && (
              <div className="bg-indigo-50/80 border border-indigo-100 text-indigo-800 font-semibold px-3 py-1 rounded-full text-xs">
                {t.mode}: {selectedMode}/5
              </div>
            )}

            {/* Language Selector in Top Bar - Elegant Rounded Badge */}
            {lang && (
              <button
                id="top-bar-lang-btn"
                onClick={() => {
                  sfx.playFlip();
                  setGameState("welcome");
                }}
                className="px-4 h-10 bg-indigo-600 text-white rounded-full font-bold shadow-lg shadow-indigo-200 text-sm transition-all transform hover:scale-105 active:scale-95 cursor-pointer flex items-center gap-1"
              >
                🌐 {lang.toUpperCase()}
              </button>
            )}

            {/* Mute Button - White Glass Circular Button */}
            <button
              id="top-bar-mute-btn"
              onClick={() => setIsMuted(!isMuted)}
              className="p-2 bg-white/80 rounded-full shadow-md text-indigo-600 w-10 h-10 flex items-center justify-center transition-all cursor-pointer hover:bg-white hover:scale-105"
              title={isMuted ? "Unmute" : "Mute"}
            >
              {isMuted ? <VolumeX size={18} /> : <Volume2 size={18} />}
            </button>

            {/* Reset Current Round */}
            {gameState === "playing" && (
              <button
                id="top-bar-restart-btn"
                onClick={handleRestartMode}
                className="p-2 bg-white/80 rounded-full shadow-md text-indigo-600 w-10 h-10 flex items-center justify-center transition-all cursor-pointer hover:bg-white hover:scale-105"
                title={t.restart}
              >
                <RotateCcw size={16} />
              </button>
            )}

            {/* Back Home */}
            {gameState !== "welcome" && (
              <button
                id="top-bar-home-btn"
                onClick={() => {
                  sfx.playFlip();
                  setGameState("welcome");
                }}
                className="p-2 bg-white/80 rounded-full shadow-md text-indigo-600 w-10 h-10 flex items-center justify-center transition-all cursor-pointer hover:bg-white hover:scale-105"
                title={t.home}
              >
                <Home size={16} />
              </button>
            )}
          </div>

        </div>
      </header>

      {/* MAIN LAYOUT CANVAS */}
      <main className="flex-1 relative z-10 max-w-7xl mx-auto w-full px-4 py-6 flex flex-col justify-center items-center">
        
        {/* VIEW 1: Multilingual Language Selection Grid */}
        {gameState === "welcome" && (
          <div className="w-full max-w-2xl bg-white/80 backdrop-blur-lg rounded-3xl p-6 md:p-8 shadow-2xl border-t-2 border-white border-white/50 text-center animate-float-island">
            <h2 className="text-xl md:text-2xl font-extrabold text-indigo-950 mb-2">
              أهلاً بكم في ألعاب إمباكت هاب مصر التعليمية
            </h2>
            <p className="text-sm text-indigo-800/80 mb-8 font-semibold">
              Choose your favorite language to start this magical 3D memory challenge!
            </p>

            <div className="grid grid-cols-2 gap-4 max-w-md mx-auto">
              {[
                { code: "ar", label: "العربية", desc: "RTL (مصر)", flag: "🇪🇬" },
                { code: "en", label: "English", desc: "British/US", flag: "🇬🇧" },
                { code: "fr", label: "Français", desc: "French", flag: "🇫🇷" },
                { code: "de", label: "Deutsch", desc: "German", flag: "🇩🇪" },
              ].map((langItem) => (
                <button
                  key={langItem.code}
                  id={`lang-select-${langItem.code}`}
                  onClick={() => {
                    setLang(langItem.code as LanguageCode);
                    sfx.playFlip();
                    setGameState("mode-select");
                    // Speak welcome in newly chosen language
                    setTimeout(() => {
                      const msg = TRANSLATIONS[langItem.code as LanguageCode].gameTitle;
                      playTts(msg, langItem.code as LanguageCode);
                    }, 400);
                  }}
                  className="bg-gradient-to-b from-white to-indigo-50/50 hover:to-indigo-50 border-2 border-indigo-100 hover:border-indigo-400 p-4 rounded-3xl flex flex-col items-center justify-center transition-all shadow-[0_8px_0_0_#E2E8F0] active:translate-y-[4px] active:shadow-[0_4px_0_0_#E2E8F0] group transform cursor-pointer"
                >
                  <span className="text-4xl mb-2 filter drop-shadow">{langItem.flag}</span>
                  <span className="font-bold text-indigo-950 text-lg group-hover:text-indigo-700">
                    {langItem.label}
                  </span>
                  <span className="text-xs text-indigo-500/70 font-medium">{langItem.desc}</span>
                </button>
              ))}
            </div>

            {/* Credits badge */}
            <div className="mt-8 text-xs text-indigo-900/60 flex flex-col items-center gap-1">
              <p className="font-bold">Developed by Impact Hub Egypt for Preschoolers (Ages 3-6)</p>
              <p className="opacity-75">Provides beautiful graphics, speech feedback, and achievements certificates</p>
            </div>
          </div>
        )}

        {/* VIEW 2: Selection of Game Level Modes & Difficulty */}
        {gameState === "mode-select" && lang && (
          <div className="w-full max-w-4xl bg-white/80 backdrop-blur-lg rounded-[32px] p-6 md:p-8 shadow-2xl border-t-2 border-white border-white/50 animate-float-island">
            
            {/* Header */}
            <div className="text-center mb-6">
              <h2 className="text-2xl md:text-3xl font-extrabold text-indigo-950 mb-1">
                {t.chooseMode}
              </h2>
              <p className="text-sm text-indigo-800/80 font-semibold">
                {t.chooseLang}
              </p>
            </div>

            {/* Quick Difficulty selector (Artistic style) */}
            <div className="max-w-md mx-auto bg-white/40 p-1.5 rounded-2xl flex items-center justify-around mb-8 border border-white/60 shadow-inner">
              {(["easy", "medium", "hard"] as GameDifficulty[]).map((diffKey) => (
                <button
                  key={diffKey}
                  id={`diff-btn-${diffKey}`}
                  onClick={() => {
                    sfx.playFlip();
                    setDifficulty(diffKey);
                  }}
                  className={`px-4 py-2 rounded-xl text-xs font-extrabold transition-all transform cursor-pointer ${
                    difficulty === diffKey
                      ? "bg-indigo-600 text-white shadow-lg shadow-indigo-200 scale-105"
                      : "text-indigo-800 hover:bg-white/40"
                  }`}
                >
                  {t[diffKey]}
                </button>
              ))}
            </div>

            {/* Level mode carousel list */}
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
              {GAME_MODES.map((mode, index) => {
                const isUnlocked = unlockedModes.includes(mode.id);
                return (
                  <div
                    key={mode.id}
                    id={`mode-card-${mode.id}`}
                    className={`relative rounded-3xl p-5 border flex flex-col justify-between transition-all ${
                      isUnlocked
                        ? "bg-white border-t-2 border-white border-indigo-100 hover:border-indigo-400 shadow-[0_8px_0_0_#E2E8F0] hover:shadow-[0_12px_0_0_#E2E8F0] hover:-translate-y-1 cursor-pointer"
                        : "bg-indigo-50/40 border-indigo-100/20 shadow-inner opacity-75"
                    }`}
                  >
                    <div>
                      {/* Number badge */}
                      <div className="flex items-center justify-between mb-3">
                        <span className={`w-8 h-8 rounded-full text-xs font-black flex items-center justify-center ${
                          isUnlocked ? "bg-indigo-100 text-indigo-700 shadow-sm" : "bg-indigo-50/50 text-indigo-400"
                        }`}>
                          {mode.id}
                        </span>
                        <span>
                          {isUnlocked ? (
                            <Unlock size={14} className="text-emerald-500" />
                          ) : (
                            <Lock size={14} className="text-indigo-300" />
                          )}
                        </span>
                      </div>

                      {/* Mode Title & Description */}
                      <h3 className="font-bold text-indigo-950 text-sm mb-2">
                        {mode.title[lang]}
                      </h3>
                      <p className="text-indigo-900/60 text-[11px] font-semibold leading-tight line-clamp-3">
                        {mode.description[lang]}
                      </p>
                    </div>

                    <div className="mt-5">
                      {isUnlocked ? (
                        <button
                          id={`start-mode-btn-${mode.id}`}
                          onClick={() => startGame(mode.id, difficulty)}
                          className="w-full bg-gradient-to-r from-indigo-500 to-indigo-600 hover:from-indigo-600 hover:to-indigo-700 text-white font-black text-xs py-2.5 rounded-2xl shadow-md transition-all transform active:scale-95 cursor-pointer"
                        >
                          {t.playAgain}
                        </button>
                      ) : (
                        <div className="text-center text-[10px] font-bold text-indigo-300 bg-indigo-50/50 py-2 rounded-2xl border border-indigo-100/10">
                          Locked
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Parental / Teacher Override Bypass button */}
            <div className="mt-8 flex flex-col items-center gap-2 border-t border-indigo-100/40 pt-6">
              <button
                id="cheat-unlock-btn"
                onClick={bypassAllUnlocks}
                className="text-indigo-600 hover:text-indigo-800 hover:underline text-xs font-bold flex items-center gap-1.5 cursor-pointer"
              >
                🔐 {t.cheatUnlock}
              </button>
              <button
                onClick={() => setGameState("welcome")}
                className="text-slate-400 hover:text-slate-600 text-xs font-bold flex items-center gap-1 cursor-pointer"
              >
                {isRtl ? <ChevronRight size={14} /> : <ChevronLeft size={14} />} {t.back}
              </button>
            </div>

          </div>
        )}

        {/* VIEW 3: ACTIVE PLAYING LEVEL FIELD */}
        {gameState === "playing" && selectedMode && lang && (
          <div className="w-full max-w-4xl flex flex-col items-center gap-5">
            
            {/* Context Interactive prompt / instruction bubble */}
            <div className="bg-indigo-600/90 backdrop-blur-md text-white font-bold text-sm md:text-base px-6 py-2.5 rounded-full shadow-lg flex items-center gap-2 relative border border-indigo-500 animate-pulse">
              <span className="text-yellow-300">💡</span>
              <p>{promptText}</p>
              {isAudioLoading && (
                <span className="text-xs bg-indigo-800 text-indigo-200 px-2.5 py-0.5 rounded-full animate-pulse flex items-center gap-1">
                  🔊 {t.loadingAudio}
                </span>
              )}
            </div>

            {/* Main matching cards 3D Board in the Artistic Garden Table */}
            <div className="relative w-full max-w-3xl p-6 md:p-12 mb-4">
              {/* Grass Glow */}
              <div className="absolute inset-x-10 bottom-0 h-48 bg-[#65A30D] rounded-[100%] blur-3xl opacity-30 pointer-events-none"></div>
              
              {/* Garden Board Base */}
              <div className="absolute inset-0 bg-gradient-to-b from-[#84CC16] to-[#4D7C0F] rounded-[40px] md:rounded-[100px] transform -rotate-1 shadow-2xl overflow-hidden border-4 md:border-8 border-[#3F6212]/20 pointer-events-none">
                <div className="absolute top-0 left-0 w-full h-full opacity-20 pointer-events-none" style={{ backgroundImage: "radial-gradient(#fff 1px, transparent 0)", backgroundSize: "24px 24px" }}></div>
                <div className="absolute bottom-4 right-10 flex gap-2">
                  <div className="w-4 h-4 bg-red-400 rounded-full shadow-inner"></div>
                  <div className="w-3 h-3 bg-yellow-300 rounded-full shadow-inner"></div>
                  <div className="w-5 h-5 bg-pink-400 rounded-full shadow-inner mt-2"></div>
                </div>
              </div>

              {/* Real Interactive Card Grid */}
              <div
                className={`relative z-20 w-full grid gap-4 justify-center items-center px-4 ${
                  difficulty === "easy"
                    ? "grid-cols-3 max-w-2xl mx-auto"
                    : "grid-cols-4 mx-auto"
                }`}
              >
                {cards.map((card, index) => {
                  const isAudioType = card.type === "audio";
                  return (
                    <div
                      key={card.id}
                      id={`game-card-wrapper-${index}`}
                      onClick={() => handleCardClick(index)}
                      className="w-full aspect-[4/5] perspective-600 cursor-pointer"
                    >
                      {/* Inner perspective card layout */}
                      <div
                        id={`game-card-${index}`}
                        className={`w-full h-full duration-500 preserve-3d relative rounded-2xl md:rounded-3xl shadow-md transition-all ${
                          card.isFlipped || card.isMatched ? "rotate-y-180" : ""
                        } ${
                          card.isCelebrating ? "animate-victory-shake ring-4 ring-emerald-400 scale-105" : ""
                        }`}
                      >
                        
                        {/* CARD BACKSIDE: Mysterious Golden Impact Hub tile */}
                        <div className="absolute inset-0 backface-hidden w-full h-full bg-indigo-500 rounded-2xl md:rounded-3xl shadow-[0_6px_0_0_#312E81] md:shadow-[0_12px_0_0_#312E81] flex flex-col items-center justify-center border-t-2 border-indigo-400 hover:brightness-110 transition-all">
                          <div className="w-10 h-10 md:w-16 md:h-16 border-4 border-white/30 rounded-2xl rotate-45 flex items-center justify-center pointer-events-none">
                            <div className="w-6 h-6 md:w-10 md:h-10 border-2 border-white/20 rounded-xl flex items-center justify-center">
                              <span className="text-sm md:text-xl text-yellow-300 -rotate-45">⭐</span>
                            </div>
                          </div>
                          <span className="text-[8px] md:text-[10px] text-indigo-200 font-extrabold tracking-widest uppercase mt-2 md:mt-3">
                            EGYPT 6
                          </span>
                        </div>

                        {/* CARD FRONTSIDE (Revealed) */}
                        <div className={`absolute inset-0 backface-hidden rotate-y-180 w-full h-full bg-white rounded-2xl md:rounded-3xl shadow-[0_6px_0_0_#E2E8F0] md:shadow-[0_12px_0_0_#E2E8F0] flex flex-col items-center justify-center border-t-2 border-white relative transition-all ${
                          card.isMatched ? "ring-4 md:ring-8 ring-yellow-400 ring-offset-2 md:ring-offset-4 ring-offset-[#65A30D]" : ""
                        }`}>
                          {/* Matched stamp badge */}
                          {card.isMatched && (
                            <span className="absolute top-1 right-1 bg-emerald-100 text-emerald-800 text-[9px] font-bold px-1.5 py-0.5 rounded-full z-10 flex items-center gap-0.5 shadow-sm">
                              <Check size={8} /> OK
                            </span>
                          )}

                          {/* Audio Type Cards */}
                          {isAudioType ? (
                            <div className="flex flex-col items-center gap-2">
                              <button
                                id={`card-speaker-btn-${index}`}
                                onClick={(e) => handleReplaySpeakerAudio(index, e)}
                                className="w-12 h-12 md:w-14 md:h-14 rounded-full bg-gradient-to-tr from-indigo-500 to-indigo-600 hover:brightness-110 text-white flex items-center justify-center shadow-lg transition-all cursor-pointer"
                                title="Play Pronunciation"
                              >
                                <Volume2 size={24} className="animate-pulse" />
                              </button>
                              <span className="text-[8px] md:text-[10px] text-indigo-400 font-extrabold uppercase tracking-wider text-center px-1">
                                {t.audioInstructions}
                              </span>
                            </div>
                          ) : card.type === "picture" ? (
                            /* Picture cards are giant cute emojis */
                            <span className="text-5xl md:text-6xl filter drop-shadow hover:scale-110 transition-transform select-none">
                              {card.content}
                            </span>
                          ) : card.type === "letter" ? (
                            /* Letter cards are bold colorful display letter text */
                            <span className="text-4xl md:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-br from-indigo-700 to-indigo-950 select-none">
                              {card.content}
                            </span>
                          ) : (
                            /* Word cards display written vocabulary name */
                            <div className="bg-indigo-50/50 border border-indigo-100 px-3 py-2 rounded-xl max-w-[90%] text-center">
                              <span className="text-base md:text-lg font-black text-indigo-950 select-none tracking-tight">
                                {card.content}
                              </span>
                            </div>
                          )}

                          {/* Vocabulary label in small font if matched */}
                          {card.isMatched && !isAudioType && card.type !== "word" && (
                            <span className="absolute bottom-1 bg-slate-100 text-slate-700 text-[10px] font-bold px-2 rounded-md">
                              {VOCAB_ITEMS.find((v) => v.id === card.itemId)?.[lang].word}
                            </span>
                          )}

                        </div>

                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Bottom game status stats bar */}
            <div className="w-full max-w-xl bg-white/40 backdrop-blur-md px-6 py-3 rounded-3xl border border-white/50 flex items-center justify-between gap-2 shadow-2xl text-sm">
              <div className="font-semibold text-indigo-950">
                {t.turns}: <span className="text-indigo-600 font-extrabold text-lg">{turnsCount}</span>
              </div>
              <div className="font-semibold text-indigo-950">
                {t.matches}: <span className="text-emerald-600 font-extrabold text-lg">{matchesCount}</span>
              </div>
              <button
                id="quit-round-btn"
                onClick={() => {
                  sfx.playFlip();
                  setGameState("mode-select");
                }}
                className="text-xs bg-rose-600 hover:bg-rose-700 text-white font-bold px-4 py-2 rounded-xl shadow-md shadow-rose-200 transition-all cursor-pointer"
              >
                {t.back}
              </button>
            </div>

          </div>
        )}

        {/* VIEW 4: CONGRATULATIONS & CELEBRATION CERTIFICATE SCREEN */}
        {gameState === "complete" && selectedMode && lang && (
          <div className="w-full max-w-xl bg-white/95 backdrop-blur-md rounded-[32px] p-6 md:p-8 shadow-2xl border-t-2 border-white border-indigo-100 text-center relative overflow-hidden animate-float-island">
            
            {/* Achievement Badge decoration */}
            <div className="w-20 h-20 bg-amber-100 text-amber-500 rounded-full flex items-center justify-center mx-auto mb-4 border border-amber-200 shadow-md">
              <Award size={48} className="animate-bounce" />
            </div>

            {/* Victory Titles */}
            <h2 className="text-2xl md:text-3xl font-extrabold text-indigo-950 mb-2">
              {t.wellDone}
            </h2>
            <p className="text-sm text-indigo-900/60 mb-6 font-bold">
              {t.levelUnlockedMsg}
            </p>

            {/* Match summary details card */}
            <div className="bg-gradient-to-b from-white to-indigo-50/20 rounded-3xl shadow-[0_6px_0_0_#E2E8F0] border-t-2 border-white border-indigo-100 p-5 max-w-sm mx-auto mb-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center">
                  <p className="text-indigo-950/60 text-xs font-black uppercase">{t.stars} Earned</p>
                  <p className="text-2xl font-black text-amber-500">
                    +{difficulty === "easy" ? 3 : difficulty === "medium" ? 5 : 8} ⭐
                  </p>
                </div>
                <div className="text-center">
                  <p className="text-indigo-950/60 text-xs font-black uppercase">{t.turns}</p>
                  <p className="text-2xl font-black text-indigo-600">{turnsCount}</p>
                </div>
              </div>
            </div>

            {/* Hidden Canvas used for dynamic downloadable Image certificate */}
            <canvas ref={canvasRef} width={800} height={600} className="hidden" />

            {/* Action Buttons */}
            <div className="flex flex-col gap-3 max-w-xs mx-auto">
              {/* Screenshot download Certificate */}
              <button
                id="download-cert-btn"
                onClick={downloadCertificate}
                className="w-full bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 font-black py-3 px-6 rounded-2xl hover:from-amber-600 hover:to-amber-700 transition-all shadow-md transform active:scale-95 flex items-center justify-center gap-2 cursor-pointer"
              >
                <Camera size={18} />
                <span>{t.screenshot}</span>
              </button>

              {/* Progress: Go to next unlocked Level */}
              {selectedMode < 5 && (
                <button
                  id="cert-next-level-btn"
                  onClick={() => startGame(selectedMode + 1, difficulty)}
                  className="w-full bg-gradient-to-r from-indigo-500 to-indigo-600 text-white font-bold py-3 px-6 rounded-2xl hover:from-indigo-600 hover:to-indigo-700 transition-all shadow-md transform active:scale-95 cursor-pointer"
                >
                  {t.nextLevel}
                </button>
              )}

              {/* Replay this Level mode */}
              <button
                id="cert-replay-btn"
                onClick={() => startGame(selectedMode, difficulty)}
                className="w-full bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold py-3 px-6 rounded-2xl transition-all border border-indigo-200 cursor-pointer"
              >
                {t.restart}
              </button>

              {/* Home */}
              <button
                id="cert-home-btn"
                onClick={() => {
                  sfx.playFlip();
                  setGameState("mode-select");
                }}
                className="text-indigo-600/60 hover:text-indigo-800 text-xs font-extrabold py-1.5 cursor-pointer"
              >
                {t.home}
              </button>
            </div>

          </div>
        )}

      </main>

      {/* FOOTER CO-BRANDING - High Contrast Artistic Footer Bar */}
      <footer className="relative z-10 py-4 bg-indigo-950 text-white/70 text-[10px] font-bold tracking-widest mt-auto border-t border-indigo-900">
        <div className="max-w-7xl mx-auto px-8 flex flex-col md:flex-row items-center justify-between gap-3">
          <div className="flex flex-col md:flex-row items-center gap-2 md:gap-4">
            <span>DEVELOPED BY IMPACT HUB EGYPT</span>
            <span className="hidden md:inline opacity-30">|</span>
            <span className="uppercase">{lang ? t.hubDev : "Educational Games Collection"}</span>
          </div>
          <div className="flex gap-4 md:gap-6 uppercase text-center mt-1 md:mt-0">
            <span className="flex items-center gap-1">
              <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse"></div> AUDIO ENGINE SECURE
            </span>
            <span>VER. 1.2.0-PROD</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
