import { useNavigate, useLocation } from 'react-router-dom'
import { Home, PlaySquare, Search, FileText, User } from 'lucide-react'

interface NavItem {
  path: string
  label: string
  icon: typeof Home
}

const navItems: NavItem[] = [
  { path: '/', label: 'ホーム', icon: Home },
  { path: '/videos', label: '動画', icon: PlaySquare },
  { path: '/search', label: '検索', icon: Search },
  { path: '/notes', label: 'ノート', icon: FileText },
  { path: '/profile', label: 'マイページ', icon: User },
]

export function BottomNav() {
  const navigate = useNavigate()
  const location = useLocation()

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-bg-secondary shadow-bottom-nav safe-area-bottom">
      <div className="flex justify-around items-center h-16 max-w-lg mx-auto">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path ||
            (item.path !== '/' && location.pathname.startsWith(item.path))
          const Icon = item.icon

          return (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className={`relative flex flex-col items-center justify-center w-full h-full gap-1 transition-all duration-200 active:scale-95 ${
                isActive ? 'text-navy' : 'text-text-secondary hover:text-navy-400'
              }`}
            >
              <div className={`relative ${isActive ? 'scale-110' : ''} transition-transform duration-200`}>
                <Icon className="w-5 h-5" />
                {isActive && (
                  <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 bg-teal rounded-full" />
                )}
              </div>
              <span className={`text-[10px] transition-all duration-200 ${isActive ? 'font-bold' : 'font-medium'}`}>
                {item.label}
              </span>
            </button>
          )
        })}
      </div>
    </nav>
  )
}
