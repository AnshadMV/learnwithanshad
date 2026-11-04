import { ARABIC_LETTERS, LetterData, getLetterById } from './arabicLetters'
import { getConfusableDistractors } from './letterPedagogy'
import { pickRandom, shuffleArray } from '@/lib/utils'

export interface LetterVariant {
  id: string
  char: string
  name: string
  arabicName: string
  type: 'isolated' | 'initial' | 'medial' | 'final' | 'fatha' | 'damma' | 'kasra' | 'sukun' | 'madda' | 'tanween' | 'special'
  soundHint: string
}

// Special curated variants for key letters
const SPECIAL_VARIANTS: Record<string, LetterVariant[]> = {
  alef: [
    { id: 'alef_isolated', char: 'ا', name: 'Isolated Alef', arabicName: 'أَلِف مُنْفَصِل', type: 'isolated', soundHint: 'ā' },
    { id: 'alef_fatha', char: 'أَ', name: 'Alef with Fathah', arabicName: 'أَلِف مَفْتُوحَة (أَ)', type: 'fatha', soundHint: 'a' },
    { id: 'alef_kasra', char: 'إِ', name: 'Alef with Kasrah', arabicName: 'أَلِف مَكْسُورَة (إِ)', type: 'kasra', soundHint: 'i' },
    { id: 'alef_damma', char: 'أُ', name: 'Alef with Dammah', arabicName: 'أَلِف مَضْمُومَة (أُ)', type: 'damma', soundHint: 'u' },
    { id: 'alef_madda', char: 'آ', name: 'Alef with Maddah', arabicName: 'أَلِف مَمْدُودَة (آ)', type: 'madda', soundHint: 'ā (long)' },
    { id: 'alef_sukun', char: 'أْ', name: 'Alef with Sukun', arabicName: 'أَلِف سَاكِنَة (أْ)', type: 'sukun', soundHint: 'stop' },
    { id: 'alef_medial', char: 'ـا', name: 'Connected Alef', arabicName: 'أَلِف مُتَّصِل (ـا)', type: 'medial', soundHint: 'ā' },
    { id: 'alef_hamza', char: 'أ', name: 'Alef with Hamza', arabicName: 'أَلِف مَهْمُوزَة (أ)', type: 'special', soundHint: 'a' },
    { id: 'alef_tanween_fath', char: 'أً', name: 'Alef Tanween Fath', arabicName: 'أَلِف تَنْوِين فَتْح (أً)', type: 'tanween', soundHint: 'an' },
    { id: 'alef_tanween_damm', char: 'أٌ', name: 'Alef Tanween Damm', arabicName: 'أَلِف تَنْوِين ضَمّ (أٌ)', type: 'tanween', soundHint: 'un' },
    { id: 'alef_hamza_below', char: 'إ', name: 'Alef Hamza Below', arabicName: 'هَمْزَة تَحْتَ الأَلِف (إ)', type: 'special', soundHint: 'i' },
    { id: 'alef_wasla', char: 'ٱ', name: 'Alef Waslah', arabicName: 'هَمْزَة وَصْل (ٱ)', type: 'special', soundHint: 'a' },
  ],
  ta: [
    { id: 'ta_isolated', char: 'ت', name: 'Ta Isolated', arabicName: 'تَاء مُنْفَصِلَة', type: 'isolated', soundHint: 't' },
    { id: 'ta_initial', char: 'تـ', name: 'Ta Initial', arabicName: 'تَاء أَوَّل الكَلِمَة (تـ)', type: 'initial', soundHint: 't' },
    { id: 'ta_medial', char: 'ـتـ', name: 'Ta Medial', arabicName: 'تَاء وَسَط الكَلِمَة (ـتـ)', type: 'medial', soundHint: 't' },
    { id: 'ta_final', char: 'ـت', name: 'Ta Final', arabicName: 'تَاء آخِر الكَلِمَة (ـت)', type: 'final', soundHint: 't' },
    { id: 'ta_fatha', char: 'تَ', name: 'Ta with Fathah', arabicName: 'تَاء مَفْتُوحَة (تَ)', type: 'fatha', soundHint: 'ta' },
    { id: 'ta_kasra', char: 'تِ', name: 'Ta with Kasrah', arabicName: 'تَاء مَكْسُورَة (تِ)', type: 'kasra', soundHint: 'ti' },
    { id: 'ta_damma', char: 'تُ', name: 'Ta with Dammah', arabicName: 'تَاء مَضْمُومَة (تُ)', type: 'damma', soundHint: 'tu' },
    { id: 'ta_sukun', char: 'تْ', name: 'Ta with Sukun', arabicName: 'تَاء سَاكِنَة (تْ)', type: 'sukun', soundHint: 't' },
    { id: 'ta_marbuta_iso', char: 'ة', name: 'Ta Marbutah', arabicName: 'تَاء مَرْبُوطَة (ة)', type: 'special', soundHint: 'ah / t' },
    { id: 'ta_marbuta_conn', char: 'ـة', name: 'Connected Ta Marbutah', arabicName: 'تَاء مَرْبُوطَة مُتَّصِلَة (ـة)', type: 'special', soundHint: 'ah / t' },
    { id: 'ta_tanween', char: 'تً', name: 'Ta Tanween', arabicName: 'تَاء تَنْوِين (تً)', type: 'tanween', soundHint: 'tan' },
  ],
}

/**
 * Returns letter-specific variants (forms, harakat, vowels, and special signs) for ANY Arabic letter.
 */
export function getLetterVariants(letterId: string): LetterVariant[] {
  // Check if special curated list exists
  if (SPECIAL_VARIANTS[letterId]) {
    return SPECIAL_VARIANTS[letterId]
  }

  const letter = getLetterById(letterId) || ARABIC_LETTERS[0]
  const base = letter.letter
  const name = letter.name_english

  const variants: LetterVariant[] = [
    { id: `${letterId}_isolated`, char: letter.forms.isolated, name: `${name} Isolated`, arabicName: `${letter.name_arabic} مُنْفَصِل`, type: 'isolated', soundHint: letter.sound_description },
    { id: `${letterId}_initial`, char: letter.forms.initial, name: `${name} Initial`, arabicName: `${letter.name_arabic} فِي البِدَايَة`, type: 'initial', soundHint: letter.sound_description },
    { id: `${letterId}_medial`, char: letter.forms.medial, name: `${name} Medial`, arabicName: `${letter.name_arabic} فِي الوَسَط`, type: 'medial', soundHint: letter.sound_description },
    { id: `${letterId}_final`, char: letter.forms.final, name: `${name} Final`, arabicName: `${letter.name_arabic} فِي النِّهَايَة`, type: 'final', soundHint: letter.sound_description },
    { id: `${letterId}_fatha`, char: `${base}\u064E`, name: `${name} with Fathah`, arabicName: `${letter.name_arabic} مَفْتُوح (${base}\u064E)`, type: 'fatha', soundHint: `${letter.transliteration}a` },
    { id: `${letterId}_kasra`, char: `${base}\u0650`, name: `${name} with Kasrah`, arabicName: `${letter.name_arabic} مَكْسُور (${base}\u0650)`, type: 'kasra', soundHint: `${letter.transliteration}i` },
    { id: `${letterId}_damma`, char: `${base}\u064F`, name: `${name} with Dammah`, arabicName: `${letter.name_arabic} مَضْمُوم (${base}\u064F)`, type: 'damma', soundHint: `${letter.transliteration}u` },
    { id: `${letterId}_sukun`, char: `${base}\u0652`, name: `${name} with Sukun`, arabicName: `${letter.name_arabic} سَاكِن (${base}\u0652)`, type: 'sukun', soundHint: `${letter.transliteration}` },
    { id: `${letterId}_tanween_fath`, char: `${base}\u064B`, name: `${name} Tanween Fath`, arabicName: `${letter.name_arabic} تَنْوِين فَتْح (${base}\u064B)`, type: 'tanween', soundHint: `${letter.transliteration}an` },
    { id: `${letterId}_tanween_damm`, char: `${base}\u064C`, name: `${name} Tanween Damm`, arabicName: `${letter.name_arabic} تَنْوِين ضَمّ (${base}\u064C)`, type: 'tanween', soundHint: `${letter.transliteration}un` },
    { id: `${letterId}_tanween_kasr`, char: `${base}\u064D`, name: `${name} Tanween Kasr`, arabicName: `${letter.name_arabic} تَنْوِين كَسْر (${base}\u064D)`, type: 'tanween', soundHint: `${letter.transliteration}in` },
    { id: `${letterId}_shaddah`, char: `${base}\u0651\u064E`, name: `${name} with Shaddah`, arabicName: `${letter.name_arabic} مَعَ الشَّدَّة (${base}\u0651\u064E)`, type: 'special', soundHint: `doubled ${letter.transliteration}` },
  ]

  return variants
}

export interface OddLetterRound {
  title: string
  subtitle: string
  targetLetter: LetterData
  cards: { id: string; letter: string; name?: string; isOdd: boolean; explanation?: string }[]
}

/**
 * Generates letter-specific rounds for "Find the Different Letter" game (Spot the Odd Letter Out!).
 * Incorporates letter variants (e.g. alif with fath, other forms/types) and other letters.
 */
export function getLetterOddRounds(letterId: string, count: number = 8): OddLetterRound[] {
  const target = getLetterById(letterId) || ARABIC_LETTERS[0]
  const variants = getLetterVariants(letterId)
  const confusableIds = getConfusableDistractors(letterId, 5)
  const confusableLetters = confusableIds.map(id => getLetterById(id)!).filter(Boolean)
  const otherLetters = ARABIC_LETTERS.filter(l => l.id !== letterId && !confusableIds.includes(l.id))

  const rounds: OddLetterRound[] = []

  for (let r = 0; r < count; r++) {
    const roundType = r % 4

    if (roundType === 0) {
      // 4 cards are different variants/harakat of the target letter, and 1 card is an outsider letter
      const fourVariants = pickRandom(variants, 4)
      const foreignLetter = pickRandom(confusableLetters.length > 0 ? confusableLetters : otherLetters, 1)[0]
      const foreignChar = foreignLetter.letter

      const cards = shuffleArray([
        ...fourVariants.map((v, i) => ({
          id: `var_${i}`,
          letter: v.char,
          name: v.name,
          isOdd: false,
          explanation: `This is a form/sound of ${target.name_english}!`,
        })),
        {
          id: 'odd_foreign',
          letter: foreignChar,
          name: foreignLetter.name_english,
          isOdd: true,
          explanation: `Correct! ${foreignChar} (${foreignLetter.name_english}) is NOT an ${target.name_english}!`,
        },
      ])

      rounds.push({
        title: `Spot the Odd Letter Out! 🕵️`,
        subtitle: `Which letter does NOT belong to the ${target.name_english} (${target.name_arabic}) family?`,
        targetLetter: target,
        cards,
      })
    } else if (roundType === 1) {
      // 4 cards are an outside letter, and 1 card is the target letter (or variant of it)
      const foreignLetter = pickRandom(otherLetters, 1)[0]
      const targetVariant = pickRandom(variants, 1)[0]

      const cards = shuffleArray([
        { id: 'f1', letter: foreignLetter.letter, name: foreignLetter.name_english, isOdd: false },
        { id: 'f2', letter: foreignLetter.letter, name: foreignLetter.name_english, isOdd: false },
        { id: 'f3', letter: foreignLetter.letter, name: foreignLetter.name_english, isOdd: false },
        { id: 'f4', letter: foreignLetter.letter, name: foreignLetter.name_english, isOdd: false },
        {
          id: 'odd_target',
          letter: targetVariant.char,
          name: targetVariant.name,
          isOdd: true,
          explanation: `Bingo! You found ${targetVariant.char} (${targetVariant.name})!`,
        },
      ])

      rounds.push({
        title: `Spot the Odd Letter Out! 🕵️`,
        subtitle: `Spot the ${target.name_english} (${targetVariant.char}) hiding among the other letters!`,
        targetLetter: target,
        cards,
      })
    } else if (roundType === 2) {
      // 4 cards are identical target letter with one harakah (e.g. Fatha), and 1 card has a different harakah or form!
      const mainVar = variants.find(v => v.type === 'fatha') || variants[0]
      const oddVar = variants.find(v => v.type === 'kasra' || v.type === 'damma' || v.type === 'madda') || variants[1]

      const cards = shuffleArray([
        { id: 'v1', letter: mainVar.char, name: mainVar.name, isOdd: false },
        { id: 'v2', letter: mainVar.char, name: mainVar.name, isOdd: false },
        { id: 'v3', letter: mainVar.char, name: mainVar.name, isOdd: false },
        { id: 'v4', letter: mainVar.char, name: mainVar.name, isOdd: false },
        {
          id: 'odd_var',
          letter: oddVar.char,
          name: oddVar.name,
          isOdd: true,
          explanation: `Great eye! ${oddVar.char} has a different mark (${oddVar.name})!`,
        },
      ])

      rounds.push({
        title: `Spot the Odd Letter Out! 🕵️`,
        subtitle: `Four have the same vowel mark! Find the ONE ${target.name_english} with a different mark:`,
        targetLetter: target,
        cards,
      })
    } else {
      // 4 cards are connected shapes of the target letter, and 1 card is a confusable lookalike
      const shapes = [
        target.forms.isolated,
        target.forms.initial,
        target.forms.medial,
        target.forms.final,
      ]
      // Ensure 4 items
      const fourShapes = [...new Set(shapes)]
      while (fourShapes.length < 4) {
        const extraVar = pickRandom(variants, 1)[0].char
        if (!fourShapes.includes(extraVar)) fourShapes.push(extraVar)
      }
      const lookalike = pickRandom(confusableLetters.length > 0 ? confusableLetters : otherLetters, 1)[0]

      const cards = shuffleArray([
        ...fourShapes.slice(0, 4).map((s, i) => ({
          id: `shape_${i}`,
          letter: s,
          name: `${target.name_english} Shape`,
          isOdd: false,
        })),
        {
          id: 'odd_lookalike',
          letter: lookalike.letter,
          name: lookalike.name_english,
          isOdd: true,
          explanation: `Aha! That's ${lookalike.letter} (${lookalike.name_english}), not ${target.name_english}!`,
        },
      ])

      rounds.push({
        title: `Spot the Odd Letter Out! 🕵️`,
        subtitle: `Which shape is an intruder and does NOT belong to ${target.name_english}?`,
        targetLetter: target,
        cards,
      })
    }
  }

  return rounds
}

/**
 * Returns 6 pairs (12 cards) of different types/forms/harakat of the specified letter.
 * NO other letters on the board for letter-specific memory game!
 */
export function getLetterMemoryPairs(letterId: string) {
  const target = getLetterById(letterId) || ARABIC_LETTERS[0]
  const variants = getLetterVariants(letterId)

  // Pick 6 distinct variants
  let chosen = variants.slice(0, 6)
  if (chosen.length < 6) {
    // Fill if needed
    const forms = [
      { id: `${letterId}_iso`, char: target.forms.isolated, name: 'Isolated Form', arabicName: 'مُنْفَصِل', type: 'isolated' as const, soundHint: target.transliteration },
      { id: `${letterId}_init`, char: target.forms.initial, name: 'Initial Form', arabicName: 'بِدَايَة', type: 'initial' as const, soundHint: target.transliteration },
      { id: `${letterId}_med`, char: target.forms.medial, name: 'Medial Form', arabicName: 'وَسَط', type: 'medial' as const, soundHint: target.transliteration },
      { id: `${letterId}_fin`, char: target.forms.final, name: 'Final Form', arabicName: 'نِهَايَة', type: 'final' as const, soundHint: target.transliteration },
      { id: `${letterId}_fath`, char: `${target.letter}\u064E`, name: 'With Fathah', arabicName: 'مَفْتُوح', type: 'fatha' as const, soundHint: `${target.transliteration}a` },
      { id: `${letterId}_kasr`, char: `${target.letter}\u0650`, name: 'With Kasrah', arabicName: 'مَكْسُور', type: 'kasra' as const, soundHint: `${target.transliteration}i` },
    ]
    chosen = forms
  }

  return chosen
}

/**
 * Returns 9 distinct letter variants of the specified letter for a 3x3 Bingo board.
 */
export function getLetterBingoCells(letterId: string) {
  const target = getLetterById(letterId) || ARABIC_LETTERS[0]
  const variants = getLetterVariants(letterId)

  let cells = variants.slice(0, 9)
  if (cells.length < 9) {
    const extraVariants = [
      { id: `${letterId}_iso`, char: target.forms.isolated, name: 'Isolated', arabicName: 'مُنْفَصِل', type: 'isolated' as const, soundHint: target.transliteration },
      { id: `${letterId}_init`, char: target.forms.initial, name: 'Initial', arabicName: 'بِدَايَة', type: 'initial' as const, soundHint: target.transliteration },
      { id: `${letterId}_med`, char: target.forms.medial, name: 'Medial', arabicName: 'وَسَط', type: 'medial' as const, soundHint: target.transliteration },
      { id: `${letterId}_fin`, char: target.forms.final, name: 'Final', arabicName: 'نِهَايَة', type: 'final' as const, soundHint: target.transliteration },
      { id: `${letterId}_fath`, char: `${target.letter}\u064E`, name: 'Fathah (a)', arabicName: 'فَتْحَة', type: 'fatha' as const, soundHint: 'a' },
      { id: `${letterId}_kasr`, char: `${target.letter}\u0650`, name: 'Kasrah (i)', arabicName: 'كَسْرَة', type: 'kasra' as const, soundHint: 'i' },
      { id: `${letterId}_damm`, char: `${target.letter}\u064F`, name: 'Dammah (u)', arabicName: 'ضَمَّة', type: 'damma' as const, soundHint: 'u' },
      { id: `${letterId}_suk`, char: `${target.letter}\u0652`, name: 'Sukun (stop)', arabicName: 'سُكُون', type: 'sukun' as const, soundHint: 'stop' },
      { id: `${letterId}_tanw`, char: `${target.letter}\u064B`, name: 'Tanween', arabicName: 'تَنْوِين', type: 'tanween' as const, soundHint: 'an' },
    ]
    cells = extraVariants.slice(0, 9)
  }

  return cells
}
