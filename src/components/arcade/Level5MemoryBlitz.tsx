import { useEffect, useMemo, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import { Lightbulb, Volume2, Clock } from 'lucide-react'
import { getLetterById, ARABIC_LETTERS } from '@/data/arabicLetters'
import { getLetterMemoryPairs } from '@/data/letterVariants'
import { useSound } from '@/hooks/useSound'
import { useArabicSpeech } from '@/hooks/useArabicSpeech'
import type { ArcadeLevelProps } from './arcadeTypes'
import { cn, shuffleArray } from '@/lib/utils'

interface MemoryCard {
  uid: string
  pairId: string
  char: string
  label: string
}

export default function Level5MemoryBlitz({
  letterId,
  difficulty,
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
  const { playClick, playCorrect, playWrong, playStar } = useSound()
  const { speak } = useArabicSpeech()

  const letterObj = getLetterById(letterId) || ARABIC_LETTERS[0]
  const pairCount = difficulty === 'simple' ? 4 : difficulty === 'medium' ? 5 : 6

  const deck = useMemo<MemoryCard[]>(() => {
    const pairs = getLetterMemoryPairs(letterObj.id).slice(0, pairCount)
    const cards: MemoryCard[] = []
    pairs.forEach((p, idx) => {
      cards.push({ uid: `${p.id}_a_${idx}`, pairId: p.id, char: p.char, label: p.name })
      cards.push({ uid: `${p.id}_b_${idx}`, pairId: p.id, char: p.char, label: p.name })
    })
    return shuffleArray(cards)
  }, [letterObj.id, pairCount, restartSeq])

  const initialSecs = Math.max(45, waveSeconds * 6)
  const [timeLeft, setTimeLeft] = useState(initialSecs)
  const [flipped, setFlipped] = useState<string[]>([])
  const [matchedPairs, setMatchedPairs] = useState<Record<string, boolean>>({})
  const [hintPairId, setHintPairId] = useState<string | null>(null)
  const lockRef = useRef(false)
  const completedRef = useRef(false)
  const correctRef = useRef(0)
  const totalRef = useRef(0)

  useEffect(() => {
    setTimeLeft(Math.max(45, waveSeconds * 6))
    setFlipped([])
    setMatchedPairs({})
    setHintPairId(null)
    lockRef.current = false
    completedRef.current = false
    correctRef.current = 0
    totalRef.current = 0
  }, [deck, waveSeconds])

  useEffect(() => {
    if (hintSeq > 0) {
      const firstUnmatched = deck.find(c => !matchedPairs[c.pairId])
      if (firstUnmatched) {
        setHintPairId(firstUnmatched.pairId)
        playStar()
      }
    }
  }, [hintSeq, deck, matchedPairs, playStar])

  useEffect(() => {
    if (bonusTimeSeq > 0) setTimeLeft(t => t + (bonusTimeSec || 5))
  }, [bonusTimeSeq, bonusTimeSec])

  useEffect(() => {
    if (nextWaveSeq > 0 && !completedRef.current) {
      completedRef.current = true
      onComplete({ correct: correctRef.current, total: Math.max(totalRef.current, pairCount) })
    }
  }, [nextWaveSeq, pairCount, onComplete])

  const matchedCount = Object.keys(matchedPairs).length

  useEffect(() => {
    onTelemetry({ wave: matchedCount + 1, totalWaves: pairCount, timeLeft: Math.ceil(timeLeft) })
  }, [matchedCount, pairCount, Math.ceil(timeLeft)])

  useEffect(() => {
    if (isPaused || completedRef.current) return
    const iv = setInterval(() => {
      setTimeLeft(t => {
        if (t <= 1) {
          if (!completedRef.current) {
            completedRef.current = true
            onComplete({ correct: correctRef.current, total: Math.max(totalRef.current, pairCount) })
          }
          return 0
        }
        return t - 1
      })
    }, 1000)
    return () => clearInterval(iv)
  }, [isPaused, pairCount, onComplete])

  const handleFlip = (card: MemoryCard) => {
    if (isPaused || lockRef.current || completedRef.current) return
    if (matchedPairs[card.pairId] || flipped.includes(card.uid)) return

    playClick()
    speak(card.char)
    const nextFlipped = [...flipped, card.uid]
    setFlipped(nextFlipped)

    if (nextFlipped.length === 2) {
      lockRef.current = true
      totalRef.current += 1
      const c1 = deck.find(c => c.uid === nextFlipped[0])!
      const c2 = deck.find(c => c.uid === nextFlipped[1])!

      if (c1.pairId === c2.pairId) {
        correctRef.current += 1
        playCorrect()
        onAnswer(true, 20)
        const nextMatched = { ...matchedPairs, [c1.pairId]: true }
        setMatchedPairs(nextMatched)
        setHintPairId(null)
        setFlipped([])
        lockRef.current = false

        if (Object.keys(nextMatched).length >= pairCount) {
          completedRef.current = true
          setTimeout(() => {
            onComplete({ correct: correctRef.current, total: Math.max(totalRef.current, pairCount) })
          }, 500)
        }
      } else {
        playWrong()
        onAnswer(false, 0)
        setTimeout(() => {
          setFlipped([])
          lockRef.current = false
        }, 650)
      }
    }
  }

  return (
    <div className="rounded-3xl shadow-2xl border-4 border-pink-400 bg-gradient-to-br from-rose-50 via-pink-50 to-fuchsia-50 p-4 sm:p-6 space-y-5 select-none">
      <div className="bg-white rounded-2xl p-3.5 shadow-sm border border-pink-200 flex flex-col sm:flex-row items-center justify-between gap-3">
        <div>
          <span className="text-[10px] font-black uppercase bg-pink-100 text-pink-700 px-2.5 py-0.5 rounded-full">
            Level 5 • Pairs {matchedCount}/{pairCount}
          </span>
          <h3 className="font-black text-slate-800 text-base mt-1">
            Match Types & Harakat of{' '}
            <span className="font-arabic text-2xl text-pink-600" dir="rtl">
              {letterObj.letter}
            </span>{' '}
            ({letterObj.name_english})
          </h3>
        </div>

        <div className="flex items-center gap-2.5">
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 font-mono font-black text-sm">
            <Clock className="w-4 h-4 text-pink-600" />
            <span className={timeLeft <= 10 ? 'text-rose-600 animate-pulse' : 'text-slate-800'}>
              {timeLeft}s
            </span>
          </div>
          <button
            type="button"
            onClick={() => speak(letterObj.letter)}
            className="p-2 rounded-xl bg-pink-100 text-pink-700 hover:bg-pink-200"
          >
            <Volume2 className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => {
              const first = deck.find(c => !matchedPairs[c.pairId])
              if (first) {
                setHintPairId(first.pairId)
                playStar()
              }
            }}
            className="p-2 rounded-xl bg-amber-100 text-amber-800 hover:bg-amber-200"
          >
            <Lightbulb className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-3 sm:grid-cols-4 gap-3 sm:gap-4 max-w-2xl mx-auto">
        {deck.map(card => {
          const isMatched = Boolean(matchedPairs[card.pairId])
          const isFaceUp = isMatched || flipped.includes(card.uid)
          const isHinted = hintPairId === card.pairId && !isMatched

          return (
            <motion.button
              key={card.uid}
              type="button"
              whileHover={isMatched ? undefined : { scale: 1.04 }}
              whileTap={isMatched ? undefined : { scale: 0.96 }}
              onClick={() => handleFlip(card)}
              className={cn(
                'h-24 sm:h-28 rounded-2xl border-4 flex flex-col items-center justify-center p-2 transition-all shadow-md',
                isMatched
                  ? 'bg-emerald-50 border-emerald-400 text-emerald-800'
                  : isFaceUp
                  ? 'bg-white border-pink-400 text-slate-900'
                  : isHinted
                  ? 'bg-gradient-to-br from-amber-300 to-yellow-400 border-amber-500 animate-pulse text-slate-900'
                  : 'bg-gradient-to-br from-pink-500 to-rose-600 border-white text-white'
              )}
            >
              {isFaceUp ? (
                <>
                  <span className="font-arabic text-3xl sm:text-4xl font-black leading-none" dir="rtl">
                    {card.char}
                  </span>
                  <span className="text-[10px] font-bold text-slate-500 mt-1 truncate max-w-full">
                    {card.label}
                  </span>
                </>
              ) : (
                <span className="text-2xl sm:text-3xl font-black">
                  {isHinted ? '💡' : '🃏'}
                </span>
              )}
            </motion.button>
          )
        })}
      </div>
    </div>
  )
}
