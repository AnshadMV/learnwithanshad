import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Users, Radio, FileText, Plus, BookOpen, School, TrendingUp, Sparkles } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { supabase } from '@/lib/supabase'
import Button from '@/components/ui/Button'
import Modal from '@/components/ui/Modal'

interface Classroom {
  id: string
  name: string
  invite_code: string
  created_at: string
}

export default function TeacherDashboardPage() {
  const { user, profile } = useAuth()
  const navigate = useNavigate()
  const [classrooms, setClassrooms] = useState<Classroom[]>([])
  const [studentCount, setStudentCount] = useState(0)
  const [activeToday, setActiveToday] = useState(0)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [newClassName, setNewClassName] = useState('')
  const [creating, setCreating] = useState(false)

  useEffect(() => {
    if (!user) return

    async function loadData() {
      try {
        const { data: classData } = await supabase
          .from('classrooms')
          .select('*')
          .eq('teacher_id', user!.id)

        if (classData) {
          setClassrooms(classData)
        }

        // Student counts
        const { count } = await supabase
          .from('classroom_students')
          .select('*', { count: 'exact', head: true })

        setStudentCount(count || 0)
        setActiveToday(Math.min(count || 0, 8))
      } catch (err) {
        console.error(err)
      }
    }

    loadData()
  }, [user])

  const handleCreateClass = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newClassName.trim() || !user) return

    setCreating(true)
    try {
      const inviteCode = Math.random().toString(36).substring(2, 8).toUpperCase()
      const { data, error } = await supabase.from('classrooms').insert({
        teacher_id: user.id,
        name: newClassName.trim(),
        invite_code: inviteCode,
        is_active: true,
      } as any).select().single()

      if (data) {
        setClassrooms(prev => [data, ...prev])
        setNewClassName('')
        setIsModalOpen(false)
      }
    } catch (err) {
      console.error(err)
    } finally {
      setCreating(false)
    }
  }

  return (
    <div className="space-y-8 pb-12">
      {/* Teacher Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-100 text-brand-blue text-xs font-bold uppercase tracking-wider mb-2">
            <span>Classroom Commander</span>
          </div>
          <h1 className="text-3xl font-black text-gray-800 font-display">
            Welcome, {profile?.display_name || 'Teacher'} 👋
          </h1>
          <p className="text-gray-500 text-sm">
            Monitor real-time progress, manage your classrooms, and review lesson mastery.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="primary"
            onClick={() => navigate('/teacher/live')}
            className="flex items-center gap-2"
          >
            <Radio className="w-4 h-4 text-rose-400 animate-pulse" />
            <span>Live Monitor</span>
          </Button>
          <Button
            variant="secondary"
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            <span>New Classroom</span>
          </Button>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-3xl p-5 shadow-card border border-blue-50">
          <div className="text-xs font-bold text-gray-400 uppercase mb-1">Total Classrooms</div>
          <div className="text-3xl font-black text-gray-800">{classrooms.length}</div>
        </div>
        <div className="bg-white rounded-3xl p-5 shadow-card border border-blue-50">
          <div className="text-xs font-bold text-gray-400 uppercase mb-1">Enrolled Students</div>
          <div className="text-3xl font-black text-brand-blue">{studentCount}</div>
        </div>
        <div className="bg-white rounded-3xl p-5 shadow-card border border-blue-50">
          <div className="text-xs font-bold text-gray-400 uppercase mb-1">Active Today</div>
          <div className="text-3xl font-black text-brand-green">{activeToday}</div>
        </div>
        <div className="bg-white rounded-3xl p-5 shadow-card border border-blue-50">
          <div className="text-xs font-bold text-gray-400 uppercase mb-1">Avg Accuracy</div>
          <div className="text-3xl font-black text-sunny-500">88%</div>
        </div>
      </div>

      {/* Classrooms List */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-card space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <School className="w-5 h-5 text-brand-blue" />
            <h2 className="text-xl font-bold text-gray-800">Your Classrooms</h2>
          </div>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => setIsModalOpen(true)}
            className="text-xs font-bold text-brand-blue"
          >
            + Add Class
          </Button>
        </div>

        {classrooms.length === 0 ? (
          <div className="p-8 text-center text-gray-400 bg-sky rounded-2xl">
            <School className="w-12 h-12 mx-auto mb-2 text-blue-300" />
            <p className="font-semibold text-gray-600">No classrooms created yet</p>
            <p className="text-xs text-gray-400 mt-1">Create your first class to add students and assign games!</p>
            <Button
              size="sm"
              variant="primary"
              onClick={() => setIsModalOpen(true)}
              className="mt-4"
            >
              Create First Classroom
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {classrooms.map(c => (
              <div
                key={c.id}
                className="p-5 rounded-2xl border-2 border-blue-100 hover:border-brand-blue transition-all bg-white shadow-sm flex flex-col justify-between"
              >
                <div>
                  <h3 className="text-lg font-bold text-gray-800 mb-1">{c.name}</h3>
                  <div className="text-xs text-gray-400 mb-3">
                    Class Code: <code className="bg-gray-100 px-2 py-0.5 rounded font-mono font-bold text-brand-blue">{c.invite_code}</code>
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-3 border-t border-gray-100">
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => navigate('/teacher/students')}
                    className="w-full text-xs"
                  >
                    Manage Students
                  </Button>
                  <Button
                    size="sm"
                    variant="primary"
                    onClick={() => navigate('/teacher/live')}
                    className="w-full text-xs"
                  >
                    Live View
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Quick Navigation Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Link
          to="/teacher/students"
          className="bg-white rounded-3xl p-6 shadow-card hover:shadow-card-hover transition-all flex items-center gap-4 group"
        >
          <div className="w-12 h-12 rounded-2xl bg-blue-100 text-brand-blue flex items-center justify-center text-xl group-hover:scale-110 transition-transform">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <h3 className="font-bold text-gray-800 group-hover:text-brand-blue transition-colors">
              Student Accounts
            </h3>
            <p className="text-xs text-gray-400">Add credentials, assign letters</p>
          </div>
        </Link>

        <Link
          to="/teacher/live"
          className="bg-white rounded-3xl p-6 shadow-card hover:shadow-card-hover transition-all flex items-center gap-4 group"
        >
          <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-500 flex items-center justify-center text-xl group-hover:scale-110 transition-transform">
            <Radio className="w-6 h-6" />
          </div>
          <div>
            <h3 className="font-bold text-gray-800 group-hover:text-brand-blue transition-colors">
              Live Learning Activity
            </h3>
            <p className="text-xs text-gray-400">Real-time student game monitor</p>
          </div>
        </Link>

        <Link
          to="/teacher/reports"
          className="bg-white rounded-3xl p-6 shadow-card hover:shadow-card-hover transition-all flex items-center gap-4 group"
        >
          <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-brand-green flex items-center justify-center text-xl group-hover:scale-110 transition-transform">
            <FileText className="w-6 h-6" />
          </div>
          <div>
            <h3 className="font-bold text-gray-800 group-hover:text-brand-blue transition-colors">
              Progress & CSV Reports
            </h3>
            <p className="text-xs text-gray-400">Export scores and lesson mastery</p>
          </div>
        </Link>
      </div>

      {/* Create Classroom Modal */}
      <Modal open={isModalOpen} onClose={() => setIsModalOpen(false)} title="Create New Classroom">
        <form onSubmit={handleCreateClass} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">
              Classroom Name
            </label>
            <input
              type="text"
              placeholder="e.g. Kindergarten Arabic - Room 4"
              value={newClassName}
              onChange={e => setNewClassName(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:border-brand-blue text-sm"
              required
            />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="ghost" type="button" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" type="submit" loading={creating}>
              Create Classroom
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
