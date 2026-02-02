import { useNavigate, useLocation } from 'react-router-dom'
import { Home, PlaySquare, Search, User, Shield } from 'lucide-react'
import { useAuthStore } from '@/stores/useAuthStore'

interface NavItem {
  path: string
  label: string
  icon: typeof Home
  adminOnly?: boolean
}

const navItems: NavItem[] = [
  { path: '/', label: 'ホーム', icon: Home },
  { path: '/videos', label: '動画', icon: PlaySquare },
  { path: '/search', label: '検索', icon: Search },
  { path: '/profile', label: 'マイページ', icon: User },
  { path: '/admin/quiz', label: '管理', icon: Shield, adminOnly: true },
]

export function BottomNav() {
  const navigate = useNavigate()
  const location = useLocation()
  const isAdmin = useAuthStore((s) => s.isAdmin)

  const visibleItems = navItems.filter((item) => !item.adminOnly || isAdmin)

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-bg-secondary border-t border-border safe-area-bottom">
      <div className="flex justify-around items-center h-16">
        {visibleItems.map((item) => {
          const isActive = location.pathname === item.path ||
            (item.path !== '/' && location.pathname.startsWith(item.path))
          const Icon = item.icon

          return (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className={`flex flex-col items-center justify-center w-full h-full gap-1 transition-colors ${
                isActive ? 'text-navy' : 'text-text-secondary'
              }`}
            >
              <Icon className="w-5 h-5" />
              <span className="text-[10px] font-medium">{item.label}</span>
            </button>
          )
        })}
      </div>
    </nav>
  )
}
