import { create } from 'zustand'
import { supabase } from '@/lib/supabase'
import { useProgressStore } from '@/stores/useProgressStore'
import type { User } from '@/types'
import type { Session } from '@supabase/supabase-js'

interface AuthState {
  user: User | null
  session: Session | null
  isLoading: boolean
  isAdmin: boolean
  isNewUser: boolean
  initialize: () => Promise<void>
  signInWithMagicLink: (email: string) => Promise<{ error: string | null }>
  signOut: () => Promise<void>
  updateProfile: (data: Partial<Pick<User, 'display_name' | 'avatar_url'>>) => Promise<void>
  fetchProfile: (userId: string) => Promise<void>
  clearNewUserFlag: () => void
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  session: null,
  isLoading: true,
  isAdmin: false,
  isNewUser: false,

  initialize: async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (session?.user) {
        set({ session })
        await get().fetchProfile(session.user.id)
      }
    } catch (err) {
      console.warn('[Auth] セッション取得に失敗:', err)
    } finally {
      set({ isLoading: false })
    }

    supabase.auth.onAuthStateChange(async (_event, session) => {
      set({ session })
      if (session?.user) {
        await get().fetchProfile(session.user.id)
      } else {
        useProgressStore.getState().clearProgress()
        set({ user: null, isAdmin: false })
      }
    })
  },

  fetchProfile: async (userId: string) => {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single()

    if (data) {
      const user = data as User
      set({ user, isAdmin: user.role === 'admin' })
    } else if (error?.code === 'PGRST116') {
      // User not found, create new user record
      const { data: { user: authUser } } = await supabase.auth.getUser()
      if (authUser) {
        const newUser = {
          id: userId,
          email: authUser.email ?? '',
          display_name: authUser.email?.split('@')[0] ?? 'ユーザー',
          avatar_url: null,
          role: 'member',
        }
        const { error: insertError } = await supabase.from('users').insert(newUser)
        if (!insertError) {
          set({ user: newUser as User, isAdmin: false, isNewUser: true })
        } else {
          console.error('Failed to create user:', insertError)
        }
      }
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

  clearNewUserFlag: () => set({ isNewUser: false }),

  signOut: async () => {
    await supabase.auth.signOut()
    useProgressStore.getState().clearProgress()
    set({ user: null, session: null, isAdmin: false, isNewUser: false })
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
