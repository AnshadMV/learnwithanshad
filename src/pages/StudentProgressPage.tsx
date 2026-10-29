import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ArrowLeft, CheckCircle2, RotateCcw, Award, Star } from 'lucide-react'
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

export default function StudentProgressPage() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [progressMap, setProgressMap] = useState<Record<string, ProgressItem>>({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) return

    async function loadData() {
      try {
        const { data } = await supabase
          .from('student_letter_progress')
          .select('*')
          .eq('student_id', user!.id)

        if (data) {
          const map: Record<string, ProgressItem> = {}
          ;(data as any[]).forEach((item: any) => {
            map[item.letter_id] = item
          })
          setProgressMap(map)
        }
      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [user])

  const completedCount = Object.values(progressMap).filter(p => p.completed).length

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-12">
      <div className="flex items-center gap-3">
        <Button
          variant="secondary"
          size="sm"
          onClick={() => navigate('/student/dashboard')}
          className="flex items-center gap-1.5"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Dashboard</span>
        </Button>
        <h1 className="text-2xl font-black text-gray-800">My Arabic Learning Report</h1>
      </div>

      <div className="bg-white rounded-3xl p-6 shadow-card space-y-4">
        <div className="flex items-center justify-between">
          <span className="font-bold text-gray-700">Total Alphabet Mastery</span>
          <span className="font-black text-brand-blue">{completedCount} of 28 Letters</span>
        </div>
        <ProgressBar value={Math.round((completedCount / 28) * 100)} showPercent color="bg-brand-blue" />
      </div>

      {/* 28 Letters Table */}
      <div className="bg-white rounded-3xl shadow-card overflow-hidden">
        <div className="p-5 border-b border-gray-100 flex items-center justify-between">
          <h2 className="font-bold text-gray-800 text-lg">Letter-by-Letter Breakdown</h2>
          <span className="text-xs text-gray-400">All 28 Arabic letters in traditional order</span>
        </div>

        <div className="divide-y divide-gray-100">
          {ARABIC_LETTERS.map(letter => {
            const prog = progressMap[letter.id]
            const attempts = prog?.attempts || 0
            const correct = prog?.correct || 0
            const accuracy = attempts > 0 ? Math.round((correct / attempts) * 100) : 0
            const isCompleted = prog?.completed || false

            return (
              <div
                key={letter.id}
                className="p-4 sm:p-5 flex items-center justify-between hover:bg-blue-50/50 transition-colors"
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-sky flex items-center justify-center font-arabic text-2xl font-bold text-brand-blue shadow-sm">
                    {letter.letter}
                  </div>
                  <div>
                    <div className="font-bold text-gray-800 flex items-center gap-2">
                      <span>{letter.name_english}</span>
                      <span className="text-xs text-gray-400 font-arabic" dir="rtl">
                        ({letter.name_arabic})
                      </span>
                    </div>
                    <div className="text-xs text-gray-500">
                      Sound: {letter.sound_description}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-6">
                  <div className="hidden sm:block text-right">
                    <div className="text-xs font-semibold text-gray-400">Accuracy</div>
                    <div className="text-sm font-black text-gray-700">{accuracy}%</div>
                  </div>

                  <div className="w-24">
                    {isCompleted ? (
                      <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-emerald-100 text-emerald-700 text-xs font-bold">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Done
                      </span>
                    ) : (
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => navigate(`/letter/${letter.id}`)}
                        className="text-xs py-1.5"
                      >
                        Learn
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
