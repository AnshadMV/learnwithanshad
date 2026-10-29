import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  type ReactNode,
} from 'react'
import type { User, Session, AuthError } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'
import type { Profile } from '@/types'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface AuthContextValue {
  user: User | null
  session: Session | null
  profile: Profile | null
  loading: boolean
  isTeacher: boolean
  isStudent: boolean
  signIn: (email: string, password: string) => Promise<{ error: AuthError | null }>
  signInWithStudentPin: (username: string, pin: string) => Promise<{ error: AuthError | Error | null }>
  signUp: (email: string, password: string, displayName: string, role?: Profile['role']) => Promise<{ error: AuthError | null }>
  signOut: () => Promise<void>
}

// ---------------------------------------------------------------------------
// Context
// ---------------------------------------------------------------------------

const AuthContext = createContext<AuthContextValue | null>(null)

// ---------------------------------------------------------------------------
// Helper — fetch profile row
// ---------------------------------------------------------------------------

async function fetchProfile(userId: string): Promise<Profile | null> {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single()

  if (error) {
    console.error('[useAuth] fetchProfile error:', error.message)
    return null
  }

  return data as Profile
}

// ---------------------------------------------------------------------------
// Provider
// ---------------------------------------------------------------------------

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)

  // Sync profile whenever the user id changes
  useEffect(() => {
    if (!user) {
      setProfile(null)
      return
    }

    let cancelled = false

    fetchProfile(user.id).then((p) => {
      if (!cancelled) setProfile(p)
    })

    return () => {
      cancelled = true
    }
  }, [user?.id])

  // Bootstrap auth state and subscribe to changes
  useEffect(() => {
    let initialised = false

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event: any, newSession: Session | null) => {
        setSession(newSession)
        setUser(newSession?.user ?? null)
        if (!initialised) {
          initialised = true
          setLoading(false)
        }
      },
    )

    // Eagerly load session to avoid flicker
    supabase.auth.getSession().then(({ data }: { data: { session: Session | null } }) => {
      setSession(data.session)
      setUser(data.session?.user ?? null)
      if (!initialised) {
        initialised = true
        setLoading(false)
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  // ---------------------------------------------------------------------------
  // Auth methods
  // ---------------------------------------------------------------------------

  const signIn = useCallback(async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    return { error }
  }, [])

  const signInWithStudentPin = useCallback(async (username: string, pin: string) => {
    // Standardized student email format: [username]@student.arabiclearn.local
    const studentEmail = `${username.toLowerCase().replace(/[^a-z0-9_-]/g, '')}@student.arabiclearn.local`
    const { error } = await supabase.auth.signInWithPassword({
      email: studentEmail,
      password: `pin_${pin}`,
    })
    return { error }
  }, [])

  const signUp = useCallback(
    async (
      email: string,
      password: string,
      displayName: string,
      role: Profile['role'] = 'student',
    ) => {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { display_name: displayName, role },
        },
      })

      if (error || !data.user) return { error }

      // Upsert profile row (trigger may already create it, this is a safety net)
      await supabase.from('profiles').upsert({
        id: data.user.id,
        email,
        display_name: displayName,
        role,
        is_active: true,
      } as any)

      return { error: null }
    },
    [],
  )

  const signOut = useCallback(async () => {
    await supabase.auth.signOut()
    setProfile(null)
  }, [])

  // ---------------------------------------------------------------------------
  // Derived state
  // ---------------------------------------------------------------------------

  const isTeacher = profile?.role === 'teacher'
  const isStudent = profile?.role === 'student'

  const value: AuthContextValue = {
    user,
    session,
    profile,
    loading,
    isTeacher,
    isStudent,
    signIn,
    signInWithStudentPin,
    signUp,
    signOut,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) {
    throw new Error('useAuth must be used inside <AuthProvider>')
  }
  return ctx
}
