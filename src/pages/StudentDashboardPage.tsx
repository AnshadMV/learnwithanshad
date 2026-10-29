import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Star, BookOpen, Gamepad2, Award, ArrowRight, Clock, CheckCircle2 } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { supabase } from '@/lib/supabase'
import { ARABIC_LETTERS } from '@/data/arabicLetters'
import ArabicText from '@/components/arabic/ArabicText'
import Button from '@/components/ui/Button'
import ProgressBar from '@/components/ui/ProgressBar'

interface ProgressItem {
  letter_id: string
  mastery_level: number
  attempts: number
  correct: number
  completed: boolean
}

interface RecentGame {
  id: string
  game_slug: string
  score: number
  accuracy: number
  created_at: string
}

export default function StudentDashboardPage() {
  const { user, profile } = useAuth()
  const navigate = useNavigate()
  const [progressList, setProgressList] = useState<ProgressItem[]>([])
  const [recentGames, setRecentGames] = useState<RecentGame[]>([])
  const [totalStars, setTotalStars] = useState(0)
  const [totalScore, setTotalScore] = useState(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) return

    async function loadStudentData() {
      setLoading(true)
      try {
        // Fetch progress
        const { data: progData } = await supabase
          .from('student_letter_progress')
          .select('*')
          .eq('student_id', user!.id)

        if (progData) {
          setProgressList(progData)
        }

        // Fetch recent games
        const { data: gamesData } = await supabase
          .from('game_sessions')
          .select('id, game_slug, score, accuracy, created_at')
          .eq('student_id', user!.id)
          .eq('status', 'completed')
          .order('created_at', { ascending: false })
          .limit(5)

        if (gamesData) {
          setRecentGames(gamesData)
          const sumScore = (gamesData as any[]).reduce((acc: number, g: any) => acc + (g.score || 0), 0)
          setTotalScore(sumScore)
          setTotalStars(Math.floor(sumScore / 30) + 3) // initial reward stars
        }
      } catch (err) {
        console.error('Error loading dashboard data:', err)
      } finally {
        setLoading(false)
      }
    }

    loadStudentData()
  }, [user])

  const completedCount = progressList.filter(p => p.completed).length
  const overallMastery = Math.round((completedCount / 28) * 100)

  return (
    <div className="space-y-8 pb-12">
      {/* Welcome Banner */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-3xl p-6 sm:p-8 bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-600 text-white shadow-xl flex flex-col md:flex-row items-center justify-between gap-6 relative overflow-hidden"
      >
        <div className="relative z-10 space-y-2 text-center md:text-left">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/20 backdrop-blur-sm text-xs font-bold uppercase tracking-wider">
            <span>✨ Explorer Level 1</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-black font-display">
            Welcome back, {profile?.display_name || 'Adventurer'}! 🌟
          </h1>
          <p className="text-blue-100 text-sm max-w-lg">
            You are doing fantastic! Pick up right where you left off and discover new letters today.
          </p>
        </div>

        <div className="flex items-center gap-3 relative z-10">
          <Button
            variant="sunny"
            onClick={() => navigate('/alphabet')}
            className="flex items-center gap-2 shadow-lg"
          >
            <BookOpen className="w-5 h-5" />
            <span>Continue Lesson</span>
          </Button>
          <Button
            variant="secondary"
            onClick={() => navigate('/games')}
            className="flex items-center gap-2 bg-white/20 text-white hover:bg-white/30 border-0"
          >
            <Gamepad2 className="w-5 h-5" />
            <span>Play Games</span>
          </Button>
        </div>
      </motion.div>

      {/* Stats Summary */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white rounded-3xl p-5 shadow-card border-2 border-sunny-100 flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-sunny-100 text-sunny-500 flex items-center justify-center text-2xl">
            ⭐
          </div>
          <div>
            <div className="text-xs font-bold text-gray-400 uppercase">Total Stars</div>
            <div className="text-2xl font-black text-gray-800">{totalStars}</div>
          </div>
        </div>

        <div className="bg-white rounded-3xl p-5 shadow-card border-2 border-blue-100 flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-blue-100 text-brand-blue flex items-center justify-center text-2xl">
            📚
          </div>
          <div>
            <div className="text-xs font-bold text-gray-400 uppercase">Mastered</div>
            <div className="text-2xl font-black text-gray-800">{completedCount} / 28</div>
          </div>
        </div>

        <div className="bg-white rounded-3xl p-5 shadow-card border-2 border-emerald-100 flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-brand-green flex items-center justify-center text-2xl">
            🏆
          </div>
          <div>
            <div className="text-xs font-bold text-gray-400 uppercase">Total Score</div>
            <div className="text-2xl font-black text-gray-800">{totalScore}</div>
          </div>
        </div>

        <div className="bg-white rounded-3xl p-5 shadow-card border-2 border-purple-100 flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-purple-100 text-purple-600 flex items-center justify-center text-2xl">
            🎯
          </div>
          <div>
            <div className="text-xs font-bold text-gray-400 uppercase">Progress</div>
            <div className="text-2xl font-black text-gray-800">{overallMastery}%</div>
          </div>
        </div>
      </div>

      {/* 28 Letters Progress Journey */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-card space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-gray-800">Alphabet Journey (28 Letters)</h2>
            <p className="text-xs text-gray-400">Click any letter to practice its pronunciation and games</p>
          </div>
          <Link
            to="/student/progress"
            className="text-xs font-bold text-brand-blue hover:underline flex items-center gap-1"
          >
            <span>Detailed Report</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="grid grid-cols-4 sm:grid-cols-7 md:grid-cols-14 gap-2.5 pt-2">
          {ARABIC_LETTERS.map(letter => {
            const prog = progressList.find(p => p.letter_id === letter.id)
            const isCompleted = prog?.completed
            return (
              <button
                key={letter.id}
                onClick={() => navigate(`/letter/${letter.id}`)}
                className={`p-3 rounded-2xl border-2 flex flex-col items-center justify-center transition-all hover:scale-105 active:scale-95 ${
                  isCompleted
                    ? 'bg-emerald-50 border-emerald-400 text-emerald-700 shadow-sm'
                    : 'bg-gray-50 border-gray-200 text-gray-700 hover:border-blue-300'
                }`}
              >
                <span className="font-arabic text-2xl font-bold leading-none">{letter.letter}</span>
                <span className="text-[10px] font-bold text-gray-400 mt-1">{letter.name_english}</span>
                {isCompleted && (
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 mt-1" />
                )}
              </button>
            )
          })}
        </div>
      </div>

      {/* Recent Games */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-card space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-800">Recent Adventures 🎮</h2>
          <Link
            to="/games"
            className="text-xs font-bold text-brand-blue hover:underline flex items-center gap-1"
          >
            <span>All 24 Games</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {recentGames.length === 0 ? (
          <div className="p-8 text-center text-gray-400 text-sm">
            <span className="text-3xl block mb-2">🎈</span>
            No games played yet. Let's play your first game!
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {recentGames.map(game => (
              <div key={game.id} className="py-3 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-50 text-brand-blue flex items-center justify-center text-lg">
                    🎮
                  </div>
                  <div>
                    <div className="text-sm font-bold text-gray-800 capitalize">
                      {game.game_slug.replace('-', ' ')}
                    </div>
                    <div className="text-xs text-gray-400">
                      Score: <span className="font-bold text-brand-blue">{game.score} pts</span> • Accuracy: {game.accuracy}%
                    </div>
                  </div>
                </div>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => navigate(`/games/${game.game_slug}`)}
                  className="text-xs text-brand-blue font-bold"
                >
                  Play again
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
