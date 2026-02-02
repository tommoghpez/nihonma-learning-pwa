import { useAuthStore } from '@/stores/useAuthStore'
import { useOnlineStatus } from '@/hooks/useOnlineStatus'
import { WifiOff } from 'lucide-react'

export function Header() {
  const user = useAuthStore((s) => s.user)
  const { isOnline } = useOnlineStatus()

  return (
    <header className="sticky top-0 z-40 bg-navy text-white shadow-md">
      <div className="flex items-center justify-between px-4 h-14">
        <h1 className="text-lg font-bold">日本M&A学習</h1>
        <div className="flex items-center gap-3">
          {!isOnline && (
            <div className="flex items-center gap-1 text-warning text-sm">
              <WifiOff className="w-4 h-4" />
              <span>オフライン</span>
            </div>
          )}
          {user && (
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-teal flex items-center justify-center text-sm font-bold">
                {user.display_name?.charAt(0) || user.email.charAt(0).toUpperCase()}
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
