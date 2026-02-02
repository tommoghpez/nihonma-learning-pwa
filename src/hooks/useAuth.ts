import { useEffect } from 'react'
import { useAuthStore } from '@/stores/useAuthStore'

export function useAuth() {
  const store = useAuthStore()

  useEffect(() => {
    store.initialize()
  }, [])

  return {
    user: store.user,
    session: store.session,
    isLoading: store.isLoading,
    isAdmin: store.isAdmin,
    isAuthenticated: !!store.session,
    signInWithMagicLink: store.signInWithMagicLink,
    signOut: store.signOut,
    updateProfile: store.updateProfile,
  }
}
