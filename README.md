# Learn Arabic with Anshad 🌟 (تَعَلُّم اللُّغَة العَرَبِيَّة مَعَ أَنْشَاد)

A complete, production-ready, interactive Arabic letter learning web application tailored for children aged 5–7 years, Arabic tutors, teachers, and parents. Hosted on Vercel at [learnfromanshad.vercel.app](https://learnfromanshad.vercel.app).

---

## 🌟 Key Features

### 1. Arabic Alphabet Learning System (28 Letters)
- All 28 traditional Arabic letters in classical order:
  `ا ب ت ث ج ح خ د ذ ر ز س ش ص ض ط ظ ع غ ف ق ك ل م ن ه و ي`
- Dedicated individual letter lesson pages with large responsive displays, pronunciations, and descriptions.
- Accurate 4-written form teaching for each letter (**Isolated, Initial, Medial, Final**), with linguistic rules for letters that do not connect to subsequent letters (`ا, د, ذ, ر, ز, و`).

### 2. 840 Verified Educational Vocabulary Examples
- Exactly 30 rich educational examples for each of the 28 letters.
- Tagged with target letter position: **Beginning, Middle, End**.
- Includes authentic Arabic diacritics, English transliterations, child-friendly meanings, emoji visuals, and audio pronunciation.

### 3. 24 Distinct Playable Educational Games
- **Recognition Games (6):**
  1. *Letter Safari* — Spot the requested letter among distractors.
  2. *Letter and Picture Match* — Associate letters with starting sounds and visuals.
  3. *Find the Different Letter* — Identify the odd letter in the group.
  4. *Letter Memory Cards* — Card-flip matching pairs.
  5. *Letter Detective* — Count how many target letters appear in a line.
  6. *Letter Bingo* — Listen to audio calls and mark matching cells to form lines.
- **Writing & Form Games (6):**
  7. *Trace the Letter* — Guided drawing canvas with clear and check actions.
  8. *Connect the Dots* — Connect numbered points (1, 2, 3...) to reveal letters.
  9. *Build the Letter* — Place the 4 written forms into matching slots.
  10. *Letter Shape Match* — Match isolated, initial, medial, and final forms.
  11. *Complete the Word* — Fill in the missing letter in illustrated words.
  12. *Arabic Letter Puzzle* — Reassemble scrambled quadrant tiles.
- **Listening & Vocabulary Games (6):**
  13. *Listen and Choose* — Listen to Arabic pronunciation and pick the matching letter.
  14. *Sound Safari* — Identify which animal or object starts with the target sound.
  15. *Picture Hunt* — Find pictures matching the Arabic word.
  16. *Word Builder* — Sequence letter blocks in order to spell words.
  17. *Listen and Match* — Spoken Arabic matched to pictures.
  18. *Beginning, Middle, or End?* — Identify letter position inside vocabulary.
- **Arcade & Challenge Games (6):**
  19. *Letter Balloon Pop* — Pop floating balloons with target letters.
  20. *Letter Fishing* — Hook swimming fish carrying letters.
  21. *Treasure Chest Challenge* — Solve questions to unlock 5 golden padlocks.
  22. *Rocket Letter Race* — Answer questions to propel a rocket to the stars.
  23. *Letter Catcher* — Slide a basket left and right to catch target letters.
  24. *Daily Letter Quest* — Multi-stage daily mission with star rewards.

### 4. Teacher & Classroom Portals
- **Teacher Dashboard:** Manage classrooms, review enrollment, launch live monitors.
- **Student Management:** Issue student usernames and 4-digit secret PINs without exposing complex credentials.
- **Live Learning Monitor:** Supabase Realtime dashboard displaying student active sessions, game progress, letter being learned, score, and accuracy in real time.
- **Reporting & CSV Export:** Filtered activity history with one-click CSV report export.

---

## 🛠️ Technology Stack

- **Frontend:** React 18, TypeScript, Vite, Tailwind CSS v3, Framer Motion, Lucide Icons, canvas-confetti, @radix-ui primitives.
- **Backend & Database:** Supabase (PostgreSQL, Supabase Auth, Supabase Realtime, Storage).
- **Testing:** Vitest, Testing Library, JSDOM.

---

## 🚀 Getting Started

### 1. Installation
```bash
# Clone or navigate to the repository
cd arabiclearn

# Install dependencies
npm install
```

### 2. Environment Variables
Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```
Ensure your Supabase project keys are present:
```env
VITE_SUPABASE_URL=https://omrddkzpwchbfkvtzvos.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=sb_publishable_LzRcuPtDH7mghhfs15ZAEg_5G59Jisf
```

### 3. Database Migration & Seeding
Migrations and seed scripts are committed to the repository:
- `supabase/migrations/20261029000000_initial_schema.sql` — Schema with RLS policies, tables, and realtime publication.
- `supabase/seed.sql` — 28 letters, forms, and all 840 educational examples.

You can run these directly via the Supabase Dashboard SQL Editor or via the Supabase CLI:
```bash
npx supabase db push
```

### 4. Running the Development Server
```bash
npm run dev
```
Open [http://localhost:5173](http://localhost:5173) in your browser.

### 5. Running Automated Tests
```bash
npm run test
```

### 6. Production Build
```bash
npm run build
```
Generates optimized, code-split chunks in `dist/`.

---

## 📁 Project Architecture

```
src/
├── components/
│   ├── arabic/       # ArabicText, LetterCard
│   ├── game/         # GameCard, GameComplete
│   ├── layout/       # Navbar, Layout
│   └── ui/           # Button, Card, Modal, ProgressBar, StarRating
├── data/
│   ├── arabicLetters.ts   # 28 letters + 4-form configurations
│   └── letterExamples.ts  # 840 distinct validated vocabulary examples
├── hooks/
│   ├── useArabicSpeech.ts # Web Speech TTS abstraction
│   ├── useAuth.tsx        # Supabase authentication & profile state
│   ├── useConfetti.ts     # Celebration bursts
│   ├── useGameSession.ts  # Session scoring & Supabase persistence
│   └── useSound.ts        # Web Audio API synthesizers
├── pages/
│   ├── games/             # 24 distinct playable games
│   ├── AlphabetPage.tsx   # All 28 letters explorer
│   ├── HomePage.tsx       # Child-friendly landing hero
│   ├── LetterPage.tsx     # Individual letter lesson
│   ├── LiveMonitorPage.tsx# Live classroom Realtime monitor
│   ├── ReportsPage.tsx    # Teacher report & CSV exporter
│   ├── SettingsPage.tsx   # Accessibility controls
│   ├── StudentDashboardPage.tsx
│   ├── StudentLoginPage.tsx
│   ├── StudentProgressPage.tsx
│   ├── TeacherDashboardPage.tsx
│   ├── TeacherLoginPage.tsx
│   ├── TeacherStudentsPage.tsx
│   └── WordExplorerPage.tsx
└── test/                  # Vitest test suite
```
