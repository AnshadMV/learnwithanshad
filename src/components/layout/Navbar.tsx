import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { cn } from '@/lib/utils'
import { useAuth } from '@/hooks/useAuth'
import { Radio, Users, Settings, LogOut, LayoutDashboard, Sparkles } from 'lucide-react'

interface NavLink {
  label: string
  to: string
  highlight?: boolean
}

export function Navbar() {
  const { user, profile, isTeacher, isStudent, signOut } = useAuth()
  const [mobileOpen, setMobileOpen] = useState(false)
  const [userDropdownOpen, setUserDropdownOpen] = useState(false)
  const { pathname } = useLocation()
  const navigate = useNavigate()

  const guestLinks: NavLink[] = [
    { label: 'Home', to: '/' },
    { label: 'Alphabet', to: '/alphabet' },
    { label: 'Word Explorer', to: '/words' },
    { label: 'Games', to: '/games' },
  ]

  const studentLinks: NavLink[] = [
    { label: 'Home', to: '/' },
    { label: 'Alphabet', to: '/alphabet' },
    { label: 'Games', to: '/games' },
    { label: 'My Dashboard', to: '/student/dashboard' },
    { label: 'My Progress', to: '/student/progress' },
  ]

  const teacherLinks: NavLink[] = [
    { label: 'Home', to: '/' },
    { label: 'Alphabet', to: '/alphabet' },
    { label: 'Games', to: '/games' },
    { label: 'Dashboard', to: '/teacher/dashboard' },
    { label: 'Live Monitor 🔴', to: '/teacher/live', highlight: true },
    { label: 'Students', to: '/teacher/students' },
    { label: 'Reports', to: '/teacher/reports' },
  ]

  const activeLinks = isTeacher ? teacherLinks : isStudent ? studentLinks : guestLinks

  const handleSignOut = async () => {
    setUserDropdownOpen(false)
    await signOut()
    navigate('/')
  }

  const initials = (profile?.display_name || user?.email?.split('@')[0] || 'U')
    .slice(0, 2)
    .toUpperCase()

  return (
    <nav className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-blue-100 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2.5 shrink-0 group">
            <span className="text-3xl group-hover:scale-110 transition-transform select-none">⭐</span>
            <div className="leading-tight">
              <span className="font-black text-lg text-brand-blue font-display block">
                Arabic Learning
              </span>
              <span className="text-[11px] font-extrabold text-sunny-600 tracking-wider uppercase block -mt-1">
                Adventure
              </span>
            </div>
          </Link>

          {/* Desktop Links */}
          <div className="hidden lg:flex items-center gap-1">
            {activeLinks.map(link => {
              const isActive =
                pathname === link.to || (link.to !== '/' && pathname.startsWith(link.to))
              return (
                <Link
                  key={link.to}
                  to={link.to}
                  className={cn(
                    'px-3.5 py-1.5 rounded-xl font-bold text-sm transition-all select-none',
                    link.highlight && 'text-rose-600 hover:bg-rose-50',
                    isActive
                      ? 'bg-blue-100 text-brand-blue shadow-sm'
                      : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                  )}
                >
                  {link.label}
                </Link>
              )
            })}
          </div>

          {/* Right actions */}
          <div className="flex items-center gap-3">
            <Link
              to="/settings"
              className="p-2 rounded-xl text-gray-500 hover:bg-gray-100 transition-colors"
              title="Settings & Accessibility"
            >
              <Settings className="w-5 h-5" />
            </Link>

            {user ? (
              <div className="relative">
                <button
                  onClick={() => setUserDropdownOpen(o => !o)}
                  className="flex items-center gap-2 p-1.5 pl-2.5 rounded-2xl bg-blue-50 hover:bg-blue-100 transition-colors border border-blue-200"
                >
                  <span className="text-xs font-bold text-gray-700 max-w-[100px] truncate">
                    {profile?.display_name || user.email?.split('@')[0]}
                  </span>
                  <div className="w-7 h-7 rounded-xl bg-brand-blue text-white font-bold text-xs flex items-center justify-center">
                    {initials}
                  </div>
                </button>

                {userDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-52 bg-white rounded-2xl shadow-xl border border-gray-100 py-2 z-50 animate-fade-in">
                    <div className="px-4 py-2 border-b border-gray-100">
                      <div className="text-xs font-bold text-gray-800 truncate">
                        {profile?.display_name || 'Adventurer'}
                      </div>
                      <div className="text-[10px] text-gray-400 capitalize">
                        Role: {profile?.role || (isTeacher ? 'Teacher' : 'Student')}
                      </div>
                    </div>

                    <Link
                      to={isTeacher ? '/teacher/dashboard' : '/student/dashboard'}
                      onClick={() => setUserDropdownOpen(false)}
                      className="flex items-center gap-2 px-4 py-2.5 text-xs font-bold text-gray-700 hover:bg-blue-50 hover:text-brand-blue"
                    >
                      <LayoutDashboard className="w-4 h-4" />
                      <span>My Dashboard</span>
                    </Link>

                    {isTeacher && (
                      <Link
                        to="/teacher/live"
                        onClick={() => setUserDropdownOpen(false)}
                        className="flex items-center gap-2 px-4 py-2.5 text-xs font-bold text-rose-600 hover:bg-rose-50"
                      >
                        <Radio className="w-4 h-4 text-rose-500" />
                        <span>Live Monitor 🔴</span>
                      </Link>
                    )}

                    <Link
                      to="/settings"
                      onClick={() => setUserDropdownOpen(false)}
                      className="flex items-center gap-2 px-4 py-2.5 text-xs font-bold text-gray-700 hover:bg-blue-50"
                    >
                      <Settings className="w-4 h-4" />
                      <span>Settings & Sound</span>
                    </Link>

                    <button
                      onClick={handleSignOut}
                      className="w-full text-left flex items-center gap-2 px-4 py-2.5 text-xs font-bold text-rose-600 hover:bg-rose-50 border-t border-gray-100 mt-1"
                    >
                      <LogOut className="w-4 h-4" />
                      <span>Sign Out</span>
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <Link
                to="/login"
                className="px-5 py-2 rounded-2xl text-sm font-extrabold bg-brand-blue text-white hover:bg-blue-600 shadow-md transition-all active:scale-95"
              >
                Sign In
              </Link>
            )}

            {/* Mobile menu button */}
            <button
              onClick={() => setMobileOpen(o => !o)}
              className="lg:hidden p-2 rounded-xl text-gray-600 hover:bg-gray-100"
              aria-label="Toggle menu"
            >
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                {mobileOpen ? (
                  <>
                    <line x1="18" y1="6" x2="6" y2="18" />
                    <line x1="6" y1="6" x2="18" y2="18" />
                  </>
                ) : (
                  <>
                    <line x1="3" y1="6" x2="21" y2="6" />
                    <line x1="3" y1="12" x2="21" y2="12" />
                    <line x1="3" y1="18" x2="21" y2="18" />
                  </>
                )}
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileOpen && (
        <div className="lg:hidden border-t border-gray-100 bg-white px-4 py-3 flex flex-col gap-1.5 shadow-lg">
          {activeLinks.map(link => (
            <Link
              key={link.to}
              to={link.to}
              onClick={() => setMobileOpen(false)}
              className="px-3.5 py-2 rounded-xl text-sm font-bold text-gray-700 hover:bg-blue-50 hover:text-brand-blue"
            >
              {link.label}
            </Link>
          ))}
        </div>
      )}
    </nav>
  )
}

export default Navbar
