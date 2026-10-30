import { describe, it, expect } from 'vitest'
import { ARABIC_LETTERS } from '@/data/arabicLetters'
import {
  LETTER_PEDAGOGY,
  LETTER_GROUPS,
  getConfusableDistractors,
  getGroupsForLetter,
} from '@/data/letterPedagogy'
import { ALL_GAMES } from '@/pages/GamesLibraryPage'

describe('Letter Pedagogy & Confusables', () => {
  it('has pedagogy entries for all 28 Arabic letters', () => {
    expect(ARABIC_LETTERS.length).toBe(28)
    ARABIC_LETTERS.forEach(letter => {
      expect(LETTER_PEDAGOGY[letter.id]).toBeDefined()
    })
  })

  it('generates orthographic confusable distractors for Baa', () => {
    const distractors = getConfusableDistractors('ba', 3)
    expect(distractors.length).toBeGreaterThanOrEqual(2)
    // Should include sister letters sharing rasm like ta, tha, noon, or ya
    const hasSister = distractors.some(id => ['ta', 'tha', 'noon', 'ya'].includes(id))
    expect(hasSister).toBe(true)
  })

  it('returns valid curated letter groups with 3 to 5 letters each', () => {
    expect(LETTER_GROUPS.length).toBeGreaterThanOrEqual(7)
    LETTER_GROUPS.forEach(group => {
      expect(group.letterIds.length).toBeGreaterThanOrEqual(3)
      expect(group.letterIds.length).toBeLessThanOrEqual(5)
      // Every letter in the group must exist in ARABIC_LETTERS
      group.letterIds.forEach(id => {
        expect(ARABIC_LETTERS.some(l => l.id === id)).toBe(true)
      })
    })
  })

  it('retrieves relevant groups for an individual letter', () => {
    const baGroups = getGroupsForLetter('ba')
    expect(baGroups.length).toBeGreaterThan(0)
    expect(baGroups.some(g => g.id === 'boat-sisters')).toBe(true)
  })
})

describe('Games Library Taxonomy', () => {
  it('registers all games with unique slugs and required metadata', () => {
    const slugs = ALL_GAMES.map(g => g.slug)
    const uniqueSlugs = new Set(slugs)
    expect(uniqueSlugs.size).toBe(slugs.length)

    ALL_GAMES.forEach(game => {
      expect(game.slug).toBeTruthy()
      expect(game.name).toBeTruthy()
      expect(game.skillTag).toBeDefined()
      expect(game.ageGroup).toBeDefined()
      expect(typeof game.supportsLetterScope).toBe('boolean')
      expect(typeof game.supportsGroupScope).toBe('boolean')
    })
  })

  it('includes new group games in the catalog', () => {
    const groupGames = ALL_GAMES.filter(g => g.supportsGroupScope)
    expect(groupGames.length).toBeGreaterThanOrEqual(4)
    expect(slugsMatch(groupGames, 'sister-showdown')).toBe(true)
    expect(slugsMatch(groupGames, 'conveyor-sorter')).toBe(true)
    expect(slugsMatch(groupGames, 'train-sequencer')).toBe(true)
  })
})

function slugsMatch(list: { slug: string }[], target: string) {
  return list.some(item => item.slug === target)
}
