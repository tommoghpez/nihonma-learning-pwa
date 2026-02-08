import { useAuthStore } from '@/stores/useAuthStore'
import { useOnlineStatus } from '@/hooks/useOnlineStatus'
import { WifiOff } from 'lucide-react'
import { parseAvatarString, getAvatarDataUrl } from '@/lib/avatars'
import { Logo } from '@/components/common/Logo'

export function Header() {
  const user = useAuthStore((s) => s.user)
  const { isOnline } = useOnlineStatus()

  // ユーザーのアバター設定を取得
  const avatarConfig = parseAvatarString(user?.avatar_url)
  const avatarUrl = getAvatarDataUrl(avatarConfig.character, avatarConfig.colorName)

  return (
    <header className="sticky top-0 z-40 bg-navy text-white shadow-md">
      <div className="flex items-center justify-between px-4 h-14">
        <Logo />
        <div className="flex items-center gap-3">
          {!isOnline && (
            <div className="flex items-center gap-1 text-warning text-sm">
              <WifiOff className="w-4 h-4" />
              <span>オフライン</span>
            </div>
          )}
          {user && (
            <div className="flex items-center gap-2">
              <img
                src={avatarUrl}
                alt="アバター"
                className="w-8 h-8 rounded-full"
              />
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
