import { describe, it, expect } from 'vitest'
import { ARABIC_LETTERS } from '../data/arabicLetters'
import { LETTER_EXAMPLES, TOTAL_EXAMPLES_COUNT } from '../data/letterExamples'
import { calculateAccuracy, getStarsFromAccuracy, formatDuration } from '../lib/utils'
import { ALL_GAMES } from '../pages/GamesLibraryPage'

describe('Arabic Alphabet Learning System', () => {
  it('contains all 28 Arabic letters in correct order', () => {
    expect(ARABIC_LETTERS).toHaveLength(28)
    const expectedOrder = [
      'ا', 'ب', 'ت', 'ث', 'ج', 'ح', 'خ', 'د', 'ذ', 'ر', 'ز', 'س', 'ش',
      'ص', 'ض', 'ط', 'ظ', 'ع', 'غ', 'ف', 'ق', 'ك', 'ل', 'م', 'ن', 'ه', 'و', 'ي'
    ]
    const actualOrder = ARABIC_LETTERS.map(l => l.letter)
    expect(actualOrder).toEqual(expectedOrder)
  })

  it('accurately specifies non-connecting letters', () => {
    // Letters that do NOT connect following: alef, dal, dhal, ra, zayn, waw
    const nonConnectingIds = ['alef', 'dal', 'dhal', 'ra', 'zayn', 'waw']
    ARABIC_LETTERS.forEach(l => {
      if (nonConnectingIds.includes(l.id)) {
        expect(l.connects_following).toBe(false)
        expect(l.forms.isolated).toBe(l.forms.initial)
      } else {
        expect(l.connects_following).toBe(true)
      }
    })
  })

  it('has four valid written forms defined for every letter', () => {
    ARABIC_LETTERS.forEach(l => {
      expect(l.forms.isolated).toBeTruthy()
      expect(l.forms.initial).toBeTruthy()
      expect(l.forms.medial).toBeTruthy()
      expect(l.forms.final).toBeTruthy()
    })
  })
})

describe('Letter Examples Dataset (840 Records)', () => {
  it('has exactly 840 educational examples (30 per letter)', () => {
    expect(TOTAL_EXAMPLES_COUNT).toBe(840)
    expect(LETTER_EXAMPLES).toHaveLength(840)

    ARABIC_LETTERS.forEach(letter => {
      const examples = LETTER_EXAMPLES.filter(e => e.letter_id === letter.id)
      expect(examples).toHaveLength(30)
    })
  })

  it('contains required attributes for young learners', () => {
    LETTER_EXAMPLES.forEach(ex => {
      expect(ex.id).toBeTruthy()
      expect(ex.arabic_word).toBeTruthy()
      expect(ex.transliteration).toBeTruthy()
      expect(ex.english_meaning).toBeTruthy()
      expect(ex.emoji).toBeTruthy()
      expect(['beginning', 'middle', 'end']).toContain(ex.letter_position)
      expect(ex.verified).toBe(true)
    })
  })
})

describe('Educational Game Engine & Scoring', () => {
  it('contains all 24 distinct educational games', () => {
    expect(ALL_GAMES).toHaveLength(24)
    const slugs = ALL_GAMES.map(g => g.slug)
    const uniqueSlugs = new Set(slugs)
    expect(uniqueSlugs.size).toBe(24)
  })

  it('calculates accuracy percentage accurately', () => {
    expect(calculateAccuracy(10, 10)).toBe(100)
    expect(calculateAccuracy(5, 10)).toBe(50)
    expect(calculateAccuracy(0, 10)).toBe(0)
    expect(calculateAccuracy(0, 0)).toBe(0)
    expect(calculateAccuracy(7, 8)).toBe(88)
  })

  it('awards star ratings according to performance standards', () => {
    expect(getStarsFromAccuracy(95)).toBe(3)
    expect(getStarsFromAccuracy(90)).toBe(3)
    expect(getStarsFromAccuracy(75)).toBe(2)
    expect(getStarsFromAccuracy(45)).toBe(1)
    expect(getStarsFromAccuracy(20)).toBe(0)
  })

  it('formats time duration consistently', () => {
    expect(formatDuration(65)).toBe('1:05')
    expect(formatDuration(0)).toBe('0:00')
    expect(formatDuration(120)).toBe('2:00')
  })
})
