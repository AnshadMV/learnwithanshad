import { motion, AnimatePresence } from 'framer-motion'
import { Tv, Sparkles, X, Check, Share2 } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { useStudentLiveStream } from '@/hooks/useStudentLiveStream'
import Button from '@/components/ui/Button'

export default function StudentLiveBanner() {
  const { isStudent, profile } = useAuth()
  const {
    isScreenSharing,
    startScreenShare,
    stopScreenShare,
    incomingReaction,
    screenShareRequested,
  } = useStudentLiveStream()

  if (!isStudent && profile?.role !== 'student') {
    return null
  }

  return (
    <>
      {/* 1. Teacher Encouragement Sticker Pop-up */}
      <AnimatePresence>
        {incomingReaction && (
          <motion.div
            initial={{ scale: 0.3, y: 50, opacity: 0 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            exit={{ scale: 0.5, y: -50, opacity: 0 }}
            className="fixed inset-0 pointer-events-none z-50 flex items-center justify-center p-4"
          >
            <div className="bg-white/95 backdrop-blur-md rounded-3xl p-8 shadow-2xl border-4 border-sunny-300 text-center space-y-3 max-w-sm pointer-events-auto animate-bounce-gentle">
              <div className="text-7xl animate-pulse">{incomingReaction}</div>
              <h3 className="text-2xl font-black text-gray-800 font-display">
                Great Job, {profile?.display_name || 'Little Explorer'}!
              </h3>
              <p className="text-sm font-bold text-brand-blue">
                Ustadh sent you a special cheer! 🌟
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 2. Teacher Screen Request Banner */}
      <AnimatePresence>
        {screenShareRequested && !isScreenSharing && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-20 left-1/2 -translate-x-1/2 z-50 max-w-md w-full px-4"
          >
            <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-2xl p-4 shadow-xl flex items-center justify-between gap-3 border-2 border-white/20">
              <div className="flex items-center gap-2.5">
                <Tv className="w-5 h-5 text-sunny-300 animate-pulse shrink-0" />
                <div className="text-xs">
                  <span className="font-extrabold block text-sm">Ustadh wants to watch! 📺</span>
                  <span className="text-blue-100">Share your screen so teacher can see you play!</span>
                </div>
              </div>
              <Button
                size="sm"
                variant="sunny"
                onClick={startScreenShare}
                className="shrink-0 text-xs py-2 px-3 shadow"
              >
                <span>Share Screen</span>
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 3. Floating Bottom-Right Screen Share Indicator */}
      <div className="fixed bottom-4 right-4 z-40 select-none">
        {isScreenSharing ? (
          <div className="flex items-center gap-2 bg-emerald-600 text-white px-3.5 py-1.5 rounded-full shadow-lg text-xs font-bold border-2 border-emerald-400">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-200 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-white"></span>
            </span>
            <span>Live Screen Streaming</span>
            <button
              onClick={stopScreenShare}
              className="ml-1 bg-black/20 hover:bg-black/30 rounded-full p-1"
              title="Stop sharing"
            >
              <X className="w-3 h-3" />
            </button>
          </div>
        ) : (
          <button
            onClick={startScreenShare}
            className="flex items-center gap-1.5 bg-white/90 hover:bg-white text-gray-700 hover:text-brand-blue px-3 py-1.5 rounded-full shadow-md hover:shadow-lg transition-all text-xs font-bold border border-blue-200 group"
          >
            <Tv className="w-3.5 h-3.5 text-brand-blue group-hover:scale-110 transition-transform" />
            <span>Share Screen with Teacher 📺</span>
          </button>
        )}
      </div>
    </>
  )
}
