import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { Play, RotateCcw } from 'lucide-react'
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
      <div className="text-center py-4 text-text-secondary text-sm">
        すべての動画を視聴済みです
      </div>
    )
  }

  return (
    <div className="space-y-3">
      <h2 className="text-lg font-bold text-text-primary">次に見る動画</h2>
      {nextVideos.map((video) => {
        const progress = progressMap[video.id]
        const isResume = progress && progress.watched_seconds > 0

        return (
          <Card
            key={video.id}
            onClick={() => navigate(`/videos/${video.id}`)}
            className="flex gap-3"
          >
            <div className="relative w-28 flex-shrink-0 aspect-video rounded overflow-hidden bg-gray-200">
              {video.thumbnail_url && (
                <img
                  src={video.thumbnail_url}
                  alt=""
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
              )}
              {video.duration_seconds != null && (
                <span className="absolute bottom-1 right-1 bg-black/70 text-white text-[10px] px-1 rounded">
                  {formatDuration(video.duration_seconds)}
                </span>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-sm font-medium text-text-primary line-clamp-2">
                {video.title}
              </h3>
              <div className="mt-1">
                {isResume ? (
                  <Badge variant="warning">
                    <RotateCcw className="w-3 h-3 mr-1" />
                    続きから再生
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
