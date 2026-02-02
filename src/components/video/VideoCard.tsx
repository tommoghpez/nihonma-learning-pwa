import { useNavigate } from 'react-router-dom'
import { formatDuration } from '@/lib/youtube'
import { useProgressStore } from '@/stores/useProgressStore'
import { Badge } from '@/components/common/Badge'
import { ProgressBar } from '@/components/common/ProgressBar'
import type { Video } from '@/types'

interface VideoCardProps {
  video: Video
}

export function VideoCard({ video }: VideoCardProps) {
  const navigate = useNavigate()
  const progress = useProgressStore((s) => s.progressMap[video.id])

  const percentage = progress?.total_seconds
    ? Math.round((progress.watched_seconds / progress.total_seconds) * 100)
    : 0

  const getStatus = () => {
    if (progress?.completed) return { label: '完了', variant: 'success' as const }
    if (progress && progress.watched_seconds > 0) return { label: '視聴中', variant: 'warning' as const }
    return { label: '未視聴', variant: 'default' as const }
  }

  const status = getStatus()

  return (
    <div
      className="bg-bg-secondary rounded-card shadow-card overflow-hidden cursor-pointer hover:shadow-md transition-shadow"
      onClick={() => navigate(`/videos/${video.id}`)}
    >
      <div className="relative aspect-video bg-gray-200">
        {video.thumbnail_url ? (
          <img
            src={video.thumbnail_url}
            alt={video.title}
            className="w-full h-full object-cover"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-text-secondary">
            No Thumbnail
          </div>
        )}
        {video.duration_seconds != null && (
          <span className="absolute bottom-2 right-2 bg-black/70 text-white text-xs px-1.5 py-0.5 rounded">
            {formatDuration(video.duration_seconds)}
          </span>
        )}
      </div>
      <div className="p-3">
        <h3 className="text-sm font-medium text-text-primary line-clamp-2 mb-1">
          {video.title}
        </h3>
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs text-text-secondary">
            {video.published_at
              ? new Date(video.published_at).toLocaleDateString('ja-JP')
              : ''}
          </span>
          <Badge variant={status.variant}>{status.label}</Badge>
        </div>
        {progress && !progress.completed && progress.watched_seconds > 0 && (
          <ProgressBar value={percentage} color="warning" />
        )}
      </div>
    </div>
  )
}
