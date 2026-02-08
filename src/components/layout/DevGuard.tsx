import { Navigate } from 'react-router-dom'
import { useAuthStore } from '@/stores/useAuthStore'
import { DEVELOPER_EMAILS } from '@/lib/constants'

interface DevGuardProps {
  children: React.ReactNode
}

export function DevGuard({ children }: DevGuardProps) {
  const user = useAuthStore((s) => s.user)

  // 開発者メールでない場合はホームにリダイレクト
  if (!user || !DEVELOPER_EMAILS.includes(user.email as typeof DEVELOPER_EMAILS[number])) {
    return <Navigate to="/" replace />
  }

  return <>{children}</>
}
