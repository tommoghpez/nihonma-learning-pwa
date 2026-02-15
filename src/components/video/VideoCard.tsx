import { useNavigate } from 'react-router-dom'
import { Play, RotateCcw, CheckCircle } from 'lucide-react'
import { formatDuration } from '@/lib/youtube'
import { useProgressStore } from '@/stores/useProgressStore'
import { Badge } from '@/components/common/Badge'
import type { Video } from '@/types'

interface VideoCardProps {
  video: Video
}

export function VideoCard({ video }: VideoCardProps) {
  const navigate = useNavigate()
  const progress = useProgressStore((s) => s.progressMap[video.id])

  const isCompleted = !!progress?.completed
  const isInProgress = !!progress && progress.watched_seconds > 0 && !isCompleted
  const percentage = progress?.total_seconds
    ? Math.round((progress.watched_seconds / progress.total_seconds) * 100)
    : 0

  // 残り時間を計算
  const remainingSeconds = isInProgress && video.duration_seconds
    ? Math.max(0, video.duration_seconds - (progress?.watched_seconds ?? 0))
    : 0

  const formatRemaining = (secs: number) => {
    const m = Math.ceil(secs / 60)
    return m >= 60 ? `${Math.floor(m / 60)}時間${m % 60}分` : `${m}分`
  }

  const getStatus = () => {
    if (isCompleted) return { label: '視聴完了', variant: 'success' as const }
    if (isInProgress) return { label: `視聴中 ${percentage}%`, variant: 'warning' as const }
    return { label: '未視聴', variant: 'default' as const }
  }

  const status = getStatus()

  return (
    <div
      className={`bg-bg-secondary rounded-card shadow-card overflow-hidden cursor-pointer hover:shadow-md transition-all group ${
        isCompleted ? 'ring-1 ring-success/30' : ''
      }`}
      onClick={() => navigate(`/videos/${video.id}`)}
    >
      <div className="relative aspect-video bg-gray-200">
        {video.thumbnail_url ? (
          <img
            src={video.thumbnail_url}
            alt={video.title}
            className={`w-full h-full object-cover transition-transform group-hover:scale-105 ${
              isCompleted ? 'brightness-90' : ''
            }`}
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-text-secondary">
            No Thumbnail
          </div>
        )}

        {/* 完了オーバーレイ */}
        {isCompleted && (
          <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
            <div className="bg-success text-white rounded-full p-2">
              <CheckCircle className="w-6 h-6" />
            </div>
          </div>
        )}

        {/* 続きから再生オーバーレイ */}
        {isInProgress && (
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center">
            <div className="opacity-0 group-hover:opacity-100 transition-opacity bg-white/95 text-navy rounded-full px-3 py-1.5 flex items-center gap-1.5 shadow-lg text-sm font-medium">
              <RotateCcw className="w-3.5 h-3.5" />
              続きから再生
            </div>
          </div>
        )}

        {/* 未視聴ホバーオーバーレイ */}
        {!isInProgress && !isCompleted && (
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center">
            <div className="opacity-0 group-hover:opacity-100 transition-opacity bg-white/95 text-navy rounded-full p-2.5 shadow-lg">
              <Play className="w-5 h-5" />
            </div>
          </div>
        )}

        {/* 再生時間 */}
        {video.duration_seconds != null && (
          <span className="absolute bottom-2 right-2 bg-black/80 text-white text-xs px-1.5 py-0.5 rounded">
            {isInProgress
              ? `残り${formatRemaining(remainingSeconds)}`
              : formatDuration(video.duration_seconds)}
          </span>
        )}

        {/* 進捗バー（サムネイル下部） */}
        {isInProgress && (
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-black/30">
            <div
              className="h-full bg-warning transition-all"
              style={{ width: `${percentage}%` }}
            />
          </div>
        )}
      </div>
      <div className="p-3">
        <h3 className={`text-sm font-medium line-clamp-2 mb-1.5 leading-snug ${
          isCompleted ? 'text-text-secondary' : 'text-text-primary'
        }`}>
          {video.title}
        </h3>
        <div className="flex items-center justify-between">
          <span className="text-xs text-text-secondary">
            {video.published_at
              ? new Date(video.published_at).toLocaleDateString('ja-JP')
              : ''}
          </span>
          <Badge variant={status.variant}>{status.label}</Badge>
        </div>
      </div>
    </div>
  )
}
