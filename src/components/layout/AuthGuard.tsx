import { type ReactNode } from 'react'
import { Navigate } from 'react-router-dom'
import { useAuthStore } from '@/stores/useAuthStore'
import { FullPageSpinner } from '@/components/common/LoadingSpinner'

interface AuthGuardProps {
  children: ReactNode
}

export function AuthGuard({ children }: AuthGuardProps) {
  const { session, isLoading } = useAuthStore()

  if (isLoading) {
    return <FullPageSpinner />
  }

  if (!session) {
    return <Navigate to="/login" replace />
  }

  return <>{children}</>
}
