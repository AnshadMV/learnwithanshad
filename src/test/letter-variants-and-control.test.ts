import { describe, it, expect } from 'vitest'
import {
  getLetterVariants,
  getLetterOddRounds,
  getLetterMemoryPairs,
  getLetterBingoCells,
} from '@/data/letterVariants'
import { ARABIC_LETTERS } from '@/data/arabicLetters'

describe('Letter Specific Variants & Game Generators', () => {
  it('generates rich letter-specific variants for Alef', () => {
    const variants = getLetterVariants('alef')
    expect(variants.length).toBeGreaterThanOrEqual(8)

    const chars = variants.map(v => v.char)
    expect(chars).toContain('ا')   // Isolated
    expect(chars).toContain('أَ')  // With Fatha
    expect(chars).toContain('إِ')  // With Kasra
    expect(chars).toContain('أُ')  // With Damma
    expect(chars).toContain('آ')   // With Madda
    expect(chars).toContain('أْ')  // With Sukun
  })

  it('generates letter variants for all 28 Arabic alphabet letters', () => {
    ARABIC_LETTERS.forEach(l => {
      const vars = getLetterVariants(l.id)
      expect(vars.length).toBeGreaterThanOrEqual(6)
      // Must contain fatha, kasra, and damma forms
      const types = vars.map(v => v.type)
      expect(types).toContain('fatha')
      expect(types).toContain('kasra')
      expect(types).toContain('damma')
    })
  })

  it('generates letter-specific rounds for Spot the Odd Letter Out game', () => {
    const rounds = getLetterOddRounds('alef', 8)
    expect(rounds.length).toBe(8)

    rounds.forEach(r => {
      expect(r.cards.length).toBe(5)
      // Exactly 1 card is the odd one
      const oddCards = r.cards.filter(c => c.isOdd)
      expect(oddCards.length).toBe(1)

      // The 4 non-odd cards share the same category/group
      const normalCards = r.cards.filter(c => !c.isOdd)
      expect(normalCards.length).toBe(4)
    })
  })

  it('ensures letter-specific memory cards contain ONLY the target letter types and no foreign letters', () => {
    const alefPairs = getLetterMemoryPairs('alef')
    expect(alefPairs.length).toBe(6)

    // Verify all 6 pairs are variants of Alef
    alefPairs.forEach(pair => {
      expect(pair.id.startsWith('alef_')).toBe(true)
      expect(pair.name).toBeTruthy()
      expect(pair.char).toBeTruthy()
    })

    const baPairs = getLetterMemoryPairs('ba')
    expect(baPairs.length).toBe(6)
    baPairs.forEach(pair => {
      expect(pair.id.startsWith('ba_')).toBe(true)
    })
  })

  it('generates 9 letter-specific bingo cells for 3x3 board', () => {
    const cells = getLetterBingoCells('alef')
    expect(cells.length).toBe(9)

    const uniqueChars = new Set(cells.map(c => c.char))
    expect(uniqueChars.size).toBe(9)
  })
})
