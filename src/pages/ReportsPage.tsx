import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Download, ArrowLeft, BarChart3, Users, Calendar, Award } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { ARABIC_LETTERS } from '@/data/arabicLetters'
import Button from '@/components/ui/Button'

interface GameReportRow {
  id: string
  student_name: string
  game_slug: string
  score: number
  accuracy: number
  created_at: string
}

export default function ReportsPage() {
  const navigate = useNavigate()
  const [reportRows, setReportRows] = useState<GameReportRow[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadReports() {
      try {
        const { data: sessions } = await supabase
          .from('game_sessions')
          .select('id, student_id, game_slug, score, accuracy, created_at')
          .order('created_at', { ascending: false })
          .limit(50)

        const { data: profiles } = await supabase
          .from('profiles')
          .select('id, display_name')

        const map: Record<string, string> = {}
        profiles?.forEach((p: any) => {
          map[p.id] = p.display_name
        })

        if (sessions && sessions.length > 0) {
          const rows: GameReportRow[] = sessions.map((s: any) => ({
            id: s.id,
            student_name: map[s.student_id] || 'Student ' + s.student_id.slice(0, 4),
            game_slug: s.game_slug,
            score: s.score || 0,
            accuracy: s.accuracy || 0,
            created_at: new Date(s.created_at).toLocaleDateString(),
          }))
          setReportRows(rows)
        } else {
          setReportRows([])
        }
      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    }

    loadReports()
  }, [])

  const handleExportCSV = () => {
    const headers = ['ID,Student Name,Game Name,Score,Accuracy (%),Date']
    const lines = reportRows.map(
      r => `"${r.id}","${r.student_name}","${r.game_slug}",${r.score},${r.accuracy},"${r.created_at}"`
    )
    const csvContent = [headers, ...lines].join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `arabic_learning_report_${new Date().toISOString().split('T')[0]}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  const avgScore =
    reportRows.length > 0
      ? Math.round(reportRows.reduce((a, b) => a + b.score, 0) / reportRows.length)
      : 0

  const avgAccuracy =
    reportRows.length > 0
      ? Math.round(reportRows.reduce((a, b) => a + b.accuracy, 0) / reportRows.length)
      : 0

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12">
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
            <h1 className="text-2xl font-black text-gray-800">Teacher Reports & Analytics</h1>
            <p className="text-xs text-gray-400">Export student learning history and classroom mastery</p>
          </div>
        </div>

        <Button
          variant="primary"
          onClick={handleExportCSV}
          className="flex items-center gap-2 shadow-sm"
        >
          <Download className="w-4 h-4" />
          <span>Export CSV</span>
        </Button>
      </div>

      {/* Aggregate Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-3xl p-5 shadow-card">
          <div className="text-xs font-bold text-gray-400 uppercase mb-1">Total Activities Completed</div>
          <div className="text-3xl font-black text-brand-blue">{reportRows.length}</div>
        </div>
        <div className="bg-white rounded-3xl p-5 shadow-card">
          <div className="text-xs font-bold text-gray-400 uppercase mb-1">Average Points</div>
          <div className="text-3xl font-black text-brand-green">{avgScore} pts</div>
        </div>
        <div className="bg-white rounded-3xl p-5 shadow-card">
          <div className="text-xs font-bold text-gray-400 uppercase mb-1">Classroom Accuracy</div>
          <div className="text-3xl font-black text-sunny-500">{avgAccuracy}%</div>
        </div>
      </div>

      {/* Report Table */}
      <div className="bg-white rounded-3xl shadow-card overflow-hidden">
        <div className="p-5 border-b border-gray-100 flex items-center justify-between">
          <h2 className="font-bold text-gray-800">Activity Log</h2>
          <span className="text-xs text-gray-400">Filtered to recent completed games</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase font-extrabold text-gray-500 border-b border-gray-100">
              <tr>
                <th className="px-6 py-3.5">Student</th>
                <th className="px-6 py-3.5">Game Activity</th>
                <th className="px-6 py-3.5">Score</th>
                <th className="px-6 py-3.5">Accuracy</th>
                <th className="px-6 py-3.5">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {reportRows.map(row => (
                <tr key={row.id} className="hover:bg-blue-50/50 transition-colors">
                  <td className="px-6 py-4 font-bold text-gray-800">{row.student_name}</td>
                  <td className="px-6 py-4 text-gray-600 capitalize">
                    {row.game_slug.replace('-', ' ')}
                  </td>
                  <td className="px-6 py-4 font-black text-brand-blue">{row.score} pts</td>
                  <td className="px-6 py-4 font-bold text-emerald-600">{row.accuracy}%</td>
                  <td className="px-6 py-4 text-xs text-gray-400">{row.created_at}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
