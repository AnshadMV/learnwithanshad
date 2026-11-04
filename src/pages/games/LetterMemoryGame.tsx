import { useState, useMemo } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowLeft, Sparkles, Volume2 } from 'lucide-react'
import { ARABIC_LETTERS, getLetterById } from '@/data/arabicLetters'
import { getLetterMemoryPairs } from '@/data/letterVariants'
import { getKidCardTheme } from '@/data/kidColorThemes'
import { useSound } from '@/hooks/useSound'
import { useConfetti } from '@/hooks/useConfetti'
import { useArabicSpeech } from '@/hooks/useArabicSpeech'
import { useGameSession } from '@/hooks/useGameSession'
import GameComplete from '@/components/game/GameComplete'
import Button from '@/components/ui/Button'
import ArabicText from '@/components/arabic/ArabicText'
import LetterScopeBanner from '@/components/game/LetterScopeBanner'
import type { GameResult } from '@/types'
import { shuffleArray, pickRandom } from '@/lib/utils'

interface MemoryCard {
  uid: string
  pairKey: string
  letterChar: string
  variantName: string
  arabicName?: string
  themeIdx: number
  flipped: boolean
  matched: boolean
}

export default function LetterMemoryGame() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const paramLetter = searchParams.get('letter')

  const targetLetterObj = useMemo(() => {
    return paramLetter ? getLetterById(paramLetter) || null : null
  }, [paramLetter])

  const { playCorrect, playWrong, playClick, playStar } = useSound()
  const { celebrate } = useConfetti()
  const { speak } = useArabicSpeech()
  const { score, recordAnswer, completeGame, startGame } = useGameSession({
    gameSlug: 'memory-cards',
    letterId: paramLetter || undefined,
  })

  const [gameState, setGameState] = useState<'intro' | 'playing' | 'completed'>('intro')
  const [cards, setCards] = useState<MemoryCard[]>([])
  const [flippedUids, setFlippedUids] = useState<string[]>([])
  const [busy, setBusy] = useState(false)
  const [result, setResult] = useState<GameResult | null>(null)

  const handleStart = () => {
    startGame()
    const list: MemoryCard[] = []

    if (paramLetter) {
      // LETTER-SPECIFIC MODE:
      // Exclusively use 6 distinct types / forms / harakat of the selected letter!
      const variants = getLetterMemoryPairs(paramLetter)

      variants.forEach((v, vIdx) => {
        list.push({
          uid: `${v.id}_a`,
          pairKey: v.id,
          letterChar: v.char,
          variantName: v.name,
          arabicName: v.arabicName,
          themeIdx: vIdx,
          flipped: false,
          matched: false,
        })
        list.push({
          uid: `${v.id}_b`,
          pairKey: v.id,
          letterChar: v.char,
          variantName: v.name,
          arabicName: v.arabicName,
          themeIdx: vIdx,
          flipped: false,
          matched: false,
        })
      })
    } else {
      // General Alphabet Mode: 6 distinct letters
      const chosenLetters = pickRandom(ARABIC_LETTERS, 6)
      chosenLetters.forEach((l, lIdx) => {
        list.push({
          uid: `${l.id}_a`,
          pairKey: l.id,
          letterChar: l.letter,
          variantName: l.name_english,
          arabicName: l.name_arabic,
          themeIdx: lIdx,
          flipped: false,
          matched: false,
        })
        list.push({
          uid: `${l.id}_b`,
          pairKey: l.id,
          letterChar: l.letter,
          variantName: l.name_english,
          arabicName: l.name_arabic,
          themeIdx: lIdx,
          flipped: false,
          matched: false,
        })
      })
    }

    setCards(shuffleArray(list))
    setFlippedUids([])
    setBusy(false)
    setGameState('playing')
  }

  const handleCardClick = (card: MemoryCard) => {
    if (busy || card.flipped || card.matched || flippedUids.length >= 2) return

    playClick()
    speak(card.letterChar)

    const nextFlipped = [...flippedUids, card.uid]
    setFlippedUids(nextFlipped)

    setCards(prev =>
      prev.map(c => (c.uid === card.uid ? { ...c, flipped: true } : c))
    )

    if (nextFlipped.length === 2) {
      setBusy(true)
      const firstCard = cards.find(c => c.uid === nextFlipped[0])!
      const isMatch = firstCard.pairKey === card.pairKey

      setTimeout(async () => {
        if (isMatch) {
          playCorrect()
          playStar()
          celebrate()
          recordAnswer(true, 15)
          const updatedCards = cards.map(c =>
            c.pairKey === card.pairKey ? { ...c, matched: true, flipped: true } : c
          )
          setCards(updatedCards)

          // Check if all matched
          const remaining = updatedCards.filter(c => !c.matched).length
          if (remaining === 0) {
            const res = await completeGame()
            setResult(res)
            setGameState('completed')
          }
        } else {
          playWrong()
          recordAnswer(false, 0)
          setCards(prev =>
            prev.map(c =>
              nextFlipped.includes(c.uid) ? { ...c, flipped: false } : c
            )
          )
        }
        setFlippedUids([])
        setBusy(false)
      }, 950)
    }
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6 pb-12">
      {/* Top bar */}
      <div className="flex items-center justify-between">
        <Button
          variant="secondary"
          size="sm"
          onClick={() => navigate(paramLetter ? `/letter/${paramLetter}` : '/games')}
          className="flex items-center gap-1.5"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>{paramLetter ? 'Back to Letter' : 'Arcade Home'}</span>
        </Button>
        <div className="text-sm font-bold text-gray-500">
          Score: <span className="text-brand-blue font-black text-lg">{score}</span>
        </div>
      </div>

      {/* Letter Scope Banner */}
      <LetterScopeBanner currentLetterId={paramLetter} gameSlug="memory-cards" />

      {gameState === 'intro' && (
        <div className="bg-white rounded-3xl p-8 shadow-card text-center space-y-6">
          <div className="w-20 h-20 mx-auto rounded-3xl bg-red-100 text-red-600 flex items-center justify-center text-4xl shadow-sm">
            🃏
          </div>
          <div>
            <h1 className="text-3xl font-black text-gray-800 font-display">
              Memory Cards Match
            </h1>
            {targetLetterObj ? (
              <div className="mt-2 space-y-1">
                <p className="text-brand-blue font-black text-lg">
                  Letter {targetLetterObj.name_english} Pairs ({targetLetterObj.name_arabic})
                </p>
                <p className="text-gray-500 text-sm max-w-md mx-auto">
                  Find matching pairs of different forms, vowel harakat (fathah, kasrah, dammah, maddah), and shapes of letter <strong>{targetLetterObj.name_english}</strong>!
                </p>
              </div>
            ) : (
              <p className="text-gray-500 text-sm mt-2 max-w-md mx-auto">
                Flip the cards to discover matching Arabic letters! Can you match all 6 pairs with laser focus?
              </p>
            )}
          </div>
          <Button variant="coral" onClick={handleStart} className="px-8 py-3.5 text-base">
            Start Memory Challenge! 🚀
          </Button>
        </div>
      )}

      {gameState === 'playing' && (
        <div className="space-y-4">
          <div className="text-center text-xs font-bold text-gray-500">
            {targetLetterObj ? (
              <span>
                Matching different forms & vowels of{' '}
                <strong className="text-brand-blue">{targetLetterObj.name_english}</strong>!
              </span>
            ) : (
              <span>Tap two cards to find matching Arabic letters!</span>
            )}
          </div>

          <div className="grid grid-cols-3 sm:grid-cols-4 gap-3 sm:gap-4">
            {cards.map(card => {
              const theme = getKidCardTheme(card.themeIdx)
              const isVisible = card.flipped || card.matched

              return (
                <motion.div
                  key={card.uid}
                  whileHover={!card.matched ? { scale: 1.05 } : {}}
                  whileTap={!card.matched ? { scale: 0.95 } : {}}
                  onClick={() => handleCardClick(card)}
                  className={`h-32 sm:h-36 rounded-3xl border-4 flex flex-col items-center justify-center text-center cursor-pointer select-none transition-all shadow-card ${
                    card.matched
                      ? 'bg-emerald-500 text-white border-emerald-400 opacity-95 scale-95 shadow-md ring-4 ring-emerald-300'
                      : isVisible
                      ? `${theme.bg} ${theme.border} ${theme.text} shadow-xl ring-2 ${theme.ring}`
                      : `bg-gradient-to-br ${theme.gradient} text-white border-white/70 hover:border-white hover:shadow-xl`
                  }`}
                >
                  {isVisible ? (
                    <div className="flex flex-col items-center justify-center px-1">
                      <ArabicText
                        size="3xl"
                        weight="bold"
                        className={`text-4xl sm:text-5xl font-black ${card.matched ? 'text-white' : theme.text}`}
                      >
                        {card.letterChar}
                      </ArabicText>
                      <span className={`text-xs font-black mt-1 line-clamp-1 max-w-[95%] ${card.matched ? 'text-white/90' : 'text-gray-700'}`}>
                        {card.variantName}
                      </span>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center gap-1">
                      <span className="text-3xl sm:text-4xl drop-shadow-sm">🌟</span>
                      <span className="text-[11px] font-black uppercase tracking-wider text-white drop-shadow">
                        {targetLetterObj ? targetLetterObj.letter : 'CARD'}
                      </span>
                    </div>
                  )}
                </motion.div>
              )
            })}
          </div>
        </div>
      )}

      {gameState === 'completed' && result && (
        <GameComplete
          result={result}
          onReplay={handleStart}
          onHome={() => navigate(paramLetter ? `/letter/${paramLetter}` : '/games')}
        />
      )}
    </div>
  )
}
