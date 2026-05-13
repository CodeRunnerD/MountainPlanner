import { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '#/lib/supabase'
import type { Session, User } from '@supabase/supabase-js'
import type { Tables } from '#/types/database.types'

type Profile = Tables<'profiles'>

interface AuthUser extends User {
  profile?: Profile | null
}

interface AuthContextValue {
  user: AuthUser | null
  session: Session | null
  isLoading: boolean
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>
  signUp: (email: string, password: string, metadata: { display_name: string }) => Promise<{ error: Error | null }>
  signOut: () => Promise<void>
  resetPassword: (email: string) => Promise<{ error: Error | null }>
  resendConfirmation: (email: string) => Promise<{ error: Error | null }>
  refreshProfile: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const fetchProfile = async (userId: string): Promise<Profile | null> => {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single()
    if (error) {
      console.error('Failed to fetch profile:', error)
      return null
    }
    return data
  }

  useEffect(() => {
    let mounted = true

    const initAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!mounted) return

      setSession(session)

      if (session?.user) {
        const profile = await fetchProfile(session.user.id)
        if (mounted) {
          setUser({ ...session.user, profile } as AuthUser)
        }
      }

      if (mounted) setIsLoading(false)
    }

    initAuth()

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setSession(session)
        setUser(session?.user ? { ...session.user, profile: null } as AuthUser : null)

        if (session?.user) {
          setTimeout(async () => {
            const profile = await fetchProfile(session.user.id)
            setUser((prev) => (prev ? { ...prev, profile } as AuthUser : null))
          }, 0)
        }
      }
    )

    return () => {
      mounted = false
      subscription.unsubscribe()
    }
  }, [])

  const signIn = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    if (data.session) {
      setSession(data.session)
      const profile = await fetchProfile(data.session.user.id)
      setUser({ ...data.session.user, profile } as AuthUser)
    }
    return { error }
  }

  const signUp = async (email: string, password: string, metadata: { display_name: string }) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          display_name: metadata.display_name,
          role: 'participant',
        },
      },
    })
    return { error }
  }

  const signOut = async () => {
    await supabase.auth.signOut()
  }

  const resetPassword = async (email: string) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/login`,
    })
    return { error }
  }

  const resendConfirmation = async (email: string) => {
    const { error } = await supabase.auth.resend({
      type: 'signup',
      email,
    })
    return { error }
  }

  const refreshProfile = async () => {
    if (!user?.id) return
    const profile = await fetchProfile(user.id)
    setUser((prev) => (prev ? { ...prev, profile } as AuthUser : null))
  }

  return (
    <AuthContext.Provider
      value={{ user, session, isLoading, signIn, signUp, signOut, resetPassword, resendConfirmation, refreshProfile }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
