import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Sparkles, ArrowRight, KeyRound, User, Play } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import Button from '@/components/ui/Button'

export default function StudentLoginPage() {
  const [username, setUsername] = useState('')
  const [pin, setPin] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const { signInWithStudentPin, signInAsDemo } = useAuth()
  const navigate = useNavigate()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!username.trim() || !pin.trim()) {
      setError('Please type your username and 4-digit PIN! 😊')
      return
    }

    setLoading(true)
    setError(null)
    try {
      const { error: loginError } = await signInWithStudentPin(username.trim(), pin.trim())
      if (loginError) {
        setError(loginError.message || 'Incorrect username or PIN. Ask your teacher for help!')
      } else {
        navigate('/student/dashboard')
      }
    } catch (err: any) {
      setError(err?.message || 'Something went wrong. Please try again!')
    } finally {
      setLoading(false)
    }
  }

  const handleDemoStudentLogin = async () => {
    setLoading(true)
    await signInAsDemo('student')
    navigate('/student/dashboard')
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#EAF5FF] via-blue-50 to-amber-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="max-w-md w-full bg-white rounded-3xl p-8 shadow-2xl border-4 border-sunny-300 relative overflow-hidden"
      >
        <div className="text-center space-y-3 mb-6">
          <div className="w-20 h-20 mx-auto rounded-3xl bg-sunny-100 flex items-center justify-center text-4xl shadow-inner animate-bounce-gentle">
            ⭐
          </div>
          <h1 className="text-3xl font-black text-gray-800 font-display">
            Student Login
          </h1>
          <p className="text-gray-500 text-sm">
            Enter your username and PIN to continue your Arabic adventure!
          </p>
        </div>

        {error && (
          <div className="mb-6 p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-sm font-semibold text-center">
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-1.5">
              Student Username / ID
            </label>
            <div className="relative">
              <User className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="e.g. adam, maya, zaid"
                value={username}
                onChange={e => setUsername(e.target.value)}
                className="w-full pl-12 pr-4 py-3 rounded-2xl border-2 border-blue-100 focus:border-brand-blue focus:outline-none text-base font-semibold"
                autoComplete="username"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-1.5">
              Secret PIN (4 digits)
            </label>
            <div className="relative">
              <KeyRound className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="password"
                maxLength={6}
                placeholder="1234"
                value={pin}
                onChange={e => setPin(e.target.value)}
                className="w-full pl-12 pr-4 py-3 rounded-2xl border-2 border-blue-100 focus:border-brand-blue focus:outline-none text-lg tracking-widest font-mono"
                autoComplete="current-password"
              />
            </div>
          </div>

          <Button
            type="submit"
            variant="sunny"
            loading={loading}
            className="w-full py-3.5 text-base font-black flex items-center justify-center gap-2 mt-2"
          >
            <span>Start Learning! 🚀</span>
            <ArrowRight className="w-5 h-5" />
          </Button>
        </form>

        {/* Instant 1-Click Demo Button */}
        <div className="mt-4 pt-4 border-t border-gray-100">
          <Button
            type="button"
            variant="secondary"
            onClick={handleDemoStudentLogin}
            className="w-full py-2.5 text-xs font-bold flex items-center justify-center gap-2 bg-blue-50 text-brand-blue hover:bg-blue-100 border border-blue-200"
          >
            <Play className="w-3.5 h-3.5" />
            <span>1-Click Student Demo Login (Zaid)</span>
          </Button>
        </div>

        <div className="mt-6 pt-4 border-t border-gray-100 space-y-2 text-center">
          <Link
            to="/alphabet"
            className="text-xs font-bold text-gray-500 hover:text-brand-blue block"
          >
            Or play as Guest without login →
          </Link>
          <div className="text-xs text-gray-400">
            Teacher?{' '}
            <Link to="/teacher/login" className="font-bold text-brand-blue underline">
              Teacher sign in here
            </Link>
          </div>
        </div>
      </motion.div>
    </div>
  )
}
