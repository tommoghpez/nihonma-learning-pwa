import { type ReactNode } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useAuthStore } from '@/stores/useAuthStore'
import { FullPageSpinner } from '@/components/common/LoadingSpinner'

interface AuthGuardProps {
  children: ReactNode
}

export function AuthGuard({ children }: AuthGuardProps) {
  const { session, isLoading, isNewUser } = useAuthStore()
  const location = useLocation()

  if (isLoading) {
    return <FullPageSpinner />
  }

  if (!session) {
    return <Navigate to="/login" replace />
  }

  // 初回ログインユーザーはプロフィール設定ページへ誘導
  if (isNewUser && location.pathname !== '/profile') {
    return <Navigate to="/profile" replace />
  }

  return <>{children}</>
}
