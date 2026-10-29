import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { GraduationCap, Sparkles, User, ArrowRight, ShieldCheck } from 'lucide-react'
import Button from '@/components/ui/Button'
import { useAuth } from '@/hooks/useAuth'

export default function LoginPage() {
  const navigate = useNavigate()
  const { user, profile } = useAuth()

  // If already logged in, redirect to respective dashboard
  if (user && profile) {
    if (profile.role === 'teacher') {
      navigate('/teacher/dashboard')
    } else {
      navigate('/student/dashboard')
    }
  }

  return (
    <div className="min-h-[80vh] flex items-center justify-center p-4">
      <div className="max-w-2xl w-full space-y-8 text-center">
        {/* Header */}
        <div className="space-y-3">
          <div className="w-20 h-20 mx-auto rounded-3xl bg-blue-100 text-brand-blue flex items-center justify-center text-4xl shadow-sm animate-bounce-gentle">
            🌟
          </div>
          <h1 className="text-4xl font-black text-gray-800 font-display">
            Welcome to Arabic Adventure!
          </h1>
          <p className="text-gray-600 text-base max-w-md mx-auto">
            Choose how you would like to sign in today:
          </p>
        </div>

        {/* Portals Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          {/* Student Portal */}
          <motion.div
            whileHover={{ y: -6, scale: 1.02 }}
            className="bg-white rounded-3xl p-8 shadow-card border-4 border-sunny-300 flex flex-col justify-between text-left space-y-6"
          >
            <div className="space-y-4">
              <div className="w-16 h-16 rounded-2xl bg-sunny-100 text-sunny-600 flex items-center justify-center text-3xl shadow-inner">
                ⭐
              </div>
              <div>
                <span className="text-xs font-bold text-sunny-600 uppercase tracking-wider block mb-1">
                  Ages 5–7 Explorers
                </span>
                <h2 className="text-2xl font-black text-gray-800">Student Portal</h2>
                <p className="text-gray-500 text-sm mt-1">
                  Log in with your teacher-provided username and simple 4-digit PIN!
                </p>
              </div>
            </div>

            <Link to="/student/login">
              <Button variant="sunny" className="w-full flex items-center justify-center gap-2 py-3.5 text-base font-black">
                <span>I'm a Student 🚀</span>
                <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
          </motion.div>

          {/* Teacher Portal */}
          <motion.div
            whileHover={{ y: -6, scale: 1.02 }}
            className="bg-white rounded-3xl p-8 shadow-card border-4 border-blue-200 flex flex-col justify-between text-left space-y-6"
          >
            <div className="space-y-4">
              <div className="w-16 h-16 rounded-2xl bg-blue-100 text-brand-blue flex items-center justify-center text-3xl shadow-inner">
                <GraduationCap className="w-8 h-8" />
              </div>
              <div>
                <span className="text-xs font-bold text-brand-blue uppercase tracking-wider block mb-1">
                  Educators & Parents
                </span>
                <h2 className="text-2xl font-black text-gray-800">Teacher Portal</h2>
                <p className="text-gray-500 text-sm mt-1">
                  Manage your classrooms, issue student PINs, and watch live student sessions.
                </p>
              </div>
            </div>

            <Link to="/teacher/login">
              <Button variant="primary" className="w-full flex items-center justify-center gap-2 py-3.5 text-base font-bold">
                <span>Teacher Sign In 👩‍🏫</span>
                <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
          </motion.div>
        </div>

        {/* Guest Explore */}
        <div className="pt-4 border-t border-blue-100">
          <Link
            to="/alphabet"
            className="text-sm font-bold text-brand-blue hover:underline inline-flex items-center gap-1.5"
          >
            <span>Or explore as Guest (No login required) →</span>
          </Link>
        </div>
      </div>
    </div>
  )
}
