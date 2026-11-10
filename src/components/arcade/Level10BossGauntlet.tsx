import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import { Crown, Shield, Volume2, Lightbulb, Clock, Swords } from 'lucide-react'
import { ARABIC_LETTERS, getLetterById } from '@/data/arabicLetters'
import {
  generateLevel1MoleWaves,
  type MoleOption,
} from '@/data/arcadeLevels'
import { useSound } from '@/hooks/useSound'
import { useArabicSpeech } from '@/hooks/useArabicSpeech'
import type { ArcadeLevelProps } from './arcadeTypes'
import { cn } from '@/lib/utils'

const BOSS_NAMES = [
  'Desert Sphinx Guardian',
  'Qalam Scribble Knight',
  'Diacritic Dragon',
  'Mirror Sister Sentinel',
  'Grand Alphabet Sultan',
]

export default function Level10BossGauntlet({
  letterId,
  letterMode,
  waveSeconds,
  isPaused,
  hintSeq,
  restartSeq,
  nextWaveSeq,
  bonusTimeSeq,
  bonusTimeSec,
  onAnswer,
  onTelemetry,
  onComplete,
}: ArcadeLevelProps) {
  const { playCorrect, playWrong, playStar, playBoing, playFanfare } = useSound()
  const { speak } = useArabicSpeech()

  const letterObj = getLetterById(letterId) || ARABIC_LETTERS[0]

  // Force Hard / escalating gauntlet with both letter types & lookalikes
  const waves = useMemo(
    () =>
      generateLevel1MoleWaves(
        letterObj.id,
        'hard',
        letterMode === 'more-letters' ? 'more-letters' : 'mixed',
        Math.max(8, waveSeconds),
        10
      ),
    [letterObj.id, letterMode, waveSeconds, restartSeq]
  )

  const [waveIdx, setWaveIdx] = useState(0)
  const [bossHp, setBossHp] = useState(waves.length)
  const [timeLeft, setTimeLeft] = useState(waves[0]?.durationSeconds || waveSeconds)
  const [hintActive, setHintActive] = useState(false)
  const [feedback, setFeedback] = useState<{ text: string; good: boolean } | null>(null)
  const [bossHitAnim, setBossHitAnim] = useState(false)

  const lockRef = useRef(false)
  const completedRef = useRef(false)
  const correctRef = useRef(0)
  const totalRef = useRef(0)

  const currentWave = waves[waveIdx] || waves[0]
  const bossTitle = BOSS_NAMES[Math.floor(waveIdx / 2) % BOSS_NAMES.length]

  useEffect(() => {
    setWaveIdx(0)
    setBossHp(waves.length)
    setTimeLeft(waves[0]?.durationSeconds || waveSeconds)
    setHintActive(false)
    setFeedback(null)
    lockRef.current = false
    completedRef.current = false
    correctRef.current = 0
    totalRef.current = 0
  }, [waves, waveSeconds])

  useEffect(() => {
    if (currentWave?.targetChar) speak(currentWave.targetChar)
  }, [waveIdx, currentWave?.targetChar])

  useEffect(() => {
    if (hintSeq > 0) {
      setHintActive(true)
      playStar()
    }
  }, [hintSeq, playStar])

  useEffect(() => {
    if (bonusTimeSeq > 0) setTimeLeft(t => t + (bonusTimeSec || 5))
  }, [bonusTimeSeq, bonusTimeSec])

  const advance = useCallback(() => {
    if (completedRef.current) return
    if (waveIdx < waves.length - 1) {
      lockRef.current = false
      const nextIdx = waveIdx + 1
      setWaveIdx(nextIdx)
      setTimeLeft(waves[nextIdx]?.durationSeconds || waveSeconds)
      setHintActive(false)
      setFeedback(null)
    } else {
      completedRef.current = true
      playFanfare()
      onComplete({ correct: correctRef.current, total: Math.max(totalRef.current, waves.length) })
    }
  }, [waveIdx, waves, waveSeconds, playFanfare, onComplete])

  useEffect(() => {
    if (nextWaveSeq > 0 && !completedRef.current) advance()
  }, [nextWaveSeq, advance])

  useEffect(() => {
    onTelemetry({ wave: waveIdx + 1, totalWaves: waves.length, timeLeft: Math.ceil(timeLeft) })
  }, [waveIdx, waves.length, Math.ceil(timeLeft)])

  useEffect(() => {
    if (isPaused || completedRef.current) return
    const iv = setInterval(() => {
      if (lockRef.current) return
      setTimeLeft(t => {
        if (t <= 0.2) {
          if (!lockRef.current) {
            lockRef.current = true
            totalRef.current += 1
            playWrong()
            onAnswer(false, 0)
            setFeedback({ text: `Boss shielded! Target was ${currentWave.targetChar}`, good: false })
            setTimeout(advance, 650)
          }
          return 0
        }
        return Number((t - 0.1).toFixed(1))
      })
    }, 100)
    return () => clearInterval(iv)
  }, [isPaused, waveIdx, currentWave?.targetChar, advance])

  const handleStrike = (opt: MoleOption) => {
    if (isPaused || lockRef.current || completedRef.current) return
    lockRef.current = true
    totalRef.current += 1

    if (opt.isTarget) {
      correctRef.current += 1
      setBossHp(hp => Math.max(0, hp - 1))
      setBossHitAnim(true)
      setTimeout(() => setBossHitAnim(false), 450)
      playBoing()
      playCorrect()
      speak(opt.char)
      const pts = 30 + Math.round(timeLeft * 2)
      onAnswer(true, pts)
      setFeedback({ text: `CRITICAL HIT! -1 Boss HP! +${pts} pts ⚔️`, good: true })
    } else {
      playWrong()
      onAnswer(false, 0)
      setFeedback({ text: `Shield block! (${opt.label}) — Target was ${currentWave.targetChar}`, good: false })
    }
    setTimeout(advance, 650)
  }

  return (
    <div className="rounded-3xl overflow-hidden shadow-2xl border-4 border-rose-500 bg-gradient-to-br from-slate-950 via-red-950 to-amber-950 text-white p-4 sm:p-6 space-y-5 select-none">
      {/* Boss Arena Top Bar */}
      <div className="bg-black/40 rounded-2xl p-4 border border-rose-500/40 space-y-3">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <motion.div
              animate={bossHitAnim ? { x: [-8, 8, -6, 6, 0], scale: [1, 0.9, 1] } : { y: [0, -4, 0] }}
              transition={{ duration: 0.5, repeat: bossHitAnim ? 0 : Infinity }}
              className="w-14 h-14 rounded-2xl bg-gradient-to-br from-rose-500 to-amber-500 flex items-center justify-center text-3xl shadow-lg border-2 border-amber-300"
            >
              🐉
            </motion.div>
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded-full bg-rose-600 text-[10px] font-black uppercase flex items-center gap-1">
                  <Crown className="w-3 h-3" /> Level 10 Final Boss
                </span>
                <span className="text-xs font-bold text-amber-300">
                  Round {waveIdx + 1}/{waves.length}
                </span>
              </div>
              <h3 className="font-black text-base text-white mt-0.5">{bossTitle}</h3>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-black/60 border border-rose-400/40 font-mono font-black text-sm">
              <Clock className="w-4 h-4 text-rose-400" />
              <span className={timeLeft <= 3 ? 'text-rose-400 animate-pulse' : 'text-white'}>
                {timeLeft.toFixed(1)}s
              </span>
            </div>
            <button type="button" onClick={() => speak(currentWave.targetChar)} className="p-2 rounded-xl bg-white/10">
              <Volume2 className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => {
                setHintActive(true)
                playStar()
              }}
              className="p-2 rounded-xl bg-amber-400/20 text-amber-300"
            >
              <Lightbulb className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Boss HP Bar */}
        <div className="space-y-1">
          <div className="flex items-center justify-between text-[11px] font-black text-rose-200">
            <span className="flex items-center gap-1">
              <Shield className="w-3.5 h-3.5 text-rose-400" /> Boss Health
            </span>
            <span>
              {bossHp} / {waves.length} HP
            </span>
          </div>
          <div className="w-full h-3 rounded-full bg-slate-900 border border-rose-500/30 overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-rose-500 via-red-500 to-amber-400 transition-all duration-300"
              style={{ width: `${(bossHp / waves.length) * 100}%` }}
            />
          </div>
        </div>
      </div>

      {/* Strike Challenge Prompt */}
      <div className="bg-white/10 rounded-2xl p-3.5 flex items-center justify-center gap-4 border border-white/15">
        <span className="font-arabic text-5xl font-black text-amber-300 drop-shadow" dir="rtl">
          {currentWave.targetChar}
        </span>
        <div>
          <div className="text-xs font-bold uppercase text-amber-200 flex items-center gap-1">
            <Swords className="w-3.5 h-3.5" /> Boss Weakness Strike
          </div>
          <div className="text-sm sm:text-base font-black">{currentWave.promptTitle}</div>
        </div>
      </div>

      {feedback && (
        <div
          className={cn(
            'text-center text-xs font-black py-1.5 px-4 rounded-xl',
            feedback.good ? 'bg-emerald-500 text-white' : 'bg-rose-600 text-white'
          )}
        >
          {feedback.text}
        </div>
      )}

      {/* Boss Minion Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {currentWave.moles.map(opt => {
          const isHinted = hintActive && opt.isTarget
          return (
            <motion.button
              key={`${waveIdx}_${opt.id}`}
              type="button"
              whileHover={{ scale: 1.05, y: -2 }}
              whileTap={{ scale: 0.94 }}
              onClick={() => handleStrike(opt)}
              className={cn(
                'p-4 rounded-2xl border-2 bg-slate-900/90 hover:bg-rose-900/60 flex flex-col items-center justify-center gap-1 transition-all shadow-lg',
                isHinted
                  ? 'border-amber-300 ring-4 ring-amber-400/70 animate-pulse bg-amber-900/40'
                  : 'border-rose-400/40'
              )}
            >
              <span className="font-arabic text-4xl font-black text-white leading-none" dir="rtl">
                {opt.char}
              </span>
              <span className="text-[10px] font-bold text-rose-200 truncate max-w-full">
                {opt.label}
              </span>
            </motion.button>
          )
        })}
      </div>
    </div>
  )
}
