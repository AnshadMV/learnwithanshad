import { describe, it, expect } from 'vitest'
import { ARABIC_LETTERS } from '@/data/arabicLetters'
import {
  ARCADE_LEVELS,
  findMazeNextStep,
  generateLevel1MoleWaves,
  generateLevel7QuizQuestions,
  generateMazeRoundChambers,
  generateWordHunterRounds,
  getArcadeLevelDef,
  getMazeConfig,
  resolveWaveDifficulty,
} from '@/data/arcadeLevels'
import { ALL_GAMES } from '@/pages/GamesLibraryPage'
import { computeLetterSummary } from '@/hooks/useArcadeProgress'

describe('10-Level Arabic Letter Arcade Engine', () => {
  it('defines all 10 distinct arcade levels starting with Mole Whack & Arrow Maze Chase', () => {
    expect(ARCADE_LEVELS).toHaveLength(10)
    expect(ARCADE_LEVELS.map(l => l.level)).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10])
    expect(getArcadeLevelDef(1).id).toBe('mole-whack')
    expect(getArcadeLevelDef(1).defaultWaveSeconds).toBe(10)
    expect(getArcadeLevelDef(2).id).toBe('maze-chase')
    expect(getArcadeLevelDef(2).supportsArrows).toBe(true)
  })

  it('generates 10 progressive Level-1 Mole Whack waves for every Arabic letter with 10s touch timer', () => {
    ARABIC_LETTERS.forEach(letter => {
      const waves = generateLevel1MoleWaves(letter.id, 'adaptive', 'mixed', 10, 10)
      expect(waves).toHaveLength(10)
      expect(waves[0].difficulty).toBe('simple')
      expect(waves[9].difficulty).toBe('hard')
      expect(waves[0].holeCount).toBeLessThanOrEqual(waves[9].holeCount)

      waves.forEach(w => {
        expect(w.durationSeconds).toBe(10)
        expect(w.moles.length).toBe(w.holeCount)
        const targets = w.moles.filter(m => m.isTarget)
        expect(targets.length).toBeGreaterThanOrEqual(1)
        targets.forEach(t => expect(t.letterId).toBe(letter.id))
      })
    })
  })

  it('respects difficulty override options and letter-types vs more-letters modes', () => {
    const simpleOnly = generateLevel1MoleWaves('ba', 'simple', 'more-letters', 10, 10)
    simpleOnly.forEach(w => expect(w.difficulty).toBe('simple'))

    const hardTypes = generateLevel1MoleWaves('ba', 'hard', 'letter-types', 10, 10)
    hardTypes.forEach(w => {
      expect(w.difficulty).toBe('hard')
      expect(w.holeCount).toBeGreaterThanOrEqual(6)
    })

    expect(resolveWaveDifficulty('medium', 0, 10)).toBe('medium')
    expect(resolveWaveDifficulty('adaptive', 0, 10)).toBe('simple')
    expect(resolveWaveDifficulty('adaptive', 5, 10)).toBe('medium')
    expect(resolveWaveDifficulty('adaptive', 9, 10)).toBe('hard')
  })

  it('verifies Level-2 Cosmic Maze Chase layouts have connected BFS paths to all chambers', () => {
    const diffs = ['simple', 'medium', 'hard'] as const
    diffs.forEach(diff => {
      const cfg = getMazeConfig(diff)
      expect(cfg.grid[cfg.playerStart.r][cfg.playerStart.c]).toBe(0)

      cfg.chambers.forEach(chCoord => {
        expect(cfg.grid[chCoord.r][chCoord.c]).toBe(0)
        const { next, path } = findMazeNextStep(cfg.grid, cfg.playerStart, chCoord)
        expect(next).not.toBeNull()
        expect(path.length).toBeGreaterThan(1)
      })

      const round = generateMazeRoundChambers('jeem', 2, cfg, diff, 'mixed')
      expect(round.chambers.length).toBe(cfg.chambers.length)
      expect(round.chambers.filter(c => c.isTarget)).toHaveLength(1)
    })
  })

  it('generates Level 7 Quiz questions and Level 9 Word Hunter challenges for any Arabic letter', () => {
    const quiz = generateLevel7QuizQuestions('seen', 'medium', 8)
    expect(quiz).toHaveLength(8)
    quiz.forEach(q => {
      expect(q.options.length).toBeGreaterThanOrEqual(3)
      expect(q.options.filter(o => o.isCorrect)).toHaveLength(1)
    })

    const words = generateWordHunterRounds('meem', 8)
    expect(words).toHaveLength(8)
    words.forEach(w => {
      expect(w.options.filter(o => o.isCorrect)).toHaveLength(1)
      expect(w.example.letter_id).toBe('meem')
    })
  })

  it('computes per-letter 10-level arcade progress & next recommended level accurately', () => {
    const summary = computeLetterSummary({
      1: { level: 1, completed: true, stars: 3, bestScore: 180, bestAccuracy: 100, attempts: 1, lastPlayedAt: '' },
      2: { level: 2, completed: true, stars: 2, bestScore: 140, bestAccuracy: 80, attempts: 2, lastPlayedAt: '' },
    })
    expect(summary.completedCount).toBe(2)
    expect(summary.totalStars).toBe(5)
    expect(summary.nextRecommendedLevel).toBe(3)
  })

  it('registers the 10-level arcade and highlight levels in ALL_GAMES cleanly', () => {
    const slugs = ALL_GAMES.map(g => g.slug)
    expect(slugs).toContain('letter-arcade')
    expect(slugs).toContain('mole-hit-arcade')
    expect(slugs).toContain('maze-arrow-chase')
    expect(slugs).toContain('sky-arrow-flight')
    expect(slugs).toContain('quiz-show-blitz')
    expect(new Set(slugs).size).toBe(ALL_GAMES.length)
  })
})
