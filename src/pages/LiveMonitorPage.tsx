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
  Tv,
} from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/hooks/useAuth'
import Button from '@/components/ui/Button'
import Modal from '@/components/ui/Modal'
import ArabicText from '@/components/arabic/ArabicText'
import TeacherLiveScreenWatcher from '@/components/live/TeacherLiveScreenWatcher'

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
  const roomCode = searchParams.get('room') || 'LEVEL-1'

  const [liveStudents, setLiveStudents] = useState<LiveStudent[]>([])
  const [loading, setLoading] = useState(true)
  const [roomName, setRoomName] = useState<string>('Level 1')
  const [lastRefreshed, setLastRefreshed] = useState<Date>(new Date())
  const [shareModalOpen, setShareModalOpen] = useState(false)
  const [copiedStudent, setCopiedStudent] = useState(false)
  const [copiedMonitor, setCopiedMonitor] = useState(false)
  const [recentBroadcastNotice, setRecentBroadcastNotice] = useState<string | null>(null)
  const [watchingStudent, setWatchingStudent] = useState<LiveStudent | null>(null)

  // 1. Fetch dynamic classroom and enrolled student status from database
  useEffect(() => {
    async function loadRoomStatus() {
      setLoading(true)
      try {
        let classId: string | null = null
        let name: string = 'Level 1'

        // Match room by invite code
        const { data: matchedClass } = await supabase
          .from('classrooms')
          .select('id, name, invite_code')
          .eq('invite_code', roomCode)
          .maybeSingle()

        if (matchedClass) {
          classId = matchedClass.id
          name = matchedClass.name
        } else if (user) {
          // If roomCode not found, fallback to teacher's primary classroom
          const { data: myClasses } = await supabase
            .from('classrooms')
            .select('id, name, invite_code')
            .eq('teacher_id', user.id)
            .order('created_at', { ascending: false })
            .limit(1)

          if (myClasses && myClasses[0]) {
            classId = myClasses[0].id
            name = myClasses[0].name
          }
        }

        setRoomName(name)

        // Query students enrolled in this classroom
        let studentProfiles: any[] = []

        if (classId) {
          const { data: enrolled } = await supabase
            .from('classroom_students')
            .select('student_id')
            .eq('classroom_id', classId)

          const studentIds = (enrolled || []).map(e => e.student_id)
          if (studentIds.length > 0) {
            const { data: profiles } = await supabase
              .from('profiles')
              .select('id, display_name, email')
              .in('id', studentIds)

            if (profiles) studentProfiles = profiles
          }
        }

        // If no enrollments, check general student profiles
        if (studentProfiles.length === 0) {
          const { data: fallbackProfiles } = await supabase
            .from('profiles')
            .select('id, display_name, email')
            .eq('role', 'student')

          if (fallbackProfiles) studentProfiles = fallbackProfiles
        }

        // Also merge any locally tracked student accounts
        const localStudents = localStorage.getItem('arabic_local_students')
        if (localStudents) {
          try {
            const parsed = JSON.parse(localStudents)
            if (Array.isArray(parsed)) {
              for (const loc of parsed) {
                const alreadyExists = studentProfiles.some(sp => 
                  sp.id === loc.id || 
                  sp.display_name?.trim().toLowerCase() === loc.display_name?.trim().toLowerCase()
                )
                if (!alreadyExists) {
                  studentProfiles.push(loc)
                }
              }
            }
          } catch {}
        }

        if (studentProfiles.length > 0) {
          const today = new Date()
          today.setHours(0, 0, 0, 0)
          const pIds = studentProfiles.map(p => p.id)

          const { data: sessions } = await supabase
            .from('game_sessions')
            .select('*')
            .in('student_id', pIds)
            .gte('created_at', today.toISOString())
            .order('created_at', { ascending: false })

          const list: LiveStudent[] = studentProfiles.map(p => {
            const latest = sessions?.find(s => s.student_id === p.id)
            if (latest) {
              const diffMs = Date.now() - new Date(latest.created_at).getTime()
              const isRecent = diffMs < 5 * 60 * 1000 // within 5 minutes
              return {
                student_id: p.id,
                display_name: p.display_name,
                current_game: latest.game_slug || 'letter-safari',
                current_letter: latest.letter_id || 'alef',
                score: latest.score || 0,
                accuracy: latest.accuracy || 100,
                questions_completed: latest.questions_correct || 0,
                status: isRecent ? 'playing' : 'completed',
                last_heartbeat: latest.created_at,
              }
            }
            return {
              student_id: p.id,
              display_name: p.display_name,
              current_game: 'idle',
              current_letter: '—',
              score: 0,
              accuracy: 100,
              questions_completed: 0,
              status: 'idle',
              last_heartbeat: new Date().toISOString(),
            }
          })

          setLiveStudents(list)
        } else {
          setLiveStudents([])
        }
      } catch (err) {
        console.warn('Live monitor loading warning:', err)
        setLiveStudents([])
      } finally {
        setLoading(false)
      }
    }

    loadRoomStatus()
  }, [roomCode, user, lastRefreshed])

  // Setup Supabase Realtime Broadcast & Postgres listeners
  useEffect(() => {
    // 1. Subscribe to Live Broadcast Channel for instantaneous cross-tab/device sync
    const liveChannel = supabase
      .channel('classroom_live_share', {
        config: { broadcast: { self: true } },
      })
      .on('broadcast', { event: 'student_joined' }, ({ payload }) => {
        if (!payload || !payload.student_id) return

        setLiveStudents(prev => {
          const existingIdx = prev.findIndex(s => 
            s.student_id === payload.student_id || 
            (payload.display_name && s.display_name.trim().toLowerCase() === payload.display_name.trim().toLowerCase())
          )
          const item: LiveStudent = {
            student_id: payload.student_id,
            display_name: payload.display_name || 'Student Explorer',
            current_game: payload.gameSlug || payload.game_slug || 'Alphabet Lesson',
            current_letter: payload.letterId || payload.letter_id || 'alef',
            score: payload.score || 0,
            accuracy: payload.accuracy !== undefined ? payload.accuracy : 100,
            questions_completed: 0,
            status: 'playing',
            last_heartbeat: new Date().toISOString(),
          }

          if (existingIdx !== -1) {
            const next = [...prev]
            next[existingIdx] = { ...next[existingIdx], ...item }
            return next
          }
          return [item, ...prev]
        })

        setRecentBroadcastNotice(`🎒 ${payload.display_name || 'A student'} joined Room ${roomCode} on their device!`)
        setTimeout(() => setRecentBroadcastNotice(null), 4000)
      })
      .on('broadcast', { event: 'student_activity' }, ({ payload }) => {
        if (!payload) return

        setLiveStudents(prev => {
          const existingIdx = prev.findIndex(s => 
            s.student_id === payload.student_id || 
            s.display_name.trim().toLowerCase() === payload.display_name?.trim().toLowerCase()
          )
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
      })
      .on('broadcast', { event: 'student_viewport' }, ({ payload }) => {
        if (!payload || !payload.student_id) return

        setLiveStudents(prev => {
          const existingIdx = prev.findIndex(s => 
            s.student_id === payload.student_id || 
            (payload.display_name && s.display_name.trim().toLowerCase() === payload.display_name.trim().toLowerCase())
          )
          if (existingIdx !== -1) {
            const next = [...prev]
            next[existingIdx] = {
              ...next[existingIdx],
              display_name: payload.display_name || next[existingIdx].display_name,
              current_game: payload.gameSlug || payload.game_slug || next[existingIdx].current_game,
              current_letter: payload.letterId || payload.letter_id || next[existingIdx].current_letter,
              score: payload.score !== undefined ? payload.score : next[existingIdx].score,
              accuracy: payload.accuracy !== undefined ? payload.accuracy : next[existingIdx].accuracy,
              status: 'playing',
              last_heartbeat: new Date().toISOString(),
            }
            return next
          }

          // Automatically add newly connected student from hosted link!
          const newItem: LiveStudent = {
            student_id: payload.student_id,
            display_name: payload.display_name || 'Student Explorer',
            current_game: payload.gameSlug || payload.game_slug || 'Alphabet Lesson',
            current_letter: payload.letterId || payload.letter_id || 'alef',
            score: payload.score || 0,
            accuracy: payload.accuracy !== undefined ? payload.accuracy : 100,
            questions_completed: 0,
            status: 'playing',
            last_heartbeat: new Date().toISOString(),
          }
          return [newItem, ...prev]
        })
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
  }, [roomCode])

  const handleCopyStudentLink = () => {
    const studentUrl = `${window.location.origin}/join?room=${roomCode}`
    navigator.clipboard.writeText(studentUrl)
    setCopiedStudent(true)
    setTimeout(() => setCopiedStudent(false), 2500)
  }

  const handleCopyMonitorLink = () => {
    const shareUrl = `${window.location.origin}/teacher/live?room=${roomCode}`
    navigator.clipboard.writeText(shareUrl)
    setCopiedMonitor(true)
    setTimeout(() => setCopiedMonitor(false), 2500)
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
      {loading ? (
        <div className="bg-white rounded-3xl p-12 text-center shadow-card border border-blue-50 flex flex-col items-center justify-center gap-3">
          <div className="w-8 h-8 border-4 border-brand-blue border-t-transparent rounded-full animate-spin" />
          <p className="text-sm font-semibold text-gray-500">Connecting to classroom feed and active sessions...</p>
        </div>
      ) : liveStudents.length === 0 ? (
        <div className="bg-white rounded-3xl p-12 text-center shadow-card border-2 border-dashed border-blue-200 space-y-4">
          <div className="w-16 h-16 mx-auto rounded-3xl bg-blue-50 text-brand-blue flex items-center justify-center text-3xl">
            📡
          </div>
          <div className="space-y-1">
            <h3 className="text-xl font-bold text-gray-800">
              Room {roomCode} ({roomName}) is Live & Ready
            </h3>
            <p className="text-sm text-gray-400 max-w-md mx-auto">
              Waiting for students to start learning. When learners launch letters or games, their live scores, accuracy, and activities will stream here instantly!
            </p>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <Button
              size="sm"
              variant={copiedStudent ? 'success' : 'primary'}
              onClick={handleCopyStudentLink}
              className="flex items-center gap-1.5 shadow"
            >
              {copiedStudent ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              <span>{copiedStudent ? 'Copied Student Link!' : 'Copy Student Link for Another Device 🎒'}</span>
            </Button>
            <Button
              size="sm"
              variant="secondary"
              onClick={() => window.open(`/join?room=${roomCode}`, '_blank')}
              className="flex items-center gap-1.5"
            >
              <Radio className="w-4 h-4 text-emerald-500" />
              <span>Test Student View</span>
            </Button>
            <Button
              size="sm"
              variant="secondary"
              onClick={() => setShareModalOpen(true)}
              className="flex items-center gap-1.5"
            >
              <Share2 className="w-4 h-4" />
              <span>All Invite Links</span>
            </Button>
          </div>
        </div>
      ) : (
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
                          student.status === 'playing'
                            ? 'bg-emerald-500 animate-pulse'
                            : student.status === 'completed'
                            ? 'bg-blue-500'
                            : 'bg-amber-400'
                        }`}
                      />
                      <span className="capitalize font-semibold text-gray-500">
                        {student.status === 'playing'
                          ? 'Active Now'
                          : student.status === 'completed'
                          ? 'Session Completed'
                          : 'Ready in Classroom'}
                      </span>
                    </div>
                  </div>
                </div>

                {student.current_letter && student.current_letter !== '—' && (
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
                    {student.current_game && student.current_game !== 'idle'
                      ? student.current_game.replace(/-/g, ' ')
                      : 'Classroom Explorer'}
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

              {/* Live Screen Preview Box */}
              <div 
                onClick={() => setWatchingStudent(student)}
                className="relative aspect-video rounded-2xl bg-slate-900 border-2 border-slate-700 hover:border-brand-blue cursor-pointer overflow-hidden group shadow-inner transition-all flex flex-col justify-between p-3 text-white"
              >
                <div className="flex items-center justify-between text-[10px]">
                  <span className="flex items-center gap-1 font-mono text-emerald-400 font-bold">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    LIVE SCREEN FEED
                  </span>
                  <span className="bg-black/60 px-1.5 py-0.5 rounded text-[9px] font-bold text-slate-300">
                    {student.current_game || 'Letter Lesson'}
                  </span>
                </div>

                <div className="text-center my-auto py-2">
                  <span className="text-3xl font-arabic font-black text-sunny-300 block drop-shadow">
                    {student.current_letter || 'ب'}
                  </span>
                  <span className="text-[10px] text-slate-300 font-semibold block mt-1">
                    Click to watch {student.display_name}'s live screen
                  </span>
                </div>

                <div className="flex items-center justify-center gap-1.5 text-xs font-bold text-white bg-brand-blue/80 group-hover:bg-brand-blue py-2 rounded-xl transition-all shadow">
                  <Tv className="w-3.5 h-3.5" />
                  <span>Watch Live Screen 📺</span>
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
      )}

      {/* Live Video / Viewport Screen Watcher Modal */}
      <AnimatePresence>
        {watchingStudent && (
          <TeacherLiveScreenWatcher
            student={watchingStudent}
            onClose={() => setWatchingStudent(null)}
          />
        )}
      </AnimatePresence>

      {/* Share Live Room Modal */}
      <Modal
        open={shareModalOpen}
        onClose={() => setShareModalOpen(false)}
        title="Share Live Classroom"
      >
        <div className="space-y-5">
          <p className="text-gray-500 text-sm">
            Connect students on another device (phone, tablet, or laptop) so their screen, answers, and game scores sync to your Live Monitor in real time.
          </p>

          <div className="p-4 rounded-2xl bg-sky border border-blue-100 flex items-center justify-between">
            <div>
              <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block">
                Classroom Room Code
              </span>
              <div className="font-mono text-2xl font-black text-brand-blue tracking-wider">
                {roomCode}
              </div>
            </div>
            <Button
              size="sm"
              variant="secondary"
              onClick={() => {
                navigator.clipboard.writeText(roomCode)
                setRecentBroadcastNotice(`Copied room code: ${roomCode}`)
                setTimeout(() => setRecentBroadcastNotice(null), 2500)
              }}
              className="text-xs"
            >
              <Copy className="w-3.5 h-3.5 mr-1" />
              <span>Copy Code</span>
            </Button>
          </div>

          {/* 1. Student Hosted Link (Primary) */}
          <div className="p-4 rounded-2xl bg-emerald-50 border-2 border-emerald-200 space-y-2">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-black uppercase tracking-wider text-emerald-800">
                📱 Student Link (Send to Student's Device)
              </label>
              <span className="text-[10px] font-bold bg-emerald-200/80 text-emerald-900 px-2 py-0.5 rounded-full">
                For Students
              </span>
            </div>
            <p className="text-xs text-emerald-700">
              When a student opens this link on their mobile, tablet, or PC, they join your live room and their screen mirrors here!
            </p>
            <div className="flex items-center gap-2 pt-1">
              <input
                type="text"
                readOnly
                value={`${window.location.origin}/join?room=${roomCode}`}
                className="w-full px-3.5 py-2 rounded-xl border border-emerald-300 bg-white text-xs font-mono font-bold text-emerald-900 focus:outline-none select-all"
              />
              <Button
                variant={copiedStudent ? 'success' : 'primary'}
                size="sm"
                onClick={handleCopyStudentLink}
                className="shrink-0 flex items-center gap-1 font-bold"
              >
                {copiedStudent ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                <span>{copiedStudent ? 'Copied!' : 'Copy Link'}</span>
              </Button>
            </div>
          </div>

          {/* 2. Direct Alphabet Game Student Link */}
          <div className="p-3.5 rounded-2xl bg-blue-50 border border-blue-200 space-y-1.5">
            <label className="block text-xs font-bold text-blue-900">
              🎮 Direct Alphabet Lesson Link
            </label>
            <div className="flex items-center gap-2">
              <input
                type="text"
                readOnly
                value={`${window.location.origin}/alphabet?room=${roomCode}`}
                className="w-full px-3 py-1.5 rounded-xl border border-blue-200 bg-white text-xs font-mono text-gray-700 focus:outline-none"
              />
              <Button
                variant="secondary"
                size="sm"
                onClick={() => {
                  navigator.clipboard.writeText(`${window.location.origin}/alphabet?room=${roomCode}`)
                  setRecentBroadcastNotice('Copied Alphabet direct link!')
                  setTimeout(() => setRecentBroadcastNotice(null), 2500)
                }}
                className="shrink-0 text-xs py-1.5 px-3"
              >
                <span>Copy</span>
              </Button>
            </div>
          </div>

          {/* 3. Teacher Spectator Link */}
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">
              🖥️ Teacher Spectator / Display Link
            </label>
            <div className="flex items-center gap-2">
              <input
                type="text"
                readOnly
                value={`${window.location.origin}/teacher/live?room=${roomCode}`}
                className="w-full px-4 py-2 rounded-xl border border-gray-200 bg-gray-50 text-xs font-mono text-gray-600 focus:outline-none"
              />
              <Button
                variant={copiedMonitor ? 'success' : 'secondary'}
                size="sm"
                onClick={handleCopyMonitorLink}
                className="shrink-0 flex items-center gap-1 text-xs"
              >
                {copiedMonitor ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedMonitor ? 'Copied!' : 'Copy'}</span>
              </Button>
            </div>
            <span className="text-[10px] text-gray-400 block mt-1">
              For classroom projectors, smart boards, or assistant teachers.
            </span>
          </div>

          <div className="pt-2 text-xs text-gray-500 bg-amber-50 p-3 rounded-xl border border-amber-200/60">
            💡 <strong>How multi-device sharing works:</strong> Keep this Live Monitor open on your computer. Have your student open the <strong>Student Link</strong> on their phone, tablet, or Chromebook. You will see their live cursor, answers, and screen in real-time!
          </div>
        </div>
      </Modal>
    </div>
  )
}
