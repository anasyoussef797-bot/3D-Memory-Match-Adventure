# Game #6: 3D Memory Match Adventure - Impact Hub Egypt

Welcome to **3D Memory Match Adventure**, a premium, high-fidelity, multilingual educational game designed for preschoolers aged 3–6 to improve memory, concentration, and multilingual vocabulary. 

This game is **Game #6** in the *Impact Hub Egypt Educational Games Collection*.

---

## 🌟 Key Features

1. **Multilingual Architecture**: Fully supports **Arabic (RTL)**, **English (LTR)**, **French (LTR)**, and **German (LTR)**. All words, instructions, titles, and voice pronunciations adapt seamlessly.
2. **5 Progressive Game Modes**:
   - **Mode 1: Letter ↔ Letter** – Match phonetic letters together (e.g. `A` ↔ `A`).
   - **Mode 2: Letter ↔ Picture** – Match the starting letter with the correct illustration (e.g. `B` ↔ `🍌`).
   - **Mode 3: Picture ↔ Word** – Match the visual illustration with its written spelling (e.g. `🍎` ↔ `Apple`).
   - **Mode 4: Audio ↔ Picture** – Tap the speaker to listen, then match it with the correct visual image (e.g. `🔊` ↔ `🐬`).
   - **Mode 5: Audio ↔ Word** – Tap the speaker to listen, then match it with the correct written spelling (e.g. `🔊` ↔ `Dolphin`).
3. **Adaptive Leveling**: Unlocks harder game modes automatically as the child scores stars. A Parent/Teacher bypass button is included for classroom demonstrations.
4. **Interactive 3D Perspective Card Deck**: Beautiful glassmorphic card cards that float, glow, flip in full 3D, and celebrate using happy sound effects and confetti on matches.
5. **Dynamic Audio Pronunciation (TTS)**: Leverages a high-performance proxy server (`/api/tts`) with Google Translate TTS and Web Speech Synthesis fallbacks to pronounce letters/words in all 4 languages.
6. **Certificate Generator**: Generates high-quality physical achievement certificates on a Canvas representing a personalized congratulations badge from Impact Hub Egypt, downloadable instantly.

---

## 🛠️ Vercel & GitHub Deployment

This project is pre-configured and ready to be deployed to Vercel or pushed to GitHub with zero changes.

### Quick Deploy to Vercel

1. Push these contents to a new GitHub repository.
2. Open the [Vercel Dashboard](https://vercel.com/) and click **Add New Project**.
3. Import your GitHub repository.
4. Select **Next.js** as the Framework Preset.
5. Leave all settings at default and click **Deploy**.
6. The Serverless TTS function (`/api/tts.js`) and Next.js frontend (`app/page.tsx`) will be hosted automatically.

### Running Next.js Locally

To run the Next.js version in your local machine:

```bash
# Go to the exported directory
cd vercel-export

# Install dependencies
npm install

# Start development server
npm run dev
```

---

## 🎓 Educational Design

This game uses an carefully chosen set of **8 vocabulary items** that contain **100% unique starting letters** across all 4 languages. This guarantees zero ambiguity or overlapping letters during matching, allowing toddler children to build high-accuracy neural associations.

| Item | English (Letter/Word) | Arabic (Letter/Word) | French (Letter/Word) | German (Letter/Word) |
| --- | --- | --- | --- | --- |
| 🍎 | **A**pple | **ت**فاحة | **P**omme | **A**pfel |
| 🍌 | **B**anana | **م**وزة | **B**anane | **B**anane |
| 🐫 | **C**amel | **ج**مل | **C**hameau | **K**amel |
| 🐬 | **D**olphin | **د**ولفين | **D**auphin | **D**elphin |
| 🐘 | **E**lephant | **ف**يل | **E**léphant | **E**lefant |
| 🐸 | **F**rog | **ض**فدع | **G**renouille | **F**rosch |
| 🍇 | **G**rape | **ع**نب | **R**aisin | **W**eintraube |
| 🐰 | **R**abbit | **أ**رنب | **L**apin | **H**ase |

---

Developed by **Impact Hub Egypt**. Designed to optimize focus and phonetic correlation for preschoolers.
