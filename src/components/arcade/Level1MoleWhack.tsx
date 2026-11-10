import { useEffect, useMemo, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Volume2, Lightbulb, Sparkles, Clock } from 'lucide-react'
import { ARABIC_LETTERS, getLetterById } from '@/data/arabicLetters'
import {
  generateLevel1MoleWaves,
  type MoleOption,
} from '@/data/arcadeLevels'
import { useSound } from '@/hooks/useSound'
import { useArabicSpeech } from '@/hooks/useArabicSpeech'
import type { ArcadeLevelProps } from './arcadeTypes'
import { cn } from '@/lib/utils'

function MoleSvg({
  dizzy,
  variant = 0,
}: {
  dizzy: boolean
  variant?: number
}) {
  const furColor = variant % 3 === 0 ? '#7C5338' : variant % 3 === 1 ? '#A57552' : '#5E4132'
  const bellyColor = variant % 3 === 0 ? '#C79B79' : variant % 3 === 1 ? '#D8B393' : '#9E7760'

  return (
    <svg viewBox="0 0 110 88" className="w-20 h-16 sm:w-24 sm:h-20 drop-shadow-md select-none">
      {/* Body emerging from burrow */}
      <path
        d="M22 84 C20 42, 32 16, 55 16 C78 16, 90 42, 88 84 Z"
        fill={furColor}
        stroke="#3F281A"
        strokeWidth="2.5"
      />
      {/* Cheeks/muzzle lighter patch */}
      <ellipse cx="55" cy="56" rx="22" ry="18" fill={bellyColor} />

      {/* Eyes */}
      {dizzy ? (
        <g stroke="#2563EB" strokeWidth="2.3" fill="none">
          <circle cx="42" cy="37" r="6" fill="#EFF6FF" />
          <path d="M40 37 a2 2 0 1 0 4 0 a3.5 3.5 0 1 0 -5.5 1.5" />
          <circle cx="68" cy="37" r="6" fill="#EFF6FF" />
          <path d="M66 37 a2 2 0 1 0 4 0 a3.5 3.5 0 1 0 -5.5 1.5" />
        </g>
      ) : (
        <g>
          <circle cx="43" cy="36" r="4.5" fill="#1E1B18" />
          <circle cx="44.5" cy="34.5" r="1.6" fill="#FFFFFF" />
          <circle cx="67" cy="36" r="4.5" fill="#1E1B18" />
          <circle cx="68.5" cy="34.5" r="1.6" fill="#FFFFFF" />
        </g>
      )}

      {/* Pink Nose */}
      <ellipse cx="55" cy="46" rx="7" ry="5" fill="#F472B6" stroke="#BE185D" strokeWidth="1.2" />
      <ellipse cx="53" cy="44.5" rx="2" ry="1.2" fill="#FBCFE8" />

      {/* Happy or Bonked Mouth */}
      {dizzy ? (
        <ellipse cx="55" cy="58" rx="6" ry="4" fill="#7F1D1D" />
      ) : (
        <path d="M48 55 Q55 62 62 55" stroke="#451A03" strokeWidth="2.2" fill="none" strokeLinecap="round" />
      )}

      {/* Whiskers */}
      <g stroke="#3F281A" strokeWidth="1.5" opacity="0.7">
        <line x1="25" y1="46" x2="38" y2="48" />
        <line x1="24" y1="53" x2="37" y2="52" />
        <line x1="85" y1="46" x2="72" y2="48" />
        <line x1="86" y1="53" x2="73" y2="52" />
      </g>

      {/* Cute Paws gripping dirt */}
      <ellipse cx="26" cy="74" rx="8" ry="5.5" fill="#F9A8D4" stroke="#3F281A" strokeWidth="1.8" />
      <ellipse cx="84" cy="74" rx="8" ry="5.5" fill="#F9A8D4" stroke="#3F281A" strokeWidth="1.8" />
    </svg>
  )
}

export default function Level1MoleWhack({
  letterId,
  difficulty,
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
  const { playCorrect, playWrong, playBoing, playPop, playStar } = useSound()
  const { speak } = useArabicSpeech()

  const letterObj = getLetterById(letterId) || ARABIC_LETTERS[0]

  const waves = useMemo(
    () => generateLevel1MoleWaves(letterId, difficulty, letterMode, waveSeconds, 10),
    [letterId, difficulty, letterMode, waveSeconds, restartSeq]
  )

  const [waveIdx, setWaveIdx] = useState(0)
  const [timeLeft, setTimeLeft] = useState<number>(waveSeconds)
  const [hitMoleId, setHitMoleId] = useState<string | null>(null)
  const [wrongMoleIds, setWrongMoleIds] = useState<Record<string, boolean>>({})
  const [hintActive, setHintActive] = useState(false)
  const [bannerFeedback, setBannerFeedback] = useState<{ text: string; good: boolean } | null>(null)
  const [starsFilled, setStarsFilled] = useState(0)
  const [correctCount, setCorrectCount] = useState(0)

  const waveLockedRef = useRef(false)
  const correctRef = useRef(0)
  const totalRef = useRef(0)
  const completedRef = useRef(false)

  const currentWave = waves[waveIdx] || waves[0]

  // Reset entire level when waves regenerate
  useEffect(() => {
    setWaveIdx(0)
    setTimeLeft(waves[0]?.durationSeconds || waveSeconds)
    setHitMoleId(null)
    setWrongMoleIds({})
    setHintActive(false)
    setBannerFeedback(null)
    setStarsFilled(0)
    setCorrectCount(0)
    waveLockedRef.current = false
    correctRef.current = 0
    totalRef.current = 0
    completedRef.current = false
  }, [waves, waveSeconds])

  // Speak prompt letter when wave changes
  useEffect(() => {
    if (!currentWave) return
    speak(currentWave.targetChar)
  }, [waveIdx, currentWave?.targetChar])

  // Respond to teacher Hint button
  useEffect(() => {
    if (hintSeq > 0) {
      setHintActive(true)
      playStar()
    }
  }, [hintSeq, playStar])

  // Respond to teacher +5s bonus time
  useEffect(() => {
    if (bonusTimeSeq > 0) {
      setTimeLeft(t => t + (bonusTimeSec || 5))
    }
  }, [bonusTimeSeq, bonusTimeSec])

  // Respond to teacher Next Wave override
  useEffect(() => {
    if (nextWaveSeq > 0 && !completedRef.current) {
      advanceWave()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [nextWaveSeq])

  const advanceWave = () => {
    if (completedRef.current) return
    if (waveIdx < waves.length - 1) {
      const nextIdx = waveIdx + 1
      waveLockedRef.current = false
      setWaveIdx(nextIdx)
      setTimeLeft(waves[nextIdx]?.durationSeconds || waveSeconds)
      setHitMoleId(null)
      setWrongMoleIds({})
      setHintActive(false)
      setBannerFeedback(null)
    } else {
      completedRef.current = true
      onComplete({
        correct: correctRef.current,
        total: Math.max(totalRef.current, waves.length),
      })
    }
  }

  // Telemetry emitter
  useEffect(() => {
    onTelemetry({
      wave: waveIdx + 1,
      totalWaves: waves.length,
      timeLeft: Math.ceil(timeLeft),
    })
  }, [waveIdx, waves.length, Math.ceil(timeLeft)])

  // 10-second per-wave countdown interval
  useEffect(() => {
    if (isPaused || completedRef.current) return
    const timer = setInterval(() => {
      if (waveLockedRef.current) return
      setTimeLeft(prev => {
        if (prev <= 0.1) {
          // Wave timed out
          if (!waveLockedRef.current) {
            waveLockedRef.current = true
            totalRef.current += 1
            playWrong()
            onAnswer(false, 0)
            setBannerFeedback({
              text: `Time's up! Look for ${currentWave.targetChar}`,
              good: false,
            })
            setTimeout(() => {
              advanceWave()
            }, 650)
          }
          return 0
        }
        return Math.max(0, Number((prev - 0.1).toFixed(1)))
      })
    }, 100)

    return () => clearInterval(timer)
  }, [isPaused, waveIdx, currentWave?.targetChar])

  const handleWhackMole = (mole: MoleOption) => {
    if (isPaused || waveLockedRef.current || completedRef.current) return
    if (wrongMoleIds[mole.id]) return

    if (mole.isTarget) {
      waveLockedRef.current = true
      totalRef.current += 1
      correctRef.current += 1
      setCorrectCount(c => c + 1)
      setHitMoleId(mole.id)

      const speedBonus = Math.round(timeLeft * 2)
      const diffBonus = currentWave.difficulty === 'hard' ? 10 : currentWave.difficulty === 'medium' ? 5 : 0
      const points = 15 + speedBonus + diffBonus

      playBoing()
      playCorrect()
      speak(mole.char)
      onAnswer(true, points)

      const nextStars = Math.min(5, Math.ceil(((correctRef.current) / waves.length) * 5))
      setStarsFilled(nextStars)
      setBannerFeedback({
        text: `Bonk! +${points} pts (${mole.label}) ⭐`,
        good: true,
      })

      setTimeout(() => {
        advanceWave()
      }, 650)
    } else {
      totalRef.current += 1
      playWrong()
      playPop()
      onAnswer(false, 0)
      setWrongMoleIds(prev => ({ ...prev, [mole.id]: true }))
      setBannerFeedback({
        text: `Oops! That's "${mole.label}". Hit ${currentWave.targetChar}!`,
        good: false,
      })
    }
  }

  const timerPct = Math.min(100, Math.round((timeLeft / (currentWave?.durationSeconds || 10)) * 100))

  const gridColsClass =
    currentWave.holeCount <= 3
      ? 'grid-cols-3'
      : currentWave.holeCount === 4
      ? 'grid-cols-2 sm:grid-cols-4'
      : currentWave.holeCount === 5
      ? 'grid-cols-2 sm:grid-cols-5'
      : currentWave.holeCount === 6
      ? 'grid-cols-2 sm:grid-cols-3'
      : 'grid-cols-2 sm:grid-cols-4'

  return (
    <div className="rounded-3xl overflow-hidden shadow-2xl border-4 border-amber-500/70 select-none relative">
      {/* Scenic Desert/Meadow Sky + Rolling Hills */}
      <div
        className="relative p-4 sm:p-6 min-h-[540px] flex flex-col justify-between overflow-hidden"
        style={{
          background:
            'linear-gradient(180deg, #93D2F6 0%, #D4ECFA 40%, #E7D28B 44%, #CEB569 100%)',
        }}
      >
        {/* Distant Mesa / Silhouettes matching scenic backdrop */}
        <div
          className="pointer-events-none absolute left-0 right-0 h-20 opacity-35"
          style={{
            top: '32%',
            background:
              'linear-gradient(to top, rgba(160,130,80,0.6), transparent)',
          }}
        />
        {/* Decorative drifting cloud */}
        <div className="pointer-events-none absolute top-4 left-8 w-24 h-8 bg-white/70 rounded-full blur-[1px]" />
        <div className="pointer-events-none absolute top-8 right-10 w-28 h-9 bg-white/60 rounded-full blur-[1px]" />

        {/* TOP: Wooden Signboard + 5 Stars + Target Letter */}
        <div className="relative z-10 flex flex-col items-center">
          {/* Top Sign Plank: Level 1 */}
          <div className="relative flex flex-col items-center">
            <div className="bg-gradient-to-b from-[#9A6E43] to-[#7B522D] border-2 border-[#4B3019] px-6 py-1 rounded-md shadow-md text-white font-black text-sm sm:text-base tracking-wide flex items-center gap-2">
              <span>Level 1</span>
              <span className="text-amber-200 text-xs font-extrabold">
                • Wave {currentWave.waveNumber}/{waves.length}
              </span>
              <span
                className={cn(
                  'px-2 py-0.5 rounded text-[10px] uppercase font-black',
                  currentWave.difficulty === 'simple'
                    ? 'bg-emerald-500 text-white'
                    : currentWave.difficulty === 'medium'
                    ? 'bg-amber-400 text-slate-950'
                    : 'bg-rose-600 text-white'
                )}
              >
                {currentWave.difficulty}
              </span>
            </div>

            {/* Wooden Star Plank */}
            <div className="mt-1 bg-gradient-to-b from-[#B28352] via-[#9D6E41] to-[#7D532B] border-2 border-[#4B3019] rounded-xl px-5 sm:px-8 py-2.5 shadow-xl flex flex-col items-center gap-1.5 relative">
              {/* Nail heads */}
              <span className="w-2 h-2 rounded-full bg-slate-300 border border-slate-600 absolute top-1.5 left-2" />
              <span className="w-2 h-2 rounded-full bg-slate-300 border border-slate-600 absolute top-1.5 right-2" />

              {/* 5 Milestone Stars */}
              <div className="flex items-center gap-2 sm:gap-3">
                {[1, 2, 3, 4, 5].map(starIdx => (
                  <motion.span
                    key={starIdx}
                    animate={
                      starsFilled >= starIdx ? { scale: [1, 1.25, 1] } : undefined
                    }
                    className={cn(
                      'text-2xl sm:text-3xl leading-none drop-shadow transition-all',
                      starsFilled >= starIdx
                        ? 'text-yellow-300 scale-110'
                        : 'text-white/90 opacity-85'
                    )}
                    style={{
                      textShadow:
                        starsFilled >= starIdx
                          ? '0 2px 6px rgba(251,191,36,0.85)'
                          : '0 1px 0 #1f2937',
                    }}
                  >
                    {starsFilled >= starIdx ? '★' : '☆'}
                  </motion.span>
                ))}
              </div>
            </div>
            {/* Wooden Post */}
            <div className="w-5 h-3 bg-[#6D4726] border-x-2 border-[#4B3019]" />
          </div>

          {/* Target Prompt Banner + 10-Second Touch Timer */}
          <div className="w-full max-w-2xl bg-white/95 backdrop-blur rounded-2xl p-3 sm:p-3.5 shadow-lg border-2 border-amber-300 flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => speak(currentWave.targetChar)}
                className="w-14 h-14 rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 text-white font-arabic text-4xl font-black flex items-center justify-center shadow-md border-2 border-white hover:scale-105 active:scale-95 transition-transform shrink-0"
                dir="rtl"
                title="Tap to hear target"
              >
                {currentWave.targetChar}
              </button>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="font-black text-slate-800 text-sm sm:text-base">
                    {currentWave.promptTitle}
                  </h3>
                  <button
                    type="button"
                    onClick={() => speak(currentWave.targetChar)}
                    className="p-1 rounded-lg bg-blue-50 text-brand-blue hover:bg-blue-100"
                    title="Hear Arabic sound"
                  >
                    <Volume2 className="w-3.5 h-3.5" />
                  </button>
                </div>
                <p className="text-xs text-slate-500 font-medium">
                  {currentWave.promptSubtitle}
                </p>
              </div>
            </div>

            {/* 10s Countdown Indicator */}
            <div className="flex items-center gap-2.5 w-full sm:w-auto shrink-0">
              <div className="flex-1 sm:w-32 space-y-1">
                <div className="flex items-center justify-between text-[11px] font-black">
                  <span className="flex items-center gap-1 text-slate-600">
                    <Clock className="w-3.5 h-3.5 text-amber-600" /> Timer
                  </span>
                  <span
                    className={cn(
                      'font-mono text-sm',
                      timeLeft <= 3 ? 'text-rose-600 animate-pulse' : 'text-amber-700'
                    )}
                  >
                    {timeLeft.toFixed(1)}s
                  </span>
                </div>
                <div className="w-full h-2.5 rounded-full bg-slate-200 overflow-hidden">
                  <div
                    className={cn(
                      'h-full rounded-full transition-all duration-100',
                      timeLeft <= 3
                        ? 'bg-rose-500'
                        : timeLeft <= 6
                        ? 'bg-amber-500'
                        : 'bg-emerald-500'
                    )}
                    style={{ width: `${timerPct}%` }}
                  />
                </div>
              </div>

              <button
                type="button"
                onClick={() => {
                  setHintActive(true)
                  playStar()
                }}
                className="p-2 rounded-xl bg-amber-100 hover:bg-amber-200 text-amber-800 border border-amber-300"
                title="Show Hint"
              >
                <Lightbulb className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Feedback Banner */}
        <div className="relative z-10 min-h-[28px] flex justify-center my-2">
          <AnimatePresence mode="wait">
            {bannerFeedback && (
              <motion.div
                key={bannerFeedback.text}
                initial={{ opacity: 0, y: -6, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0 }}
                className={cn(
                  'px-4 py-1 rounded-full text-xs font-black shadow-md border',
                  bannerFeedback.good
                    ? 'bg-emerald-500 text-white border-emerald-300'
                    : 'bg-rose-500 text-white border-rose-300'
                )}
              >
                {bannerFeedback.text}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* MIDDLE/BOTTOM: Burrows & Moles with Arabic Letter Speech Bubbles */}
        <div
          className={cn(
            'relative z-10 grid gap-x-4 gap-y-6 sm:gap-y-8 items-end justify-items-center pt-6 pb-2',
            gridColsClass
          )}
        >
          {currentWave.moles.map((mole, idx) => {
            const isHit = hitMoleId === mole.id
            const isWrongDismissed = Boolean(wrongMoleIds[mole.id])
            const showGoldHint = hintActive && mole.isTarget && !isHit

            return (
              <div
                key={`${waveIdx}_${mole.id}`}
                className="relative flex flex-col items-center w-full max-w-[165px]"
              >
                {/* Popping Mole + Speech Bubble */}
                <AnimatePresence>
                  {!isWrongDismissed && (
                    <motion.button
                      type="button"
                      initial={{ y: 42, opacity: 0, scale: 0.85 }}
                      animate={{
                        y: isHit ? 8 : 0,
                        opacity: 1,
                        scale: isHit ? 1.05 : 1,
                      }}
                      exit={{ y: 45, opacity: 0 }}
                      transition={{
                        type: 'spring',
                        stiffness: 260,
                        damping: 18,
                        delay: idx * 0.04,
                      }}
                      whileHover={{ scale: 1.06, y: -3 }}
                      whileTap={{ scale: 0.92 }}
                      onClick={() => handleWhackMole(mole)}
                      className="relative flex flex-col items-center focus:outline-none group"
                    >
                      {/* Speech Bubble Holding Arabic Letter */}
                      <div
                        className={cn(
                          'relative mb-1 px-4 py-2 min-w-[92px] rounded-2xl bg-white border-2 shadow-lg transition-all flex flex-col items-center',
                          isHit
                            ? 'border-emerald-500 ring-4 ring-emerald-300/60 bg-emerald-50'
                            : showGoldHint
                            ? 'border-amber-400 ring-4 ring-amber-300 animate-bounce bg-amber-50'
                            : 'border-[#B69F78] group-hover:border-amber-500'
                        )}
                      >
                        <span
                          className="font-arabic text-4xl sm:text-5xl font-black text-slate-900 leading-none py-0.5"
                          dir="rtl"
                        >
                          {mole.char}
                        </span>
                        {(letterMode === 'letter-types' || currentWave.difficulty !== 'simple') && (
                          <span className="text-[9px] font-bold text-slate-400 mt-0.5 truncate max-w-[110px]">
                            {mole.label}
                          </span>
                        )}

                        {showGoldHint && (
                          <span className="absolute -top-2.5 right-1 px-1.5 py-0.5 rounded-full bg-amber-400 text-slate-950 text-[9px] font-black shadow">
                            💡 HIT!
                          </span>
                        )}

                        {isHit && (
                          <span className="absolute -top-3 left-1/2 -translate-x-1/2 text-lg">
                            💥✨
                          </span>
                        )}

                        {/* Speech bubble tail */}
                        <div className="w-3 h-3 bg-white border-r-2 border-b-2 border-[#B69F78] rotate-45 -mb-3.5 mt-1" />
                      </div>

                      {/* Mole Character */}
                      <div className="-mb-3 z-10">
                        <MoleSvg dizzy={isHit} variant={idx} />
                      </div>
                    </motion.button>
                  )}
                </AnimatePresence>

                {/* Dirt Burrow Rim */}
                <div className="relative w-32 sm:w-36 h-8 flex items-center justify-center pointer-events-none">
                  <div className="w-full h-7 rounded-[100%] bg-[#5C442E] border-2 border-[#3F281A] shadow-inner" />
                  <div
                    className="absolute -bottom-1 w-[108%] h-5 rounded-full"
                    style={{
                      background:
                        'radial-gradient(circle at 20% 50%, #A9936D 18%, transparent 20%), radial-gradient(circle at 50% 60%, #8C7451 24%, transparent 26%), radial-gradient(circle at 80% 50%, #9E8762 20%, transparent 22%), #96815C',
                    }}
                  />
                </div>
              </div>
            )
          })}
        </div>

        {/* Footer Info Strip */}
        <div className="relative z-10 mt-3 flex items-center justify-between text-[11px] font-bold text-amber-950/80 bg-white/60 backdrop-blur px-3.5 py-1.5 rounded-xl">
          <span className="flex items-center gap-1">
            <Sparkles className="w-3.5 h-3.5 text-amber-600" />
            Hits: <strong>{correctCount}/{waves.length}</strong> • Letter:{' '}
            <strong className="font-arabic text-sm">{letterObj.letter}</strong>
          </span>
          <span>
            Mode: <strong className="capitalize">{letterMode.replace('-', ' ')}</strong>
          </span>
        </div>
      </div>
    </div>
  )
}
