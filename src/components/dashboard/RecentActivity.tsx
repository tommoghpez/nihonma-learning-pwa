import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { CheckCircle, PlayCircle, Clock } from 'lucide-react'
import { useProgressStore } from '@/stores/useProgressStore'
import { useVideoStore } from '@/stores/useVideoStore'

export function RecentActivity() {
  const navigate = useNavigate()
  const progressMap = useProgressStore((s) => s.progressMap)
  const videos = useVideoStore((s) => s.videos)

  const recentItems = useMemo(() => {
    const videoMap = new Map(videos.map((v) => [v.id, v]))
    return Object.values(progressMap)
      .filter((p) => p.watched_seconds > 0)
      .sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime())
      .slice(0, 5)
      .map((p) => ({
        ...p,
        video: videoMap.get(p.video_id),
      }))
  }, [progressMap, videos])

  if (recentItems.length === 0) return null

  const timeAgo = (dateStr: string) => {
    const diff = Date.now() - new Date(dateStr).getTime()
    const minutes = Math.floor(diff / 60000)
    if (minutes < 1) return 'たった今'
    if (minutes < 60) return `${minutes}分前`
    const hours = Math.floor(minutes / 60)
    if (hours < 24) return `${hours}時間前`
    const days = Math.floor(hours / 24)
    return `${days}日前`
  }

  return (
    <div>
      <h2 className="text-lg font-bold text-text-primary mb-3 flex items-center gap-2">
        <Clock className="w-5 h-5 text-text-secondary" />
        最近の活動
      </h2>
      <div className="bg-bg-secondary rounded-card shadow-card overflow-hidden">
        {recentItems.map((item, index) => (
          <div
            key={item.id}
            onClick={() => navigate(`/videos/${item.video_id}`)}
            className={`flex items-center gap-3 p-3 cursor-pointer hover:bg-gray-50 transition-colors ${
              index !== recentItems.length - 1 ? 'border-b border-border' : ''
            }`}
          >
            <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
              item.completed ? 'bg-green-100' : 'bg-orange-100'
            }`}>
              {item.completed ? (
                <CheckCircle className="w-4 h-4 text-success" />
              ) : (
                <PlayCircle className="w-4 h-4 text-warning" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm text-text-primary truncate font-medium">
                {item.video?.title ?? item.video_id}
              </p>
              <p className="text-xs text-text-secondary">
                {item.completed ? '視聴完了' : '視聴中'} · {timeAgo(item.updated_at)}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
