import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { Play, RotateCcw, ChevronRight } from 'lucide-react'
import { useVideoStore } from '@/stores/useVideoStore'
import { useProgressStore } from '@/stores/useProgressStore'
import { Card } from '@/components/common/Card'
import { Badge } from '@/components/common/Badge'
import { formatDuration } from '@/lib/youtube'

export function NextVideoSection() {
  const navigate = useNavigate()
  const videos = useVideoStore((s) => s.videos)
  const progressMap = useProgressStore((s) => s.progressMap)

  const nextVideos = useMemo(() => {
    const inProgress = videos
      .filter((v) => {
        const p = progressMap[v.id]
        return p && !p.completed && p.watched_seconds > 0
      })
      .sort((a, b) => {
        const pa = progressMap[a.id]
        const pb = progressMap[b.id]
        return new Date(pb.updated_at).getTime() - new Date(pa.updated_at).getTime()
      })

    const unwatched = videos
      .filter((v) => !progressMap[v.id] || progressMap[v.id].watched_seconds === 0)
      .sort((a, b) => {
        const da = a.published_at ? new Date(a.published_at).getTime() : 0
        const db = b.published_at ? new Date(b.published_at).getTime() : 0
        return da - db
      })

    return [...inProgress, ...unwatched].slice(0, 3)
  }, [videos, progressMap])

  if (nextVideos.length === 0) {
    return (
      <div className="text-center py-8 text-text-secondary text-sm bg-gray-50 rounded-card">
        <div className="text-3xl mb-2">🎉</div>
        すべての動画を視聴済みです！
      </div>
    )
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-text-primary">次に見る動画</h2>
        <button
          onClick={() => navigate('/videos')}
          className="text-sm text-teal flex items-center gap-0.5 hover:text-teal-600 transition-colors"
        >
          すべて見る
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
      {nextVideos.map((video, index) => {
        const progress = progressMap[video.id]
        const isResume = progress && progress.watched_seconds > 0
        const progressPercent = isResume && video.duration_seconds
          ? Math.round((progress.watched_seconds / video.duration_seconds) * 100)
          : 0

        return (
          <Card
            key={video.id}
            onClick={() => navigate(`/videos/${video.id}`)}
            className={`flex gap-3 animate-fade-in`}
            style={{ animationDelay: `${index * 50}ms` }}
          >
            <div className="relative w-28 flex-shrink-0 aspect-video rounded-lg overflow-hidden bg-gray-200">
              {video.thumbnail_url && (
                <img
                  src={video.thumbnail_url}
                  alt=""
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
              )}
              {video.duration_seconds != null && (
                <span className="absolute bottom-1 right-1 bg-black/80 text-white text-[10px] px-1.5 py-0.5 rounded">
                  {formatDuration(video.duration_seconds)}
                </span>
              )}
              {/* 再生進捗バー */}
              {isResume && (
                <div className="absolute bottom-0 left-0 right-0 h-1 bg-black/30">
                  <div
                    className="h-full bg-teal"
                    style={{ width: `${progressPercent}%` }}
                  />
                </div>
              )}
            </div>
            <div className="flex-1 min-w-0 py-1">
              <h3 className="text-sm font-medium text-text-primary line-clamp-2 leading-snug">
                {video.title}
              </h3>
              <div className="mt-2">
                {isResume ? (
                  <Badge variant="warning">
                    <RotateCcw className="w-3 h-3 mr-1" />
                    続きから（{progressPercent}%）
                  </Badge>
                ) : (
                  <Badge variant="navy">
                    <Play className="w-3 h-3 mr-1" />
                    新しい動画
                  </Badge>
                )}
              </div>
            </div>
          </Card>
        )
      })}
    </div>
  )
}
