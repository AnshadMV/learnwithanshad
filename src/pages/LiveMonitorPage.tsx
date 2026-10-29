import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Radio,
  Share2,
  Users,
  Activity,
  Clock,
  ArrowLeft,
  RefreshCw,
  Copy,
  Check,
  Sparkles,
  Trophy,
} from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/hooks/useAuth'
import Button from '@/components/ui/Button'
import Modal from '@/components/ui/Modal'
import ArabicText from '@/components/arabic/ArabicText'

interface LiveStudent {
  student_id: string
  display_name: string
  current_game: string | null
  current_letter: string | null
  score: number
  accuracy: number
  questions_completed: number
  status: 'playing' | 'idle' | 'completed'
  last_heartbeat: string
}

export default function LiveMonitorPage() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const roomCode = searchParams.get('room') || 'ARABIC-101'

  const [liveStudents, setLiveStudents] = useState<LiveStudent[]>([])
  const [loading, setLoading] = useState(true)
  const [lastRefreshed, setLastRefreshed] = useState<Date>(new Date())
  const [shareModalOpen, setShareModalOpen] = useState(false)
  const [copied, setCopied] = useState(false)
  const [recentBroadcastNotice, setRecentBroadcastNotice] = useState<string | null>(null)

  // Seed demo items initially so screen has rich context immediately
  useEffect(() => {
    setLiveStudents([
      {
        student_id: 'demo_1',
        display_name: 'Zaid Explorer',
        current_game: 'letter-safari',
        current_letter: 'ba',
        score: 60,
        accuracy: 90,
        questions_completed: 6,
        status: 'playing',
        last_heartbeat: new Date().toISOString(),
      },
      {
        student_id: 'demo_2',
        display_name: 'Amina Noor',
        current_game: 'balloon-pop',
        current_letter: 'jeem',
        score: 80,
        accuracy: 95,
        questions_completed: 8,
        status: 'completed',
        last_heartbeat: new Date().toISOString(),
      },
    ])
    setLoading(false)
  }, [])

  // Setup Supabase Realtime Broadcast & Postgres listeners
  useEffect(() => {
    // 1. Subscribe to Live Broadcast Channel for instantaneous cross-tab/device sync
    const liveChannel = supabase
      .channel('classroom_live_share', {
        config: { broadcast: { self: true } },
      })
      .on('broadcast', { event: 'student_activity' }, ({ payload }) => {
        if (!payload) return

        setLiveStudents(prev => {
          const existingIdx = prev.findIndex(s => s.student_id === payload.student_id)
          const updatedItem: LiveStudent = {
            student_id: payload.student_id,
            display_name: payload.display_name,
            current_game: payload.game_slug,
            current_letter: payload.letter_id,
            score: payload.score,
            accuracy: payload.accuracy,
            questions_completed: payload.questions_completed,
            status: payload.status,
            last_heartbeat: payload.timestamp || new Date().toISOString(),
          }

          if (existingIdx !== -1) {
            const next = [...prev]
            next[existingIdx] = updatedItem
            return next
          } else {
            return [updatedItem, ...prev]
          }
        })

        setRecentBroadcastNotice(`⚡ ${payload.display_name} just scored in ${payload.game_slug}!`)
        setTimeout(() => setRecentBroadcastNotice(null), 3000)
        setLastRefreshed(new Date())
      })
      .subscribe()

    // 2. Also listen to database postgres_changes if table exists
    const dbChannel = supabase
      .channel('db_sessions_feed')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'game_sessions' }, () => {
        setLastRefreshed(new Date())
      })
      .subscribe()

    return () => {
      supabase.removeChannel(liveChannel)
      supabase.removeChannel(dbChannel)
    }
  }, [])

  const handleCopyShareLink = () => {
    const shareUrl = `${window.location.origin}/teacher/live?room=${roomCode}`
    navigator.clipboard.writeText(shareUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2500)
  }

  return (
    <div className="space-y-6 pb-12">
      {/* Top Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => navigate('/teacher/dashboard')}
            className="flex items-center gap-1.5"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Dashboard</span>
          </Button>
          <div>
            <div className="flex items-center gap-2">
              <span className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-rose-500"></span>
              </span>
              <h1 className="text-2xl font-black text-gray-800">Live Learning Monitor</h1>
            </div>
            <p className="text-xs text-gray-400">
              Live broadcast feed active • Room: <strong className="text-brand-blue">{roomCode}</strong>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="primary"
            size="sm"
            onClick={() => setShareModalOpen(true)}
            className="flex items-center gap-2 shadow-sm"
          >
            <Share2 className="w-4 h-4" />
            <span>Share Live Room</span>
          </Button>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => setLastRefreshed(new Date())}
            className="flex items-center gap-1.5"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Refresh</span>
          </Button>
        </div>
      </div>

      {/* Broadcast Toast Notification */}
      <AnimatePresence>
        {recentBroadcastNotice && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="p-3 rounded-2xl bg-gradient-to-r from-blue-500 to-indigo-600 text-white text-xs font-bold shadow-lg flex items-center justify-between"
          >
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-sunny-400 animate-spin" />
              <span>{recentBroadcastNotice}</span>
            </div>
            <span className="text-[10px] text-blue-200 uppercase tracking-wider">Live Broadcast</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Classroom Activity Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {liveStudents.map(student => (
          <motion.div
            key={student.student_id}
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-3xl p-6 shadow-card border-2 border-blue-50 hover:border-blue-200 transition-all space-y-4"
          >
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-sky text-brand-blue font-extrabold flex items-center justify-center text-lg shadow-sm">
                  {student.display_name.charAt(0)}
                </div>
                <div>
                  <h3 className="font-bold text-gray-800">{student.display_name}</h3>
                  <div className="flex items-center gap-1.5 text-xs">
                    <span
                      className={`inline-block w-2 h-2 rounded-full ${
                        student.status === 'playing' ? 'bg-emerald-500 animate-pulse' : 'bg-gray-400'
                      }`}
                    />
                    <span className="capitalize font-semibold text-gray-500">
                      {student.status === 'playing' ? 'Active Now' : 'Session Completed'}
                    </span>
                  </div>
                </div>
              </div>

              {student.current_letter && (
                <div className="text-center px-3 py-1.5 rounded-2xl bg-blue-50 border border-blue-100">
                  <span className="text-[10px] font-bold text-gray-400 block uppercase">Letter</span>
                  <span className="font-arabic font-bold text-brand-blue text-lg">
                    {student.current_letter}
                  </span>
                </div>
              )}
            </div>

            <div className="bg-sky/60 rounded-2xl p-4 space-y-2">
              <div className="flex items-center justify-between text-xs font-semibold text-gray-500">
                <span>Current Game:</span>
                <span className="text-brand-blue font-bold capitalize">
                  {student.current_game ? student.current_game.replace('-', ' ') : 'Alphabet Lesson'}
                </span>
              </div>
              <div className="flex items-center justify-between text-xs font-semibold text-gray-500">
                <span>Score:</span>
                <span className="text-emerald-600 font-extrabold text-sm">{student.score} pts</span>
              </div>
              <div className="flex items-center justify-between text-xs font-semibold text-gray-500">
                <span>Accuracy:</span>
                <span className="text-purple-600 font-extrabold text-sm">{student.accuracy}%</span>
              </div>
            </div>

            <div className="text-[11px] text-gray-400 flex items-center justify-between pt-2 border-t border-gray-100">
              <span className="flex items-center gap-1">
                <Clock className="w-3.5 h-3.5" /> Live websocket active
              </span>
              <span>Updated {new Date(student.last_heartbeat).toLocaleTimeString()}</span>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Share Live Room Modal */}
      <Modal
        open={shareModalOpen}
        onClose={() => setShareModalOpen(false)}
        title="Share Live Classroom"
      >
        <div className="space-y-5">
          <p className="text-gray-500 text-sm">
            Share this live broadcast session with assistants, classroom displays, or parents to watch student learning progress in real-time.
          </p>

          <div className="p-4 rounded-2xl bg-sky border border-blue-100 space-y-2">
            <span className="text-xs font-bold text-gray-500 uppercase tracking-wider block">
              Classroom Live Room Code
            </span>
            <div className="font-mono text-2xl font-black text-brand-blue tracking-wider">
              {roomCode}
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase mb-1.5">
              Live Monitor Link
            </label>
            <div className="flex items-center gap-2">
              <input
                type="text"
                readOnly
                value={`${window.location.origin}/teacher/live?room=${roomCode}`}
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 bg-gray-50 text-xs font-mono text-gray-600 focus:outline-none"
              />
              <Button
                variant={copied ? 'success' : 'primary'}
                size="sm"
                onClick={handleCopyShareLink}
                className="shrink-0 flex items-center gap-1"
              >
                {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                <span>{copied ? 'Copied!' : 'Copy'}</span>
              </Button>
            </div>
          </div>

          <div className="pt-2 text-xs text-gray-400">
            💡 Students playing on tablets automatically broadcast their progress to this room without any manual setup.
          </div>
        </div>
      </Modal>
    </div>
  )
}
