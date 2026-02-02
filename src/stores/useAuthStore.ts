import { create } from 'zustand'
import { supabase } from '@/lib/supabase'
import type { User } from '@/types'
import type { Session } from '@supabase/supabase-js'

interface AuthState {
  user: User | null
  session: Session | null
  isLoading: boolean
  isAdmin: boolean
  initialize: () => Promise<void>
  signInWithMagicLink: (email: string) => Promise<{ error: string | null }>
  signOut: () => Promise<void>
  updateProfile: (data: Partial<Pick<User, 'display_name' | 'avatar_url'>>) => Promise<void>
  fetchProfile: (userId: string) => Promise<void>
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  session: null,
  isLoading: true,
  isAdmin: false,

  initialize: async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (session?.user) {
        set({ session })
        await get().fetchProfile(session.user.id)
      }
    } catch {
      // ignore
    } finally {
      set({ isLoading: false })
    }

    supabase.auth.onAuthStateChange(async (_event, session) => {
      set({ session })
      if (session?.user) {
        await get().fetchProfile(session.user.id)
      } else {
        set({ user: null, isAdmin: false })
      }
    })
  },

  fetchProfile: async (userId: string) => {
    const { data } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single()

    if (data) {
      const user = data as User
      set({ user, isAdmin: user.role === 'admin' })
    }
  },

  signInWithMagicLink: async (email: string) => {
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: window.location.origin,
      },
    })
    return { error: error?.message ?? null }
  },

  signOut: async () => {
    await supabase.auth.signOut()
    set({ user: null, session: null, isAdmin: false })
  },

  updateProfile: async (data) => {
    const user = get().user
    if (!user) return
    const { error } = await supabase
      .from('users')
      .update(data)
      .eq('id', user.id)
    if (!error) {
      set({ user: { ...user, ...data } })
    }
  },
}))
