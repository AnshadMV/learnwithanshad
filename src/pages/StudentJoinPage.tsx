import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams, Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Sparkles, ArrowRight, Radio, User, CheckCircle2, Tv, ShieldCheck } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { supabase } from '@/lib/supabase'
import Button from '@/components/ui/Button'

const AVATARS = ['⭐', '🦁', '🚀', '🐬', '👑', '🎈', '🎨', '🌈']

export default function StudentJoinPage() {
  const [searchParams] = useSearchParams()
  const initialRoom = (searchParams.get('room') || 'LEVEL-1').toUpperCase()
  const initialName = searchParams.get('name') || ''

  const [roomCode, setRoomCode] = useState(initialRoom)
  const [studentName, setStudentName] = useState(initialName)
  const [selectedAvatar, setSelectedAvatar] = useState('⭐')
  const [loading, setLoading] = useState(false)
  const [classroomInfo, setClassroomInfo] = useState<{ name: string; teacherName: string } | null>(null)
  const [enrolledStudents, setEnrolledStudents] = useState<Array<{ id: string; name: string }>>([])
  const [error, setError] = useState<string | null>(null)

  const { joinAsStudent, user, profile, isStudent } = useAuth()
  const navigate = useNavigate()

  // Load classroom and enrolled students from Supabase
  useEffect(() => {
    async function fetchRoomDetails() {
      if (!roomCode) return
      try {
        const { data: cls } = await supabase
          .from('classrooms')
          .select('id, name, invite_code, teacher_id')
          .eq('invite_code', roomCode)
          .maybeSingle()

        if (cls) {
          setClassroomInfo({
            name: cls.name,
            teacherName: 'Ustadh Anshad',
          })

          // Fetch enrolled student names for 1-tap join
          const { data: enrolled } = await supabase
            .from('classroom_students')
            .select('student_id')
            .eq('classroom_id', cls.id)

          if (enrolled && enrolled.length > 0) {
            const sIds = enrolled.map(e => e.student_id)
            const { data: profiles } = await supabase
              .from('profiles')
              .select('id, display_name')
              .in('id', sIds)

            if (profiles) {
              setEnrolledStudents(
                profiles.map(p => ({
                  id: p.id,
                  name: p.display_name,
                }))
              )
            }
          }
        } else {
          setClassroomInfo({
            name: 'Beginner Arabic Class',
            teacherName: 'Ustadh Anshad',
          })
        }
      } catch (err) {
        console.warn('Classroom lookup warning:', err)
      }
    }

    fetchRoomDetails()
  }, [roomCode])

  const handleJoin = async (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    const name = studentName.trim()
    if (!name) {
      setError('Please type your name or choose an explorer! 😊')
      return
    }

    setLoading(true)
    setError(null)

    try {
      const cleanRoom = (roomCode.trim() || 'LEVEL-1').toUpperCase()
      await joinAsStudent(name, cleanRoom, selectedAvatar)
      // Navigate directly into classroom lessons with room attached
      navigate(`/alphabet?room=${cleanRoom}`)
    } catch (err: any) {
      setError(err?.message || 'Could not join classroom. Please try again!')
    } finally {
      setLoading(false)
    }
  }

  const handleQuickSelectStudent = (name: string) => {
    setStudentName(name)
    setError(null)
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#EAF5FF] via-blue-50 to-amber-50 flex items-center justify-center p-4 py-8">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="max-w-lg w-full bg-white rounded-3xl p-6 sm:p-8 shadow-2xl border-4 border-sunny-300 relative overflow-hidden space-y-6"
      >
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="w-20 h-20 mx-auto rounded-3xl bg-sunny-100 flex items-center justify-center text-4xl shadow-inner animate-bounce-gentle">
            {selectedAvatar}
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-gray-800 font-display">
            Join Arabic Classroom 🎒
          </h1>
          <p className="text-gray-500 text-xs sm:text-sm">
            Connect your device to Ustadh's live lesson & play fun games!
          </p>
        </div>

        {/* Live Classroom Status Pill */}
        <div className="bg-sky/60 border border-blue-200 rounded-2xl p-3.5 flex items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2">
            <span className="relative flex h-3 w-3 shrink-0">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
            </span>
            <div>
              <span className="font-extrabold text-brand-blue block">
                {classroomInfo?.name || 'Arabic Live Classroom'}
              </span>
              <span className="text-gray-500 text-[11px]">
                Teacher: <strong className="text-gray-700">{classroomInfo?.teacherName || 'Ustadh Anshad'}</strong>
              </span>
            </div>
          </div>
          <span className="px-2.5 py-1 rounded-xl bg-blue-100 font-mono font-bold text-brand-blue text-xs">
            ROOM: {roomCode}
          </span>
        </div>

        {/* If already signed in as student */}
        {isStudent && profile && (
          <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 text-center space-y-2">
            <div className="flex items-center justify-center gap-1.5 text-emerald-700 font-extrabold text-sm">
              <CheckCircle2 className="w-4 h-4" />
              <span>Connected as {profile.display_name}</span>
            </div>
            <p className="text-xs text-emerald-800">
              Your device is already set up and linked to Ustadh's classroom!
            </p>
            <Button
              variant="primary"
              onClick={() => navigate(`/alphabet?room=${roomCode}`)}
              className="w-full bg-emerald-600 hover:bg-emerald-700 py-2.5 text-xs sm:text-sm font-bold flex items-center justify-center gap-2"
            >
              <span>Continue Learning Arabic 🚀</span>
              <ArrowRight className="w-4 h-4" />
            </Button>
          </div>
        )}

        {error && (
          <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs sm:text-sm font-semibold text-center">
            {error}
          </div>
        )}

        <form onSubmit={handleJoin} className="space-y-5">
          {/* Room Code Field */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-1.5">
              Classroom Code
            </label>
            <input
              type="text"
              value={roomCode}
              onChange={e => setRoomCode(e.target.value.toUpperCase())}
              placeholder="e.g. LEVEL-1"
              className="w-full px-4 py-2.5 rounded-2xl border-2 border-blue-100 focus:border-brand-blue focus:outline-none text-base font-mono font-bold uppercase tracking-wider text-gray-800"
              required
            />
          </div>

          {/* Student Name Field */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-1.5">
              Your Explorer Name
            </label>
            <div className="relative">
              <User className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={studentName}
                onChange={e => setStudentName(e.target.value)}
                placeholder="e.g. Aisha, Omar, Bilal"
                className="w-full pl-12 pr-4 py-3 rounded-2xl border-2 border-blue-100 focus:border-brand-blue focus:outline-none text-base font-semibold"
                autoFocus={!isStudent}
                required
              />
            </div>
          </div>

          {/* Quick Select from Enrolled Students if available */}
          {enrolledStudents.length > 0 && (
            <div>
              <span className="text-[11px] font-bold text-gray-400 block mb-1.5 uppercase">
                Or tap your name:
              </span>
              <div className="flex flex-wrap gap-1.5">
                {enrolledStudents.map(s => (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => handleQuickSelectStudent(s.name)}
                    className={`px-3 py-1 rounded-xl text-xs font-bold transition-all ${
                      studentName.trim().toLowerCase() === s.name.trim().toLowerCase()
                        ? 'bg-brand-blue text-white shadow-sm'
                        : 'bg-blue-50 text-brand-blue hover:bg-blue-100'
                    }`}
                  >
                    {s.name}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Avatar Selector */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-2">
              Choose your Adventure Avatar
            </label>
            <div className="grid grid-cols-4 sm:grid-cols-8 gap-2">
              {AVATARS.map(emoji => (
                <button
                  key={emoji}
                  type="button"
                  onClick={() => setSelectedAvatar(emoji)}
                  className={`w-11 h-11 rounded-2xl text-2xl flex items-center justify-center transition-all ${
                    selectedAvatar === emoji
                      ? 'bg-sunny-300 scale-110 shadow-md ring-2 ring-sunny-500'
                      : 'bg-gray-100 hover:bg-gray-200'
                  }`}
                >
                  {emoji}
                </button>
              ))}
            </div>
          </div>

          {/* Join Button */}
          <Button
            type="submit"
            variant="sunny"
            disabled={loading}
            className="w-full py-3.5 text-base font-black flex items-center justify-center gap-2 shadow-lg hover:shadow-xl transition-all"
          >
            {loading ? (
              <span>Connecting to Room...</span>
            ) : (
              <>
                <span>Enter Classroom & Start Playing</span>
                <ArrowRight className="w-5 h-5" />
              </>
            )}
          </Button>
        </form>

        {/* Feature Notice for Multi-device */}
        <div className="pt-2 border-t border-gray-100 space-y-2">
          <div className="flex items-center gap-2 text-[11px] text-gray-500 font-semibold">
            <Radio className="w-3.5 h-3.5 text-rose-500 shrink-0" />
            <span>Live interaction and screen sync to teacher's monitor is active.</span>
          </div>
          <div className="flex items-center gap-2 text-[11px] text-gray-500 font-semibold">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
            <span>Safe, secure child-friendly learning environment.</span>
          </div>
        </div>

        {/* Alternative Links */}
        <div className="flex items-center justify-between text-xs font-semibold text-gray-500 pt-1">
          <Link to="/student/login" className="text-brand-blue hover:underline">
            Have a Student PIN? Login
          </Link>
          <Link to="/teacher/login" className="text-gray-400 hover:text-gray-600">
            Teacher Login
          </Link>
        </div>
      </motion.div>
    </div>
  )
}
