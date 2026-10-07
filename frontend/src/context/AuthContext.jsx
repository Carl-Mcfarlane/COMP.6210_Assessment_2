import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient.js'
import { AuthContext } from './authContext.js'

// loads the current session, keeps it in sync via onAuthStateChange, and
// looks up the signed-in user's role from the profiles table (readable via
// the "Users can read own profile" RLS policy)
export function AuthProvider({ children }) {
  const [session, setSession] = useState(null)
  const [role, setRole] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false

    async function loadRole(user) {
      if (!user) {
        setRole(null)
        return
      }
      const { data } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single()
      if (!cancelled) setRole(data?.role ?? 'user')
    }

    supabase.auth.getSession().then(async ({ data: { session: initialSession } }) => {
      if (cancelled) return
      setSession(initialSession)
      await loadRole(initialSession?.user)
      if (!cancelled) setLoading(false)
    })

    const { data: subscription } = supabase.auth.onAuthStateChange(async (_event, newSession) => {
      if (cancelled) return
      setSession(newSession)
      await loadRole(newSession?.user)
    })

    return () => {
      cancelled = true
      subscription.subscription.unsubscribe()
    }
  }, [])

  const value = {
    session,
    user: session?.user ?? null,
    role,
    loading,
    signIn: (email, password) => supabase.auth.signInWithPassword({ email, password }),
    signUp: (email, password) => supabase.auth.signUp({ email, password }),
    signOut: () => supabase.auth.signOut(),
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
