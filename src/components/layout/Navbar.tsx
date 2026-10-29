import React, { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { cn } from '@/lib/utils'
import { useAuth } from '@/hooks/useAuth'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface NavLink {
  label: string
  to: string
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const GUEST_LINKS: NavLink[] = [
  { label: 'Home',     to: '/' },
  { label: 'Alphabet', to: '/alphabet' },
  { label: 'Games',    to: '/games' },
]

const AUTH_LINKS: NavLink[] = [
  ...GUEST_LINKS,
  { label: 'Dashboard', to: '/dashboard' },
]

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function Logo() {
  return (
    <Link
      to="/"
      className="flex items-center gap-2 font-extrabold text-lg text-blue-700 hover:text-blue-800 transition-colors shrink-0"
    >
      <span className="text-2xl" role="img" aria-label="star">⭐</span>
      <span className="hidden sm:block leading-tight">
        Arabic Learning
        <br />
        <span className="text-sm font-semibold text-blue-500">Adventure</span>
      </span>
    </Link>
  )
}

function NavItem({ link, onClick }: { link: NavLink; onClick?: () => void }) {
  const { pathname } = useLocation()
  const isActive = pathname === link.to || (link.to !== '/' && pathname.startsWith(link.to))

  return (
    <Link
      to={link.to}
      onClick={onClick}
      className={cn(
        'px-3 py-1.5 rounded-xl font-semibold text-sm transition-colors',
        isActive
          ? 'bg-blue-100 text-blue-700'
          : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900',
      )}
    >
      {link.label}
    </Link>
  )
}

function UserMenu({ onSignOut }: { onSignOut: () => void }) {
  const { profile } = useAuth()
  const [open, setOpen] = useState(false)

  const initials = (profile?.display_name ?? 'U')
    .split(' ')
    .map((p) => p[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-haspopup="true"
        className={cn(
          'flex items-center gap-2 px-3 py-1.5 rounded-xl',
          'text-sm font-semibold text-gray-700',
          'hover:bg-gray-100 transition-colors',
          'focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-400',
        )}
      >
        <span
          className="w-8 h-8 rounded-full bg-blue-500 text-white flex items-center justify-center text-xs font-bold shrink-0"
          aria-hidden="true"
        >
          {initials}
        </span>
        <span className="hidden md:block max-w-[120px] truncate">
          {profile?.display_name ?? 'User'}
        </span>
        <svg
          width="12"
          height="12"
          viewBox="0 0 12 12"
          fill="none"
          aria-hidden="true"
          className={cn('transition-transform', open && 'rotate-180')}
        >
          <path d="M2 4l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-44 bg-white rounded-2xl shadow-xl border border-gray-100 py-1 z-50">
          <Link
            to="/profile"
            onClick={() => setOpen(false)}
            className="block px-4 py-2 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-700 transition-colors"
          >
            My Profile
          </Link>
          <button
            onClick={() => { setOpen(false); onSignOut() }}
            className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
          >
            Sign Out
          </button>
        </div>
      )}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Navbar
// ---------------------------------------------------------------------------

export function Navbar() {
  const { user, signOut } = useAuth()
  const [mobileOpen, setMobileOpen] = useState(false)

  const links = user ? AUTH_LINKS : GUEST_LINKS

  const closeMobile = () => setMobileOpen(false)

  return (
    <nav className="sticky top-0 z-30 bg-white/90 backdrop-blur-md border-b border-gray-200 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">

          {/* Logo */}
          <Logo />

          {/* Desktop links */}
          <div className="hidden md:flex items-center gap-1">
            {links.map((link) => (
              <NavItem key={link.to} link={link} />
            ))}
          </div>

          {/* Right side */}
          <div className="flex items-center gap-2">
            {user ? (
              <UserMenu onSignOut={signOut} />
            ) : (
              <Link
                to="/login"
                className={cn(
                  'px-4 py-2 rounded-xl text-sm font-semibold',
                  'bg-blue-500 text-white',
                  'hover:bg-blue-600 transition-colors shadow-sm',
                )}
              >
                Sign In
              </Link>
            )}

            {/* Mobile hamburger */}
            <button
              className={cn(
                'md:hidden p-2 rounded-xl text-gray-600',
                'hover:bg-gray-100 transition-colors',
                'focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-400',
              )}
              aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
              aria-expanded={mobileOpen}
              onClick={() => setMobileOpen((o) => !o)}
            >
              {mobileOpen ? (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" aria-hidden="true">
                  <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              ) : (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" aria-hidden="true">
                  <line x1="3" y1="6" x2="21" y2="6" /><line x1="3" y1="12" x2="21" y2="12" /><line x1="3" y1="18" x2="21" y2="18" />
                </svg>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="md:hidden border-t border-gray-100 bg-white px-4 py-3 flex flex-col gap-1">
          {links.map((link) => (
            <NavItem key={link.to} link={link} onClick={closeMobile} />
          ))}
        </div>
      )}
    </nav>
  )
}

export default Navbar
