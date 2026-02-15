import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Users, PlayCircle, CheckCircle } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/stores/useAuthStore'
import { parseAvatarString, getAvatarDataUrl } from '@/lib/avatars'

interface ActivityItem {
  id: string
  user_id: string
  video_id: string
  display_name: string
  avatar_url: string | null
  video_title: string
  completed: boolean
  updated_at: string
}

export function TeamActivity() {
  const navigate = useNavigate()
  const currentUser = useAuthStore((s) => s.user)
  const [activities, setActivities] = useState<ActivityItem[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    async function fetchActivity() {
      try {
        // 最近の視聴活動を取得（自分以外）
        const { data } = await supabase
          .from('watch_progress')
          .select(`
            id,
            user_id,
            video_id,
            completed,
            updated_at,
            users (display_name, avatar_url),
            videos (title)
          `)
          .neq('user_id', currentUser?.id ?? '')
          .order('updated_at', { ascending: false })
          .limit(8)

        if (data) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          setActivities(data.map((d: any) => ({
            id: d.id,
            user_id: d.user_id,
            video_id: d.video_id,
            display_name: d.users?.display_name ?? '匿名',
            avatar_url: d.users?.avatar_url ?? null,
            video_title: d.videos?.title ?? '動画',
            completed: d.completed,
            updated_at: d.updated_at,
          })))
        }
      } catch {
        // ignore - ソーシャル機能は失敗しても問題なし
      } finally {
        setIsLoading(false)
      }
    }

    if (currentUser) fetchActivity()
    else setIsLoading(false)
  }, [currentUser])

  if (isLoading || activities.length === 0) return null

  const timeAgo = (dateStr: string) => {
    const diff = Date.now() - new Date(dateStr).getTime()
    const minutes = Math.floor(diff / 60000)
    if (minutes < 1) return 'たった今'
    if (minutes < 60) return `${minutes}分前`
    const hours = Math.floor(minutes / 60)
    if (hours < 24) return `${hours}時間前`
    const days = Math.floor(hours / 24)
    if (days < 7) return `${days}日前`
    return new Date(dateStr).toLocaleDateString('ja-JP')
  }

  return (
    <div>
      <h2 className="text-lg font-bold text-text-primary mb-3 flex items-center gap-2">
        <Users className="w-5 h-5 text-teal" />
        チームの活動
      </h2>
      <div className="bg-bg-secondary rounded-card shadow-card overflow-hidden">
        {activities.slice(0, 5).map((item, index) => {
          const avatarConfig = parseAvatarString(item.avatar_url)
          const avatarUrl = getAvatarDataUrl(avatarConfig.character, avatarConfig.colorName)

          return (
            <div
              key={item.id}
              className={`flex items-center gap-3 px-3 py-2.5 cursor-pointer hover:bg-gray-50 transition-colors ${
                index !== Math.min(activities.length, 5) - 1 ? 'border-b border-border' : ''
              }`}
              onClick={() => navigate(`/videos/${item.video_id}`)}
            >
              <img
                src={avatarUrl}
                alt=""
                className="w-7 h-7 rounded-full flex-shrink-0"
              />
              <div className="flex-1 min-w-0">
                <p className="text-xs text-text-primary">
                  <span className="font-medium">{item.display_name}</span>
                  <span className="text-text-secondary">
                    {' '}が{' '}
                  </span>
                  <span className="font-medium truncate">{item.video_title}</span>
                  <span className="text-text-secondary">
                    {' '}を{item.completed ? '視聴完了' : '視聴中'}
                  </span>
                </p>
              </div>
              <div className="flex items-center gap-1.5 flex-shrink-0">
                {item.completed ? (
                  <CheckCircle className="w-3.5 h-3.5 text-success" />
                ) : (
                  <PlayCircle className="w-3.5 h-3.5 text-warning" />
                )}
                <span className="text-[10px] text-text-secondary whitespace-nowrap">
                  {timeAgo(item.updated_at)}
                </span>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
