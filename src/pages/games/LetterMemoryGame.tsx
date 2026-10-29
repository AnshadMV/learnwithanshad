import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowLeft } from 'lucide-react'
import { ARABIC_LETTERS } from '@/data/arabicLetters'
import { useSound } from '@/hooks/useSound'
import { useGameSession } from '@/hooks/useGameSession'
import GameComplete from '@/components/game/GameComplete'
import Button from '@/components/ui/Button'
import ArabicText from '@/components/arabic/ArabicText'
import type { GameResult } from '@/types'
import { shuffleArray, pickRandom } from '@/lib/utils'

interface MemoryCard {
  uid: string
  letterId: string
  letterChar: string
  flipped: boolean
  matched: boolean
}

export default function LetterMemoryGame() {
  const navigate = useNavigate()
  const { playCorrect, playWrong, playClick } = useSound()
  const { score, recordAnswer, completeGame, startGame } = useGameSession({
    gameSlug: 'memory-cards',
  })

  const [gameState, setGameState] = useState<'intro' | 'playing' | 'completed'>('intro')
  const [cards, setCards] = useState<MemoryCard[]>([])
  const [flippedUids, setFlippedUids] = useState<string[]>([])
  const [busy, setBusy] = useState(false)
  const [result, setResult] = useState<GameResult | null>(null)

  const handleStart = () => {
    startGame()
    // 6 pairs = 12 cards total for kids
    const chosenLetters = pickRandom(ARABIC_LETTERS, 6)
    const list: MemoryCard[] = []

    chosenLetters.forEach((l, idx) => {
      list.push({
        uid: `${l.id}_a`,
        letterId: l.id,
        letterChar: l.letter,
        flipped: false,
        matched: false,
      })
      list.push({
        uid: `${l.id}_b`,
        letterId: l.id,
        letterChar: l.letter,
        flipped: false,
        matched: false,
      })
    })

    setCards(shuffleArray(list))
    setFlippedUids([])
    setBusy(false)
    setGameState('playing')
  }

  const handleCardClick = (card: MemoryCard) => {
    if (busy || card.flipped || card.matched || flippedUids.length >= 2) return

    playClick()
    const nextFlipped = [...flippedUids, card.uid]
    setFlippedUids(nextFlipped)

    setCards(prev =>
      prev.map(c => (c.uid === card.uid ? { ...c, flipped: true } : c))
    )

    if (nextFlipped.length === 2) {
      setBusy(true)
      const firstCard = cards.find(c => c.uid === nextFlipped[0])!
      const isMatch = firstCard.letterId === card.letterId

      setTimeout(async () => {
        if (isMatch) {
          playCorrect()
          recordAnswer(true, 15)
          const updatedCards = cards.map(c =>
            c.letterId === card.letterId ? { ...c, matched: true } : c
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
      }, 900)
    }
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6 pb-12">
      <div className="flex items-center justify-between">
        <Button
          variant="secondary"
          size="sm"
          onClick={() => navigate('/games')}
          className="flex items-center gap-1.5"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Arcade Home</span>
        </Button>
        <div className="text-sm font-bold text-gray-500">
          Score: <span className="text-brand-blue font-black text-lg">{score}</span>
        </div>
      </div>

      {gameState === 'intro' && (
        <div className="bg-white rounded-3xl p-8 shadow-card text-center space-y-6">
          <div className="w-20 h-20 mx-auto rounded-3xl bg-rose-100 text-rose-500 flex items-center justify-center text-4xl shadow-sm">
            🃏
          </div>
          <div>
            <h1 className="text-3xl font-black text-gray-800 font-display">
              Letter Memory Cards
            </h1>
            <p className="text-gray-500 text-sm mt-2 max-w-md mx-auto">
              Flip the cards over and find matching pairs of Arabic letters!
            </p>
          </div>
          <Button variant="coral" onClick={handleStart} className="px-8 py-3.5 text-base">
            Start Memory Game! 🧠
          </Button>
        </div>
      )}

      {gameState === 'playing' && (
        <div className="space-y-4">
          <div className="text-center font-bold text-gray-600 text-sm">
            Find all 6 pairs! Click cards to reveal letters.
          </div>

          <div className="grid grid-cols-3 sm:grid-cols-4 gap-3 sm:gap-4">
            {cards.map(card => {
              const isOpen = card.flipped || card.matched

              return (
                <motion.button
                  key={card.uid}
                  whileHover={!isOpen ? { scale: 1.05 } : {}}
                  whileTap={!isOpen ? { scale: 0.95 } : {}}
                  onClick={() => handleCardClick(card)}
                  className={`h-28 sm:h-32 rounded-3xl border-4 text-center flex items-center justify-center shadow-card transition-all select-none ${
                    card.matched
                      ? 'bg-emerald-100 border-emerald-400 text-emerald-700'
                      : isOpen
                      ? 'bg-white border-brand-blue shadow-lg'
                      : 'bg-gradient-to-br from-blue-400 to-indigo-600 border-white text-white cursor-pointer hover:shadow-xl'
                  }`}
                >
                  {isOpen ? (
                    <ArabicText size="3xl" weight="bold" className="text-brand-blue">
                      {card.letterChar}
                    </ArabicText>
                  ) : (
                    <span className="text-3xl">🌟</span>
                  )}
                </motion.button>
              )
            })}
          </div>
        </div>
      )}

      {gameState === 'completed' && result && (
        <GameComplete
          result={result}
          onReplay={handleStart}
          onHome={() => navigate('/games')}
        />
      )}
    </div>
  )
}
