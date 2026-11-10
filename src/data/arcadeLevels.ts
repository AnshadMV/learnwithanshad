import { ARABIC_LETTERS, type LetterData, getLetterById } from './arabicLetters'
import { getConfusableDistractors, LETTER_PEDAGOGY } from './letterPedagogy'
import { getLetterVariants, type LetterVariant } from './letterVariants'
import { LETTER_EXAMPLES, type LetterExample } from './letterExamples'
import { pickRandom, shuffleArray } from '@/lib/utils'

// ---------------------------------------------------------------------------
// Core Arcade Types
// ---------------------------------------------------------------------------

export type ArcadeDifficulty = 'adaptive' | 'simple' | 'medium' | 'hard'
export type ResolvedDifficulty = 'simple' | 'medium' | 'hard'
export type ArcadeLetterMode = 'mixed' | 'more-letters' | 'letter-types'

export interface ArcadeLevelDef {
  level: number // 1..10
  id: string
  title: string
  subtitle: string
  gameStyle: string
  icon: string
  gradient: string
  accentColor: string
  badge: string
  controlsHint: string
  defaultWaveSeconds: number
  defaultLevelSeconds: number
  targetGoalCount: number
  supportsArrows: boolean
  isWordwallClassic?: boolean
}

export interface MoleOption {
  id: string
  char: string
  label: string
  arabicLabel?: string
  isTarget: boolean
  letterId: string
  variantType?: string
}

export interface MoleWave {
  waveIndex: number // 0..9 (10 waves!)
  waveNumber: number // 1..10
  difficulty: ResolvedDifficulty
  holeCount: number // 3 -> 5 -> 6 -> 8 burrows
  promptTitle: string
  promptSubtitle: string
  targetChar: string
  targetLabel: string
  durationSeconds: number // default 10s!
  moles: MoleOption[]
}

export interface MazeCoord {
  r: number
  c: number
}

export interface MazeChamber {
  id: string
  coord: MazeCoord
  char: string
  label: string
  isTarget: boolean
}

export interface MazePatrol {
  id: string
  path: MazeCoord[]
  speedMs: number
}

export interface MazeConfig {
  rows: number
  cols: number
  grid: number[][] // 1 = wall, 0 = walkable corridor
  playerStart: MazeCoord
  chambers: MazeCoord[]
  patrols: MazePatrol[]
}

// ---------------------------------------------------------------------------
// 10 Levels Registry (Available for ALL 28 Arabic Letters)
// ---------------------------------------------------------------------------

export const ARCADE_LEVELS: ArcadeLevelDef[] = [
  {
    level: 1,
    id: 'mole-whack',
    title: 'Mole Burrow Hit',
    subtitle: 'Whack the selected Arabic letter & its types within 10 seconds across 10 waves!',
    gameStyle: 'Whack-a-Mole',
    icon: '🐹',
    gradient: 'from-amber-400 via-orange-500 to-yellow-500',
    accentColor: '#D97706',
    badge: '10 Waves • 10s Touch',
    controlsHint: 'Tap or click the mole holding the target Arabic letter!',
    defaultWaveSeconds: 10,
    defaultLevelSeconds: 100,
    targetGoalCount: 10,
    supportsArrows: false,
    isWordwallClassic: true,
  },
  {
    level: 2,
    id: 'maze-chase',
    title: 'Cosmic Maze Chase',
    subtitle: 'Use arrow buttons to guide your explorer to the target Arabic letter & dodge alien chasers!',
    gameStyle: 'Maze Chase',
    icon: '🛸',
    gradient: 'from-indigo-600 via-purple-600 to-blue-700',
    accentColor: '#6366F1',
    badge: 'Arrow Buttons • 3 Hearts',
    controlsHint: 'Use ▲ ▼ ◀ ▶ Arrow buttons or keyboard arrows to move!',
    defaultWaveSeconds: 45,
    defaultLevelSeconds: 60,
    targetGoalCount: 5,
    supportsArrows: true,
    isWordwallClassic: true,
  },
  {
    level: 3,
    id: 'balloon-blitz',
    title: 'Sky Balloon Pop Blitz',
    subtitle: 'Pop rising Arabic letter & harakat balloons before the 10-second wave timer runs out!',
    gameStyle: 'Balloon Pop',
    icon: '🎈',
    gradient: 'from-sky-400 via-blue-500 to-cyan-500',
    accentColor: '#0284C7',
    badge: '10 Waves • 10s Pop',
    controlsHint: 'Tap rising balloons matching the target Arabic letter!',
    defaultWaveSeconds: 10,
    defaultLevelSeconds: 100,
    targetGoalCount: 10,
    supportsArrows: false,
    isWordwallClassic: true,
  },
  {
    level: 4,
    id: 'arrow-flight',
    title: 'Sky Flyer Arrow Dash',
    subtitle: 'Steer your plane with Up/Down arrows into target Arabic letter clouds & dodge storm clouds!',
    gameStyle: 'Airplane Lanes',
    icon: '✈️',
    gradient: 'from-cyan-500 via-teal-500 to-emerald-600',
    accentColor: '#0D9488',
    badge: 'Arrow Flight • 8 Waves',
    controlsHint: 'Press ▲ / ▼ arrow buttons to steer lanes and catch the letter!',
    defaultWaveSeconds: 12,
    defaultLevelSeconds: 80,
    targetGoalCount: 8,
    supportsArrows: true,
    isWordwallClassic: true,
  },
  {
    level: 5,
    id: 'memory-blitz',
    title: 'Arabic Forms Memory Flip',
    subtitle: 'Flip cards to match isolated, connected forms & harakat pairs of the Arabic letter!',
    gameStyle: 'Match Pairs',
    icon: '🃏',
    gradient: 'from-rose-500 via-pink-500 to-fuchsia-600',
    accentColor: '#DB2777',
    badge: 'Timed Match • Letter Types',
    controlsHint: 'Tap two matching Arabic letter cards to clear the board!',
    defaultWaveSeconds: 60,
    defaultLevelSeconds: 75,
    targetGoalCount: 6,
    supportsArrows: false,
    isWordwallClassic: true,
  },
  {
    level: 6,
    id: 'conveyor-sorter',
    title: 'Conveyor Crate Sorter',
    subtitle: 'Sort incoming Arabic letter crates into Target vs Other gates using Left/Right arrows!',
    gameStyle: 'Group Sort',
    icon: '📦',
    gradient: 'from-teal-600 via-cyan-600 to-blue-700',
    accentColor: '#0891B2',
    badge: 'Arrow Sort • 10 Crates',
    controlsHint: 'Tap Left ◀ or Right ▶ gate buttons to sort each crate!',
    defaultWaveSeconds: 10,
    defaultLevelSeconds: 90,
    targetGoalCount: 10,
    supportsArrows: true,
    isWordwallClassic: true,
  },
  {
    level: 7,
    id: 'quiz-show',
    title: 'Game Show Quiz Blitz',
    subtitle: 'Beat the 10-second buzzer! Identify sounds, dots, and written shapes with bonus lifelines.',
    gameStyle: 'Gameshow Quiz',
    icon: '🎤',
    gradient: 'from-violet-600 via-purple-600 to-indigo-700',
    accentColor: '#7C3AED',
    badge: '10s Buzzer • Lifelines',
    controlsHint: 'Tap the right answer before the 10-second stage timer runs out!',
    defaultWaveSeconds: 10,
    defaultLevelSeconds: 100,
    targetGoalCount: 8,
    supportsArrows: false,
    isWordwallClassic: true,
  },
  {
    level: 8,
    id: 'arrow-catcher',
    title: 'Star Basket Arrow Catch',
    subtitle: 'Slide your golden basket Left & Right with arrow buttons to catch falling Arabic stars!',
    gameStyle: 'Basket Catch',
    icon: '🌟',
    gradient: 'from-amber-500 via-yellow-500 to-orange-500',
    accentColor: '#EA580C',
    badge: '◀ ▶ Arrows • 10 Stars',
    controlsHint: 'Use ◀ and ▶ arrow buttons to catch the target Arabic letter!',
    defaultWaveSeconds: 45,
    defaultLevelSeconds: 60,
    targetGoalCount: 10,
    supportsArrows: true,
    isWordwallClassic: true,
  },
  {
    level: 9,
    id: 'word-hunter',
    title: 'Arabic Word Form Forge',
    subtitle: 'Spot the exact Initial, Medial, or Final form needed to complete real Arabic words!',
    gameStyle: 'Missing Word',
    icon: '📖',
    gradient: 'from-emerald-500 via-green-600 to-teal-600',
    accentColor: '#059669',
    badge: '8 Words • Real Vocab',
    controlsHint: 'Select the matching Arabic letter form that fits the word!',
    defaultWaveSeconds: 12,
    defaultLevelSeconds: 96,
    targetGoalCount: 8,
    supportsArrows: false,
    isWordwallClassic: true,
  },
  {
    level: 10,
    id: 'boss-gauntlet',
    title: 'Grand Master Boss Arena',
    subtitle: 'Ultimate 10-round Arabic letter showdown combining rapid mole strikes, sisters & speed!',
    gameStyle: 'Boss Gauntlet',
    icon: '🏆',
    gradient: 'from-red-600 via-rose-600 to-amber-500',
    accentColor: '#DC2626',
    badge: 'Final Boss • 10 Rounds',
    controlsHint: 'Conquer all 10 lightning rounds to master this Arabic letter!',
    defaultWaveSeconds: 10,
    defaultLevelSeconds: 100,
    targetGoalCount: 10,
    supportsArrows: false,
    isWordwallClassic: true,
  },
]

export function getArcadeLevelDef(level: number): ArcadeLevelDef {
  return ARCADE_LEVELS.find(l => l.level === level) || ARCADE_LEVELS[0]
}

// ---------------------------------------------------------------------------
// Difficulty Helpers
// ---------------------------------------------------------------------------

export function resolveWaveDifficulty(
  setting: ArcadeDifficulty,
  waveIndex: number,
  totalWaves: number = 10
): ResolvedDifficulty {
  if (setting !== 'adaptive') return setting
  const progress = waveIndex / Math.max(1, totalWaves - 1)
  if (progress < 0.34) return 'simple'
  if (progress < 0.68) return 'medium'
  return 'hard'
}

export function getWaveTimerSeconds(
  baseSeconds: number,
  difficulty: ResolvedDifficulty
): number {
  // Default 10s for standard/simple/medium, tighter on hard if custom not overriding
  if (baseSeconds !== 10) return baseSeconds
  if (difficulty === 'simple') return 10
  if (difficulty === 'medium') return 10
  return 10
}

// ---------------------------------------------------------------------------
// Level 1: 10-Wave Mole Whack Generator ("hit selected letter from more letter / that letter types")
// ---------------------------------------------------------------------------

export function generateLevel1MoleWaves(
  letterId: string,
  difficultySetting: ArcadeDifficulty = 'adaptive',
  letterMode: ArcadeLetterMode = 'mixed',
  waveSeconds: number = 10,
  totalWaves: number = 10
): MoleWave[] {
  const target = getLetterById(letterId) || ARABIC_LETTERS[0]
  const variants = getLetterVariants(target.id)
  const confusableIds = getConfusableDistractors(target.id, 5)
  const confusableLetters = confusableIds
    .map(id => getLetterById(id))
    .filter((l): l is LetterData => Boolean(l))
  const distinctLetters = ARABIC_LETTERS.filter(
    l => l.id !== target.id && !confusableIds.includes(l.id)
  )

  const waves: MoleWave[] = []

  for (let i = 0; i < totalWaves; i++) {
    const diff = resolveWaveDifficulty(difficultySetting, i, totalWaves)

    // Number of burrows increases smoothly: Simple=3-4, Medium=5, Hard=6-8
    const holeCount =
      diff === 'simple'
        ? i === 0 ? 3 : 4
        : diff === 'medium'
        ? 5
        : i >= totalWaves - 2 ? 8 : 6

    // Determine whether this wave focuses on "more-letters" or "letter-types"
    const useLetterTypes =
      letterMode === 'letter-types' ||
      (letterMode === 'mixed' && (diff === 'hard' || (diff === 'medium' && i % 2 === 1)))

    let targetChar = target.letter
    let targetLabel = `${target.name_english} (${target.letter})`
    let promptTitle = `Hit the letter ${target.name_english}!`
    let promptSubtitle = `Tap the mole showing ${target.letter} within ${waveSeconds}s`

    const moles: MoleOption[] = []

    if (useLetterTypes) {
      // Pick a specific variant/type of this letter (e.g., Fathah, Kasrah, Dammah, Initial, Medial, Final)
      const chosenVariant: LetterVariant =
        diff === 'simple'
          ? variants[0]
          : variants[(i + 1) % Math.min(variants.length, diff === 'medium' ? 7 : variants.length)]

      targetChar = chosenVariant.char
      targetLabel = chosenVariant.name
      promptTitle = `Hit ${chosenVariant.name}!`
      promptSubtitle = `Find "${chosenVariant.char}" among ${target.name_english} types & other letters`

      moles.push({
        id: `wave_${i}_target`,
        char: chosenVariant.char,
        label: chosenVariant.name,
        arabicLabel: chosenVariant.arabicName,
        isTarget: true,
        letterId: target.id,
        variantType: chosenVariant.type,
      })

      // In Hard mode on late waves, optionally add a second matching target mole or tricky other variants
      const otherVariants = shuffleArray(
        variants.filter(v => v.id !== chosenVariant.id && v.char !== chosenVariant.char)
      )
      const otherPool = diff === 'hard'
        ? [...otherVariants, ...confusableLetters.map(c => ({
            id: `conf_${c.id}`,
            char: c.letter,
            name: c.name_english,
            arabicName: c.name_arabic,
            type: 'other' as const,
          }))]
        : [
            ...otherVariants.slice(0, Math.ceil((holeCount - 1) / 2)),
            ...pickRandom(distinctLetters, holeCount).map(c => ({
              id: `dist_${c.id}`,
              char: c.letter,
              name: c.name_english,
              arabicName: c.name_arabic,
              type: 'other' as const,
            })),
          ]

      const seenChars = new Set<string>([chosenVariant.char])
      for (const item of shuffleArray(otherPool)) {
        if (moles.length >= holeCount) break
        if (seenChars.has(item.char)) continue
        seenChars.add(item.char)
        moles.push({
          id: `wave_${i}_d_${moles.length}_${item.id}`,
          char: item.char,
          label: item.name,
          arabicLabel: item.arabicName,
          isTarget: false,
          letterId: item.id,
          variantType: item.type,
        })
      }
    } else {
      // "more-letters": Target letter (or one of its simple forms) vs other Arabic letters
      const targetVariant =
        diff === 'simple'
          ? variants[0]
          : i % 3 === 0
          ? variants[0]
          : variants[(i % Math.min(4, variants.length))]

      targetChar = targetVariant.char
      targetLabel = targetVariant.name
      promptTitle = `Hit ${target.name_english} (${targetVariant.char})!`
      promptSubtitle =
        diff === 'simple'
          ? `Simple: Tap ${targetVariant.char} within ${waveSeconds} seconds!`
          : diff === 'medium'
          ? `Medium: Spot ${targetVariant.char} among 5 burrows!`
          : `Hard: Watch out for lookalike sister letters!`

      moles.push({
        id: `wave_${i}_target`,
        char: targetVariant.char,
        label: targetVariant.name,
        arabicLabel: targetVariant.arabicName,
        isTarget: true,
        letterId: target.id,
        variantType: targetVariant.type,
      })

      // Fill distractors: Simple uses visually distinct letters; Hard prioritizes confusable lookalikes
      const pool =
        diff === 'simple'
          ? shuffleArray(distinctLetters)
          : diff === 'medium'
          ? [...shuffleArray(confusableLetters).slice(0, 2), ...shuffleArray(distinctLetters)]
          : [...shuffleArray(confusableLetters), ...shuffleArray(distinctLetters)]

      const seenChars = new Set<string>([targetVariant.char])
      for (const d of pool) {
        if (moles.length >= holeCount) break
        if (seenChars.has(d.letter)) continue
        seenChars.add(d.letter)
        moles.push({
          id: `wave_${i}_d_${d.id}`,
          char: d.letter,
          label: d.name_english,
          arabicLabel: d.name_arabic,
          isTarget: false,
          letterId: d.id,
        })
      }
    }

    // Pad if ever short (safety guarantee)
    let padIdx = 0
    while (moles.length < holeCount && padIdx < ARABIC_LETTERS.length) {
      const candidate = ARABIC_LETTERS[padIdx++]
      if (!moles.some(m => m.char === candidate.letter)) {
        moles.push({
          id: `wave_${i}_pad_${candidate.id}`,
          char: candidate.letter,
          label: candidate.name_english,
          isTarget: candidate.id === target.id,
          letterId: candidate.id,
        })
      }
    }

    waves.push({
      waveIndex: i,
      waveNumber: i + 1,
      difficulty: diff,
      holeCount,
      promptTitle,
      promptSubtitle,
      targetChar,
      targetLabel,
      durationSeconds: waveSeconds,
      moles: shuffleArray(moles),
    })
  }

  return waves
}

// ---------------------------------------------------------------------------
// Level 2: Cosmic Maze Chase Layouts & Solvable Generator
// ---------------------------------------------------------------------------

export function getMazeConfig(difficulty: ResolvedDifficulty): MazeConfig {
  if (difficulty === 'simple') {
    return {
      rows: 9,
      cols: 11,
      grid: [
        [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
        [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1],
        [1, 0, 1, 1, 0, 1, 0, 1, 1, 0, 1],
        [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
        [1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1],
        [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
        [1, 0, 1, 1, 0, 1, 0, 1, 1, 0, 1],
        [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1],
        [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
      ],
      playerStart: { r: 4, c: 5 },
      chambers: [
        { r: 1, c: 1 },
        { r: 1, c: 9 },
        { r: 7, c: 1 },
        { r: 7, c: 9 },
      ],
      patrols: [
        {
          id: 'chaser_1',
          speedMs: 620,
          path: [
            { r: 3, c: 1 }, { r: 3, c: 2 }, { r: 3, c: 3 }, { r: 3, c: 4 },
            { r: 3, c: 3 }, { r: 3, c: 2 },
          ],
        },
      ],
    }
  }

  if (difficulty === 'medium') {
    return {
      rows: 9,
      cols: 11,
      grid: [
        [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
        [1, 0, 0, 0, 1, 0, 1, 0, 0, 0, 1],
        [1, 0, 1, 0, 0, 0, 0, 0, 1, 0, 1],
        [1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1],
        [1, 0, 0, 0, 1, 0, 1, 0, 0, 0, 1],
        [1, 0, 1, 0, 0, 0, 0, 0, 1, 0, 1],
        [1, 0, 1, 1, 0, 1, 0, 1, 1, 0, 1],
        [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
        [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
      ],
      playerStart: { r: 4, c: 5 },
      chambers: [
        { r: 1, c: 1 },
        { r: 1, c: 5 },
        { r: 1, c: 9 },
        { r: 7, c: 1 },
        { r: 7, c: 9 },
      ],
      patrols: [
        {
          id: 'chaser_1',
          speedMs: 500,
          path: [
            { r: 2, c: 3 }, { r: 2, c: 4 }, { r: 2, c: 5 }, { r: 2, c: 6 }, { r: 2, c: 7 },
            { r: 2, c: 6 }, { r: 2, c: 5 }, { r: 2, c: 4 },
          ],
        },
        {
          id: 'chaser_2',
          speedMs: 540,
          path: [
            { r: 7, c: 3 }, { r: 7, c: 4 }, { r: 7, c: 5 }, { r: 7, c: 6 }, { r: 7, c: 7 },
            { r: 7, c: 6 }, { r: 7, c: 5 }, { r: 7, c: 4 },
          ],
        },
      ],
    }
  }

  // Hard: 13x9 cosmic labyrinth with 6 chambers & 3 chasers
  return {
    rows: 9,
    cols: 13,
    grid: [
      [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
      [1, 0, 0, 0, 0, 1, 0, 1, 0, 0, 0, 0, 1],
      [1, 0, 1, 1, 0, 0, 0, 0, 0, 1, 1, 0, 1],
      [1, 0, 0, 0, 0, 1, 0, 1, 0, 0, 0, 0, 1],
      [1, 1, 1, 0, 1, 1, 0, 1, 1, 0, 1, 1, 1],
      [1, 0, 0, 0, 0, 1, 0, 1, 0, 0, 0, 0, 1],
      [1, 0, 1, 1, 0, 0, 0, 0, 0, 1, 1, 0, 1],
      [1, 0, 0, 0, 0, 1, 0, 1, 0, 0, 0, 0, 1],
      [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
    ],
    playerStart: { r: 4, c: 6 },
    chambers: [
      { r: 1, c: 1 },
      { r: 1, c: 6 },
      { r: 1, c: 11 },
      { r: 7, c: 1 },
      { r: 7, c: 6 },
      { r: 7, c: 11 },
    ],
    patrols: [
      {
        id: 'chaser_1',
        speedMs: 420,
        path: [
          { r: 2, c: 4 }, { r: 2, c: 5 }, { r: 2, c: 6 }, { r: 2, c: 7 }, { r: 2, c: 8 },
          { r: 2, c: 7 }, { r: 2, c: 6 }, { r: 2, c: 5 },
        ],
      },
      {
        id: 'chaser_2',
        speedMs: 450,
        path: [
          { r: 6, c: 4 }, { r: 6, c: 5 }, { r: 6, c: 6 }, { r: 6, c: 7 }, { r: 6, c: 8 },
          { r: 6, c: 7 }, { r: 6, c: 6 }, { r: 6, c: 5 },
        ],
      },
      {
        id: 'chaser_3',
        speedMs: 480,
        path: [
          { r: 3, c: 1 }, { r: 3, c: 2 }, { r: 3, c: 3 }, { r: 4, c: 3 }, { r: 5, c: 3 },
          { r: 4, c: 3 }, { r: 3, c: 3 }, { r: 3, c: 2 },
        ],
      },
    ],
  }
}

export function generateMazeRoundChambers(
  letterId: string,
  roundIndex: number,
  config: MazeConfig,
  difficulty: ResolvedDifficulty,
  letterMode: ArcadeLetterMode = 'mixed'
): { targetChar: string; targetLabel: string; chambers: MazeChamber[] } {
  const target = getLetterById(letterId) || ARABIC_LETTERS[0]
  const variants = getLetterVariants(target.id)
  const confusableIds = getConfusableDistractors(target.id, 5)
  const confusableLetters = confusableIds
    .map(id => getLetterById(id))
    .filter((l): l is LetterData => Boolean(l))
  const otherLetters = ARABIC_LETTERS.filter(
    l => l.id !== target.id && !confusableIds.includes(l.id)
  )

  const useVariantTarget =
    letterMode === 'letter-types' || (letterMode === 'mixed' && roundIndex >= 2)

  const chosenVariant =
    useVariantTarget
      ? variants[(roundIndex + 1) % Math.min(variants.length, difficulty === 'hard' ? variants.length : 7)]
      : variants[0]

  const targetChar = chosenVariant.char
  const targetLabel = useVariantTarget ? chosenVariant.name : `${target.name_english} (${target.letter})`

  // Build distractor list
  const distractorEntries: Array<{ char: string; label: string }> = []
  const seen = new Set<string>([targetChar])

  if (letterMode === 'letter-types') {
    for (const v of shuffleArray(variants)) {
      if (!seen.has(v.char)) {
        seen.add(v.char)
        distractorEntries.push({ char: v.char, label: v.name })
      }
    }
  }

  for (const c of shuffleArray(confusableLetters)) {
    if (!seen.has(c.letter)) {
      seen.add(c.letter)
      distractorEntries.push({ char: c.letter, label: c.name_english })
    }
  }

  for (const o of shuffleArray(otherLetters)) {
    if (!seen.has(o.letter)) {
      seen.add(o.letter)
      distractorEntries.push({ char: o.letter, label: o.name_english })
    }
  }

  const shuffledCoords = shuffleArray([...config.chambers])
  const chambers: MazeChamber[] = shuffledCoords.map((coord, idx) => {
    if (idx === 0) {
      return {
        id: `chamber_${roundIndex}_target`,
        coord,
        char: targetChar,
        label: targetLabel,
        isTarget: true,
      }
    }
    const dist = distractorEntries[idx - 1] || { char: '؟', label: 'Other' }
    return {
      id: `chamber_${roundIndex}_dist_${idx}`,
      coord,
      char: dist.char,
      label: dist.label,
      isTarget: false,
    }
  })

  return { targetChar, targetLabel, chambers }
}

/** BFS shortest-path helper used for Teacher Hint compass & maze solvability verification */
export function findMazeNextStep(
  grid: number[][],
  from: MazeCoord,
  to: MazeCoord
): { next: MazeCoord | null; path: MazeCoord[] } {
  const rows = grid.length
  const cols = grid[0]?.length || 0
  const key = (r: number, c: number) => `${r},${c}`
  const visited = new Set<string>([key(from.r, from.c)])
  const queue: Array<{ coord: MazeCoord; path: MazeCoord[] }> = [
    { coord: from, path: [from] },
  ]
  const dirs = [
    { dr: -1, dc: 0 },
    { dr: 1, dc: 0 },
    { dr: 0, dc: -1 },
    { dr: 0, dc: 1 },
  ]

  while (queue.length > 0) {
    const cur = queue.shift()!
    if (cur.coord.r === to.r && cur.coord.c === to.c) {
      return { next: cur.path[1] || null, path: cur.path }
    }
    for (const d of dirs) {
      const nr = cur.coord.r + d.dr
      const nc = cur.coord.c + d.dc
      if (nr >= 0 && nr < rows && nc >= 0 && nc < cols && grid[nr][nc] === 0) {
        const k = key(nr, nc)
        if (!visited.has(k)) {
          visited.add(k)
          queue.push({ coord: { r: nr, c: nc }, path: [...cur.path, { r: nr, c: nc }] })
        }
      }
    }
  }
  return { next: null, path: [] }
}

// ---------------------------------------------------------------------------
// Levels 3–10 Data Helpers (All Arabic Letters!)
// ---------------------------------------------------------------------------

export interface QuizQuestion {
  id: string
  prompt: string
  arabicDisplay?: string
  options: Array<{ id: string; char: string; label: string; isCorrect: boolean }>
  explanation: string
}

export function generateLevel7QuizQuestions(
  letterId: string,
  difficulty: ResolvedDifficulty,
  count: number = 8
): QuizQuestion[] {
  const target = getLetterById(letterId) || ARABIC_LETTERS[0]
  const variants = getLetterVariants(target.id)
  const pedagogy = LETTER_PEDAGOGY[target.id]
  const confusables = getConfusableDistractors(target.id, 4)
    .map(id => getLetterById(id))
    .filter((l): l is LetterData => Boolean(l))
  const others = pickRandom(
    ARABIC_LETTERS.filter(l => l.id !== target.id && !confusables.some(c => c.id === l.id)),
    4
  )
  const distractorLetters = [...confusables, ...others].slice(0, 3)

  const examples = LETTER_EXAMPLES.filter(e => e.letter_id === target.id)
  const begExample = examples.find(e => e.letter_position === 'beginning') || examples[0]
  const midExample = examples.find(e => e.letter_position === 'middle') || examples[1]
  const endExample = examples.find(e => e.letter_position === 'end') || examples[2]

  const qPool: QuizQuestion[] = [
    {
      id: 'q_recognize',
      prompt: `Which Arabic letter is "${target.name_english}"?`,
      options: shuffleArray([
        { id: 'c', char: target.letter, label: target.name_english, isCorrect: true },
        ...distractorLetters.map(d => ({ id: d.id, char: d.letter, label: d.name_english, isCorrect: false })),
      ]),
      explanation: `${target.letter} is ${target.name_english} (${target.name_arabic})!`,
    },
    {
      id: 'q_initial',
      prompt: `Which is the INITIAL (beginning) connected form of ${target.name_english}?`,
      arabicDisplay: target.letter,
      options: shuffleArray([
        { id: 'init', char: target.forms.initial, label: 'Initial', isCorrect: true },
        { id: 'med', char: target.forms.medial === target.forms.initial ? `${target.letter}\u0650` : target.forms.medial, label: target.forms.medial === target.forms.initial ? 'Kasrah' : 'Medial', isCorrect: false },
        { id: 'other1', char: distractorLetters[0]?.forms.initial || 'بـ', label: distractorLetters[0]?.name_english || 'Other', isCorrect: false },
        { id: 'other2', char: distractorLetters[1]?.forms.initial || 'تـ', label: distractorLetters[1]?.name_english || 'Other', isCorrect: false },
      ]),
      explanation: `${target.name_english} at the beginning of a word looks like ${target.forms.initial}.`,
    },
    {
      id: 'q_fatha',
      prompt: `Spot ${target.name_english} with FATHAH (short "a" mark on top)!`,
      options: shuffleArray([
        { id: 'fath', char: variants.find(v => v.type === 'fatha')?.char || `${target.letter}\u064E`, label: 'Fathah', isCorrect: true },
        { id: 'kasr', char: variants.find(v => v.type === 'kasra')?.char || `${target.letter}\u0650`, label: 'Kasrah', isCorrect: false },
        { id: 'damm', char: variants.find(v => v.type === 'damma')?.char || `${target.letter}\u064F`, label: 'Dammah', isCorrect: false },
        { id: 'suk', char: variants.find(v => v.type === 'sukun')?.char || `${target.letter}\u0652`, label: 'Sukun', isCorrect: false },
      ]),
      explanation: `Fathah is the small dash on top, giving the "a" sound!`,
    },
    {
      id: 'q_kasra',
      prompt: `Spot ${target.name_english} with KASRAH (mark underneath)!`,
      options: shuffleArray([
        { id: 'kasr', char: variants.find(v => v.type === 'kasra')?.char || `${target.letter}\u0650`, label: 'Kasrah', isCorrect: true },
        { id: 'fath', char: variants.find(v => v.type === 'fatha')?.char || `${target.letter}\u064E`, label: 'Fathah', isCorrect: false },
        { id: 'damm', char: variants.find(v => v.type === 'damma')?.char || `${target.letter}\u064F`, label: 'Dammah', isCorrect: false },
        { id: 'tanw', char: variants.find(v => v.type === 'tanween')?.char || `${target.letter}\u064B`, label: 'Tanween', isCorrect: false },
      ]),
      explanation: `Kasrah sits below the letter for an "i" sound!`,
    },
    {
      id: 'q_dots',
      prompt: `How many dots (I'jam) does ${target.name_english} (${target.letter}) have?`,
      arabicDisplay: target.letter,
      options: shuffleArray([
        { id: 'dots_correct', char: `${pedagogy?.dotsCount ?? 0}`, label: pedagogy?.dotsCount ? `${pedagogy.dotsCount} ${pedagogy.dotPosition}` : 'No dots', isCorrect: true },
        ...([0, 1, 2, 3].filter(n => n !== (pedagogy?.dotsCount ?? 0)).slice(0, 3)).map(n => ({
          id: `dots_${n}`,
          char: `${n}`,
          label: n === 0 ? 'No dots' : `${n} dot${n > 1 ? 's' : ''}`,
          isCorrect: false,
        })),
      ]),
      explanation: pedagogy?.dotsCount
        ? `${target.letter} has ${pedagogy.dotsCount} dot(s) ${pedagogy.dotPosition}.`
        : `${target.letter} has no dots!`,
    },
    {
      id: 'q_word_beg',
      prompt: `Which Arabic word begins with ${target.name_english} (${target.letter})?`,
      options: shuffleArray([
        { id: 'wb', char: begExample.arabic_word, label: `${begExample.english_meaning} ${begExample.emoji}`, isCorrect: true },
        ...distractorLetters.slice(0, 3).map((d, idx) => {
          const ex = LETTER_EXAMPLES.find(e => e.letter_id === d.id && e.letter_position === 'beginning')
            || LETTER_EXAMPLES.find(e => e.letter_id === d.id)!
          return {
            id: `wd_${idx}`,
            char: ex.arabic_word,
            label: `${ex.english_meaning} ${ex.emoji}`,
            isCorrect: false,
          }
        }),
      ]),
      explanation: `${begExample.arabic_word} (${begExample.transliteration}) means "${begExample.english_meaning}"!`,
    },
    {
      id: 'q_final',
      prompt: `Which is the FINAL (end of word) form of ${target.name_english}?`,
      arabicDisplay: target.letter,
      options: shuffleArray([
        { id: 'fin', char: target.forms.final, label: 'Final Form', isCorrect: true },
        { id: 'd1', char: distractorLetters[0]?.forms.final || 'ـت', label: distractorLetters[0]?.name_english || 'Other', isCorrect: false },
        { id: 'd2', char: distractorLetters[1]?.forms.final || 'ـث', label: distractorLetters[1]?.name_english || 'Other', isCorrect: false },
        { id: 'd3', char: distractorLetters[2]?.forms.final || 'ـن', label: distractorLetters[2]?.name_english || 'Other', isCorrect: false },
      ]),
      explanation: `At the end of a connected word, ${target.name_english} becomes ${target.forms.final}.`,
    },
    {
      id: 'q_damma',
      prompt: `Spot ${target.name_english} with DAMMAH (little loop "u" on top)!`,
      options: shuffleArray([
        { id: 'damm', char: variants.find(v => v.type === 'damma')?.char || `${target.letter}\u064F`, label: 'Dammah', isCorrect: true },
        { id: 'fath', char: variants.find(v => v.type === 'fatha')?.char || `${target.letter}\u064E`, label: 'Fathah', isCorrect: false },
        { id: 'kasr', char: variants.find(v => v.type === 'kasra')?.char || `${target.letter}\u0650`, label: 'Kasrah', isCorrect: false },
        { id: 'suk', char: variants.find(v => v.type === 'sukun')?.char || `${target.letter}\u0652`, label: 'Sukun', isCorrect: false },
      ]),
      explanation: `Dammah is the small loop above the letter making a "u" sound!`,
    },
  ]

  // For Simple, trim options to 3 on first 2 questions if helpful; keep 4 consistent for Gameshow
  const ordered = difficulty === 'simple' ? qPool : shuffleArray(qPool)
  return ordered.slice(0, count)
}

export interface WordFormChallenge {
  id: string
  example: LetterExample
  targetForm: string
  formLabel: string
  maskedWord: string
  options: Array<{ id: string; char: string; label: string; isCorrect: boolean }>
}

export function generateWordHunterRounds(
  letterId: string,
  count: number = 8
): WordFormChallenge[] {
  const target = getLetterById(letterId) || ARABIC_LETTERS[0]
  const examples = LETTER_EXAMPLES.filter(e => e.letter_id === target.id)
  const begList = examples.filter(e => e.letter_position === 'beginning')
  const midList = examples.filter(e => e.letter_position === 'middle')
  const endList = examples.filter(e => e.letter_position === 'end')

  const picked: LetterExample[] = []
  for (let i = 0; i < count; i++) {
    const pool = i % 3 === 0 ? begList : i % 3 === 1 ? midList : endList
    const candidate = pool[Math.floor(i / 3) % Math.max(1, pool.length)] || examples[i % examples.length]
    if (candidate) picked.push(candidate)
  }

  const confusableIds = getConfusableDistractors(target.id, 3)
  const confusables = confusableIds.map(id => getLetterById(id)!).filter(Boolean)
  const fallback = ARABIC_LETTERS.filter(l => l.id !== target.id)

  return picked.map((ex, idx) => {
    const pos = ex.letter_position
    const targetForm =
      pos === 'beginning'
        ? target.forms.initial
        : pos === 'middle'
        ? target.forms.medial
        : target.forms.final

    const formLabel =
      pos === 'beginning' ? 'Initial (Beginning)' : pos === 'middle' ? 'Medial (Middle)' : 'Final (End)'

    // Mask the target base character in word visually for recognition
    const baseRegex = new RegExp(target.letter)
    const maskedWord = baseRegex.test(ex.arabic_word)
      ? ex.arabic_word.replace(target.letter, ' ⬜ ')
      : `⬜ ${ex.arabic_word}`

    const peers = confusables.length >= 2 ? confusables : pickRandom(fallback, 3)
    const distForms = peers.slice(0, 3).map((p, di) => {
      const formChar =
        pos === 'beginning'
          ? p.forms.initial
          : pos === 'middle'
          ? p.forms.medial
          : p.forms.final
      return {
        id: `d_${idx}_${di}_${p.id}`,
        char: formChar,
        label: `${p.name_english} (${pos})`,
        isCorrect: false,
      }
    })

    return {
      id: `wh_${idx}_${ex.id}`,
      example: ex,
      targetForm,
      formLabel,
      maskedWord,
      options: shuffleArray([
        { id: `c_${idx}`, char: targetForm, label: `${target.name_english} (${formLabel})`, isCorrect: true },
        ...distForms,
      ]),
    }
  })
}
