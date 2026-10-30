/**
 * Arabic Letter Pedagogy Data
 *
 * Contains:
 * - Orthographic confusable clusters (letters that look alike)
 * - Dot / I'jam metadata (dot count, position, rasm/naked body)
 * - Curated 3/4/5-letter pedagogical study groups
 */

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type DotPosition = 'none' | 'above' | 'below' | 'inside' | 'above-inside'

export interface LetterPedagogyConfig {
  /** Letter IDs that look visually similar (share the same base body / rasm) */
  confusableLookalikes: string[]
  /** Letter IDs that sound phonetically similar */
  confusableSounds: string[]
  /** Number of dots (I'jam) on the letter — 0 means no dots */
  dotsCount: number
  /** Where the dots sit relative to the rasm body */
  dotPosition: DotPosition
  /** The naked rasm body without dots (for Dot Placement game) */
  rasm: string
}

export interface LetterGroup {
  id: string
  name: string
  emoji: string
  description: string
  /** Letter IDs in this group */
  letterIds: string[]
  /** Pedagogical focus of this group */
  focus: string
  /** Suggested min age */
  minAge: number
}

// ---------------------------------------------------------------------------
// Per-letter pedagogy configs
// ---------------------------------------------------------------------------

export const LETTER_PEDAGOGY: Record<string, LetterPedagogyConfig> = {
  alef: {
    confusableLookalikes: ['lam', 'ya', 'waw'],
    confusableSounds: ['ha2', 'ain'],
    dotsCount: 0,
    dotPosition: 'none',
    rasm: 'ا',
  },
  ba: {
    confusableLookalikes: ['ta', 'tha', 'noon', 'ya'],
    confusableSounds: ['fa', 'ba'],
    dotsCount: 1,
    dotPosition: 'below',
    rasm: 'ٮ', // naked ba/ta/tha body
  },
  ta: {
    confusableLookalikes: ['ba', 'tha', 'noon', 'ya'],
    confusableSounds: ['ta_heavy', 'tha'],
    dotsCount: 2,
    dotPosition: 'above',
    rasm: 'ٮ',
  },
  tha: {
    confusableLookalikes: ['ba', 'ta', 'noon', 'ya'],
    confusableSounds: ['dha_heavy', 'dhal'],
    dotsCount: 3,
    dotPosition: 'above',
    rasm: 'ٮ',
  },
  jeem: {
    confusableLookalikes: ['ha', 'kha'],
    confusableSounds: ['ghain', 'kha'],
    dotsCount: 1,
    dotPosition: 'inside',
    rasm: 'ح', // ha/jeem/kha share body
  },
  ha: {
    confusableLookalikes: ['jeem', 'kha'],
    confusableSounds: ['kha', 'ha2'],
    dotsCount: 0,
    dotPosition: 'none',
    rasm: 'ح',
  },
  kha: {
    confusableLookalikes: ['jeem', 'ha'],
    confusableSounds: ['ghain', 'ha'],
    dotsCount: 1,
    dotPosition: 'above',
    rasm: 'ح',
  },
  dal: {
    confusableLookalikes: ['dhal'],
    confusableSounds: ['dhal', 'dad'],
    dotsCount: 0,
    dotPosition: 'none',
    rasm: 'د',
  },
  dhal: {
    confusableLookalikes: ['dal'],
    confusableSounds: ['dal', 'dha_heavy'],
    dotsCount: 1,
    dotPosition: 'above',
    rasm: 'د',
  },
  ra: {
    confusableLookalikes: ['zayn', 'waw'],
    confusableSounds: ['zayn', 'lam'],
    dotsCount: 0,
    dotPosition: 'none',
    rasm: 'ر',
  },
  zayn: {
    confusableLookalikes: ['ra', 'waw'],
    confusableSounds: ['ra', 'seen'],
    dotsCount: 1,
    dotPosition: 'above',
    rasm: 'ر',
  },
  seen: {
    confusableLookalikes: ['sheen', 'sad', 'dad'],
    confusableSounds: ['sheen', 'zayn', 'sad'],
    dotsCount: 0,
    dotPosition: 'none',
    rasm: 'س',
  },
  sheen: {
    confusableLookalikes: ['seen', 'sad', 'dad'],
    confusableSounds: ['seen', 'sad'],
    dotsCount: 3,
    dotPosition: 'above',
    rasm: 'س',
  },
  sad: {
    confusableLookalikes: ['dad', 'seen', 'sheen'],
    confusableSounds: ['dad', 'seen'],
    dotsCount: 0,
    dotPosition: 'none',
    rasm: 'ص',
  },
  dad: {
    confusableLookalikes: ['sad', 'seen', 'sheen'],
    confusableSounds: ['sad', 'dal'],
    dotsCount: 1,
    dotPosition: 'above',
    rasm: 'ص',
  },
  ta_heavy: {
    confusableLookalikes: ['dha_heavy'],
    confusableSounds: ['ta', 'dha_heavy'],
    dotsCount: 0,
    dotPosition: 'none',
    rasm: 'ط',
  },
  dha_heavy: {
    confusableLookalikes: ['ta_heavy'],
    confusableSounds: ['ta_heavy', 'dhal'],
    dotsCount: 1,
    dotPosition: 'above',
    rasm: 'ط',
  },
  ain: {
    confusableLookalikes: ['ghain'],
    confusableSounds: ['ghain', 'alef'],
    dotsCount: 0,
    dotPosition: 'none',
    rasm: 'ع',
  },
  ghain: {
    confusableLookalikes: ['ain'],
    confusableSounds: ['ain', 'kha'],
    dotsCount: 1,
    dotPosition: 'above',
    rasm: 'ع',
  },
  fa: {
    confusableLookalikes: ['qaf'],
    confusableSounds: ['ba', 'waw'],
    dotsCount: 1,
    dotPosition: 'above',
    rasm: 'ڡ', // fa/qaf share a cup body
  },
  qaf: {
    confusableLookalikes: ['fa'],
    confusableSounds: ['kaf', 'kha'],
    dotsCount: 2,
    dotPosition: 'above',
    rasm: 'ڡ',
  },
  kaf: {
    confusableLookalikes: ['lam', 'kha'],
    confusableSounds: ['qaf', 'ghain'],
    dotsCount: 0,
    dotPosition: 'none',
    rasm: 'ك',
  },
  lam: {
    confusableLookalikes: ['alef', 'kaf'],
    confusableSounds: ['ra', 'noon'],
    dotsCount: 0,
    dotPosition: 'none',
    rasm: 'ل',
  },
  meem: {
    confusableLookalikes: ['waw', 'ha2'],
    confusableSounds: ['noon', 'ba'],
    dotsCount: 0,
    dotPosition: 'none',
    rasm: 'م',
  },
  noon: {
    confusableLookalikes: ['ba', 'ta', 'tha', 'ya'],
    confusableSounds: ['meem', 'lam'],
    dotsCount: 1,
    dotPosition: 'above',
    rasm: 'ن',
  },
  ha2: {
    confusableLookalikes: ['meem', 'ain'],
    confusableSounds: ['ha', 'kha'],
    dotsCount: 0,
    dotPosition: 'none',
    rasm: 'ه',
  },
  waw: {
    confusableLookalikes: ['ra', 'meem'],
    confusableSounds: ['ba', 'fa'],
    dotsCount: 0,
    dotPosition: 'none',
    rasm: 'و',
  },
  ya: {
    confusableLookalikes: ['ba', 'ta', 'tha', 'noon'],
    confusableSounds: ['alef', 'waw'],
    dotsCount: 2,
    dotPosition: 'below',
    rasm: 'ٮ',
  },
}

// ---------------------------------------------------------------------------
// Curated pedagogical letter groups
// ---------------------------------------------------------------------------

export const LETTER_GROUPS: LetterGroup[] = [
  {
    id: 'basics',
    name: 'First Steps',
    emoji: '🌟',
    description: 'The very first three letters — the foundation of Arabic reading!',
    letterIds: ['alef', 'ba', 'ta'],
    focus: 'Alphabet order & basic shapes',
    minAge: 4,
  },
  {
    id: 'boat-sisters',
    name: 'Sister Dots',
    emoji: '⚫',
    description: 'Three letters that share the same body — tell them apart by counting their dots!',
    letterIds: ['ba', 'ta', 'tha'],
    focus: 'Dot discrimination (1 below / 2 above / 3 above)',
    minAge: 4,
  },
  {
    id: 'belly-letters',
    name: 'Belly Letters',
    emoji: '🪣',
    description: 'Three letters that share a curved belly shape — spot the difference!',
    letterIds: ['jeem', 'ha', 'kha'],
    focus: 'Dot inside vs none vs above',
    minAge: 5,
  },
  {
    id: 'non-connectors',
    name: 'Non-Connectors',
    emoji: '🔗',
    description: 'Five letters that never connect to the next letter in a word.',
    letterIds: ['dal', 'dhal', 'ra', 'zayn', 'waw'],
    focus: 'Connector rules & letter direction',
    minAge: 5,
  },
  {
    id: 'teeth-letters',
    name: 'Teeth Letters',
    emoji: '🦷',
    description: 'Four sibilant letters with "teeth" serrations — each sounds a little different!',
    letterIds: ['seen', 'sheen', 'sad', 'dad'],
    focus: 'Phonetic sibilant contrast & dot placement',
    minAge: 5,
  },
  {
    id: 'loop-letters',
    name: 'Loop Letters',
    emoji: '🔄',
    description: 'Letters with big loops — eye-pairs & throat sounds.',
    letterIds: ['ain', 'ghain', 'fa', 'qaf'],
    focus: 'Dot count & throat vs lip sounds',
    minAge: 6,
  },
  {
    id: 'cup-letters',
    name: 'Cup & Loop',
    emoji: '🏆',
    description: 'Four letters with cup or loop shapes — all connect both ways!',
    letterIds: ['fa', 'qaf', 'kaf', 'lam'],
    focus: 'Written forms & alphabet order',
    minAge: 6,
  },
  {
    id: 'heavy-vs-light',
    name: 'Heavy vs Light',
    emoji: '⚖️',
    description: 'Two pairs of similar-looking but different-sounding letters.',
    letterIds: ['ta_heavy', 'dha_heavy', 'ain', 'ghain'],
    focus: 'Emphatic vs non-emphatic consonant pairs',
    minAge: 6,
  },
  {
    id: 'wave-sibilants',
    name: 'Wave Sibilants',
    emoji: '🌊',
    description: 'The wavy "teeth" letters and their emphatic variants.',
    letterIds: ['seen', 'sheen', 'sad', 'dad', 'ta_heavy'],
    focus: 'Sun letters, sibilants, emphatics',
    minAge: 6,
  },
  {
    id: 'last-five',
    name: 'Final Five',
    emoji: '🎯',
    description: 'The last five letters of the Arabic alphabet.',
    letterIds: ['meem', 'noon', 'ha2', 'waw', 'ya'],
    focus: 'Long vowel letters (Madd: و ا ي) & letter endings',
    minAge: 5,
  },
]

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Get confusable distractor letter IDs for a given target letter.
 * Returns up to `count` letter IDs that are visually confusable with the target.
 */
export function getConfusableDistractors(letterId: string, count: number = 3): string[] {
  const config = LETTER_PEDAGOGY[letterId]
  if (!config) return []
  const pool = config.confusableLookalikes
  const shuffled = [...pool].sort(() => Math.random() - 0.5)
  return shuffled.slice(0, count)
}

/**
 * Get all letters that belong to the same rasm-family (share the same naked body).
 */
export function getRasmFamily(letterId: string): string[] {
  const config = LETTER_PEDAGOGY[letterId]
  if (!config) return [letterId]
  return [letterId, ...config.confusableLookalikes.filter(id => {
    const peer = LETTER_PEDAGOGY[id]
    return peer && peer.rasm === config.rasm
  })]
}

/**
 * Find the curated groups that contain a specific letter ID.
 */
export function getGroupsForLetter(letterId: string): LetterGroup[] {
  return LETTER_GROUPS.filter(g => g.letterIds.includes(letterId))
}
