import type { ArcadeDifficulty, ArcadeLetterMode } from '@/data/arcadeLevels'

export interface ArcadeLevelProps {
  letterId: string
  difficulty: ArcadeDifficulty
  letterMode: ArcadeLetterMode
  waveSeconds: number
  isPaused: boolean
  hintSeq: number
  restartSeq: number
  nextWaveSeq: number
  bonusTimeSeq: number
  bonusTimeSec: number
  onAnswer: (correct: boolean, points?: number) => void
  onTelemetry: (patch: {
    wave: number
    totalWaves: number
    timeLeft: number
    lives?: number
  }) => void
  onComplete: (summary?: { score?: number; correct?: number; total?: number }) => void
}
