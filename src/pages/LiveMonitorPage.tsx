import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Radio, Users, Activity, Clock, ArrowLeft, RefreshCw, CheckCircle2 } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/hooks/useAuth'
import Button from '@/components/ui/Button'
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
  const [liveStudents, setLiveStudents] = useState<LiveStudent[]>([])
  const [loading, setLoading] = useState(true)
  const [lastRefreshed, setLastRefreshed] = useState<Date>(new Date())

  const fetchActiveSessions = async () => {
    try {
      // 1. Fetch recent activity events & active game sessions
      const { data: sessions } = await supabase
        .from('game_sessions')
        .select(`
          id,
          student_id,
          game_slug,
          letter_id,
          score,
          accuracy,
          questions_correct,
          questions_total,
          status,
          created_at
        `)
        .order('created_at', { ascending: false })
        .limit(20)

      // 2. Fetch student names
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, display_name')
        .eq('role', 'student')

      const profileMap: Record<string, string> = {}
      profiles?.forEach((p: any) => {
        profileMap[p.id] = p.display_name
      })

      if (sessions && sessions.length > 0) {
        const studentMap: Record<string, LiveStudent> = {}

        sessions.forEach((s: any) => {
          if (!studentMap[s.student_id]) {
            studentMap[s.student_id] = {
              student_id: s.student_id,
              display_name: profileMap[s.student_id] || 'Student ' + s.student_id.slice(0, 4),
              current_game: s.game_slug,
              current_letter: s.letter_id,
              score: s.score || 0,
              accuracy: s.accuracy || 0,
              questions_completed: s.questions_correct || 0,
              status: s.status === 'in_progress' ? 'playing' : 'completed',
              last_heartbeat: s.created_at,
            }
          }
        })

        setLiveStudents(Object.values(studentMap))
      } else {
        // Fallback demo row so teachers see interface clearly
        setLiveStudents([
          {
            student_id: 'demo_1',
            display_name: 'Zaid (Demo Explorer)',
            current_game: 'letter-safari',
            current_letter: 'ba',
            score: 70,
            accuracy: 90,
            questions_completed: 7,
            status: 'playing',
            last_heartbeat: new Date().toISOString(),
          },
          {
            student_id: 'demo_2',
            display_name: 'Amina (Demo Explorer)',
            current_game: 'balloon-pop',
            current_letter: 'jeem',
            score: 90,
            accuracy: 95,
            questions_completed: 9,
            status: 'completed',
            last_heartbeat: new Date().toISOString(),
          },
        ])
      }
      setLastRefreshed(new Date())
    } catch (err) {
      console.error('Error fetching live monitoring data:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchActiveSessions()

    // Setup Supabase Realtime channel for live updates
    const channel = supabase
      .channel('classroom_activity_feed')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'game_sessions' },
        payload => {
          fetchActiveSessions()
        }
      )
      .subscribe()

    // 15-second heartbeat poll
    const interval = setInterval(fetchActiveSessions, 15000)

    return () => {
      supabase.removeChannel(channel)
      clearInterval(interval)
    }
  }, [])

  return (
    <div className="space-y-6 pb-12">
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
              Live updates via Supabase Realtime • Last synced: {lastRefreshed.toLocaleTimeString()}
            </p>
          </div>
        </div>

        <Button
          variant="secondary"
          size="sm"
          onClick={fetchActiveSessions}
          className="flex items-center gap-2"
        >
          <RefreshCw className="w-4 h-4" />
          <span>Refresh</span>
        </Button>
      </div>

      {/* Classroom Grid */}
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
                <div className="w-12 h-12 rounded-2xl bg-sky text-brand-blue font-extrabold flex items-center justify-center text-lg">
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
                      {student.status === 'playing' ? 'Active Now' : 'Finished Session'}
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
                <span>Current Activity:</span>
                <span className="text-brand-blue font-bold capitalize">
                  {student.current_game ? student.current_game.replace('-', ' ') : 'Alphabet Explorer'}
                </span>
              </div>
              <div className="flex items-center justify-between text-xs font-semibold text-gray-500">
                <span>Score Earned:</span>
                <span className="text-emerald-600 font-extrabold text-sm">{student.score} pts</span>
              </div>
              <div className="flex items-center justify-between text-xs font-semibold text-gray-500">
                <span>Session Accuracy:</span>
                <span className="text-purple-600 font-extrabold text-sm">{student.accuracy}%</span>
              </div>
            </div>

            <div className="text-[11px] text-gray-400 flex items-center justify-between pt-2 border-t border-gray-100">
              <span className="flex items-center gap-1">
                <Clock className="w-3.5 h-3.5" /> Heartbeat active
              </span>
              <span>Updated just now</span>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  )
}
