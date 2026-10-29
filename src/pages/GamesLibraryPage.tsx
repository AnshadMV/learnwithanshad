import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Sparkles, Gamepad2, Search } from 'lucide-react'
import GameCard, { GameCardInfo } from '@/components/game/GameCard'
import { cn } from '@/lib/utils'

export const ALL_GAMES: GameCardInfo[] = [
  // Recognition
  { slug: 'letter-safari', name: 'Letter Safari', description: 'Spot and collect the requested Arabic letter hidden in the safari grid!', category: 'Recognition', icon: '🔍', color: '#4285F4' },
  { slug: 'letter-picture-match', name: 'Picture Match', description: 'Match letters with their lovely pictures and starter sounds!', category: 'Recognition', icon: '🎯', color: '#34A853' },
  { slug: 'find-different', name: 'Find the Different Letter', description: 'Look closely and identify the odd letter in the group!', category: 'Recognition', icon: '🕵️', color: '#FBBC05' },
  { slug: 'memory-cards', name: 'Memory Cards', description: 'Flip pairs of colorful cards to find matching Arabic letters!', category: 'Recognition', icon: '🃏', color: '#EA4335' },
  { slug: 'letter-detective', name: 'Letter Detective', description: 'Count how many target letters are hiding in a mystery line!', category: 'Recognition', icon: '🔎', color: '#8B5CF6' },
  { slug: 'letter-bingo', name: 'Letter Bingo', description: 'Listen to the letter call and mark your card to shout Bingo!', category: 'Recognition', icon: '🎱', color: '#EC4899' },

  // Writing & Forms
  { slug: 'trace-letter', name: 'Trace the Letter', description: 'Follow guided strokes on a digital canvas to write Arabic letters!', category: 'Writing', icon: '✏️', color: '#4285F4' },
  { slug: 'connect-dots', name: 'Connect the Dots', description: 'Follow numbered dots in order to draw and reveal letter shapes!', category: 'Writing', icon: '🔵', color: '#34A853' },
  { slug: 'build-letter', name: 'Build the Letter', description: 'Place the pieces together and assemble letter parts into whole letters!', category: 'Writing', icon: '🧩', color: '#FBBC05' },
  { slug: 'shape-match', name: 'Letter Shape Match', description: 'Match isolated, initial, medial, and final forms of each letter!', category: 'Writing', icon: '🔷', color: '#EA4335' },
  { slug: 'complete-word', name: 'Complete the Word', description: 'Fill in the missing letter to complete illustrated Arabic words!', category: 'Writing', icon: '📝', color: '#8B5CF6' },
  { slug: 'letter-puzzle', name: 'Arabic Letter Puzzle', description: 'Rearrange scrambled tiles to reassemble the target Arabic letter!', category: 'Writing', icon: '🧸', color: '#EC4899' },

  // Listening & Vocabulary
  { slug: 'listen-choose', name: 'Listen and Choose', description: 'Listen to the authentic pronunciation and pick the correct letter!', category: 'Listening', icon: '👂', color: '#4285F4' },
  { slug: 'sound-safari', name: 'Sound Safari', description: 'Identify which friendly animal or item begins with the target sound!', category: 'Listening', icon: '🎵', color: '#34A853' },
  { slug: 'picture-hunt', name: 'Picture Hunt', description: 'Find pictures and objects whose Arabic names contain the letter!', category: 'Listening', icon: '🖼️', color: '#FBBC05' },
  { slug: 'word-builder', name: 'Word Builder', description: 'Drag and arrange Arabic letter blocks in order to form vocabulary words!', category: 'Listening', icon: '🔤', color: '#EA4335' },
  { slug: 'listen-match', name: 'Listen and Match', description: 'Listen to spoken Arabic vocabulary and match it to its picture!', category: 'Listening', icon: '🎤', color: '#8B5CF6' },
  { slug: 'position-game', name: 'Beginning, Middle, or End?', description: 'Where is the letter hiding in this word? Choose its position!', category: 'Listening', icon: '📍', color: '#EC4899' },

  // Arcade & Challenge
  { slug: 'balloon-pop', name: 'Letter Balloon Pop', description: 'Pop floating balloons carrying the target letter before time runs out!', category: 'Arcade', icon: '🎈', color: '#4285F4' },
  { slug: 'letter-fishing', name: 'Letter Fishing', description: 'Hook and catch the swimming fish that carry the requested letter!', category: 'Arcade', icon: '🎣', color: '#34A853' },
  { slug: 'treasure-chest', name: 'Treasure Chest Challenge', description: 'Solve quick questions to unlock locks and reveal sparkling pirate treasure!', category: 'Arcade', icon: '🏆', color: '#FBBC05' },
  { slug: 'rocket-race', name: 'Rocket Letter Race', description: 'Fuel your rocket by answering correctly and race to the moon!', category: 'Arcade', icon: '🚀', color: '#EA4335' },
  { slug: 'letter-catcher', name: 'Letter Catcher', description: 'Move your basket to catch falling letters and avoid distractions!', category: 'Arcade', icon: '🤸', color: '#8B5CF6' },
  { slug: 'daily-quest', name: 'Daily Letter Quest', description: 'Complete a special daily sequence of four challenges for stars!', category: 'Arcade', icon: '⭐', color: '#EC4899' },
]

const CATEGORIES = ['All', 'Recognition', 'Writing', 'Listening', 'Arcade']

export default function GamesLibraryPage() {
  const [selectedCategory, setSelectedCategory] = useState('All')
  const [searchQuery, setSearchQuery] = useState('')
  const navigate = useNavigate()

  const filteredGames = useMemo(() => {
    return ALL_GAMES.filter(g => {
      if (selectedCategory !== 'All' && g.category !== selectedCategory) return false
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim()
        return g.name.toLowerCase().includes(q) || g.description.toLowerCase().includes(q)
      }
      return true
    })
  }, [selectedCategory, searchQuery])

  return (
    <div className="space-y-8 pb-12">
      {/* Header */}
      <div className="text-center max-w-2xl mx-auto space-y-3">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-100 text-brand-green font-bold text-sm">
          <Gamepad2 className="w-4 h-4" />
          <span>24 Distinct Educational Games</span>
        </div>
        <h1 className="text-4xl sm:text-5xl font-black text-[#243247] font-display">
          Educational Games Arcade 🎮
        </h1>
        <p className="text-gray-600 text-lg">
          Master Arabic letters through playful games, puzzles, racing, and treasure quests!
        </p>
      </div>

      {/* Categories & Search */}
      <div className="bg-white rounded-3xl p-6 shadow-card space-y-4">
        <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
          {/* Category Tabs */}
          <div className="flex gap-2 overflow-x-auto w-full sm:w-auto pb-2 sm:pb-0">
            {CATEGORIES.map(cat => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={cn(
                  'px-5 py-2.5 rounded-2xl font-bold text-sm transition-all whitespace-nowrap',
                  selectedCategory === cat
                    ? 'bg-brand-blue text-white shadow-md'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                )}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Search */}
          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search games..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 text-sm rounded-xl border border-gray-200 focus:outline-none focus:border-brand-blue"
            />
          </div>
        </div>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {filteredGames.map((game, idx) => (
          <motion.div
            key={game.slug}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: Math.min(idx * 0.03, 0.4) }}
          >
            <GameCard
              game={game}
              onClick={() => navigate(`/games/${game.slug}`)}
            />
          </motion.div>
        ))}
      </div>
    </div>
  )
}
