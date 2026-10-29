import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { GraduationCap, ArrowRight, Mail, Lock, ShieldCheck, Play } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import Button from '@/components/ui/Button'

export default function TeacherLoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const { signIn, signInAsDemo } = useAuth()
  const navigate = useNavigate()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email.trim() || !password) {
      setError('Please provide your educator email and password.')
      return
    }

    setLoading(true)
    setError(null)
    try {
      const { error: loginError } = await signIn(email.trim(), password)
      if (loginError) {
        setError(loginError.message || 'Invalid email or password.')
      } else {
        navigate('/teacher/dashboard')
      }
    } catch (err: any) {
      setError(err?.message || 'Failed to authenticate.')
    } finally {
      setLoading(false)
    }
  }

  const handleDemoTeacherLogin = async () => {
    setLoading(true)
    await signInAsDemo('teacher')
    navigate('/teacher/dashboard')
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 via-indigo-50 to-sky flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-md w-full bg-white rounded-3xl p-8 shadow-2xl border-2 border-blue-100"
      >
        <div className="text-center space-y-2 mb-6">
          <div className="w-16 h-16 mx-auto rounded-2xl bg-blue-100 text-brand-blue flex items-center justify-center text-3xl shadow-sm">
            <GraduationCap className="w-8 h-8" />
          </div>
          <h1 className="text-2xl font-black text-gray-800">Teacher Portal</h1>
          <p className="text-gray-500 text-xs">
            Sign in to manage classrooms, track live activities, and assign lessons.
          </p>
        </div>

        {error && (
          <div className="mb-6 p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold text-center">
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-1.5">
              Teacher Email
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="email"
                placeholder="teacher@school.edu"
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 text-sm rounded-xl border border-gray-200 focus:outline-none focus:border-brand-blue font-medium"
                autoComplete="email"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-1.5">
              Password
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 text-sm rounded-xl border border-gray-200 focus:outline-none focus:border-brand-blue font-medium"
                autoComplete="current-password"
                required
              />
            </div>
          </div>

          <Button
            type="submit"
            variant="primary"
            loading={loading}
            className="w-full py-3 text-sm font-bold flex items-center justify-center gap-2 mt-2"
          >
            <span>Educator Sign In</span>
            <ArrowRight className="w-4 h-4" />
          </Button>
        </form>

        {/* 1-Click Demo Teacher */}
        <div className="mt-4 pt-4 border-t border-gray-100">
          <Button
            type="button"
            variant="secondary"
            onClick={handleDemoTeacherLogin}
            className="w-full py-2.5 text-xs font-bold flex items-center justify-center gap-2 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border border-indigo-200"
          >
            <Play className="w-3.5 h-3.5" />
            <span>1-Click Educator Demo Login (Sarah)</span>
          </Button>
        </div>

        <div className="mt-6 pt-4 border-t border-gray-100 space-y-2 text-center">
          <div className="text-xs text-gray-400">
            Student account?{' '}
            <Link to="/student/login" className="font-bold text-brand-blue hover:underline">
              Student portal login
            </Link>
          </div>
        </div>
      </motion.div>
    </div>
  )
}
