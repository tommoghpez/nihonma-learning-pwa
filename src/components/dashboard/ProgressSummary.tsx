import { useMemo } from 'react'
import { useProgressStore } from '@/stores/useProgressStore'
import { useVideoStore } from '@/stores/useVideoStore'
import { Card } from '@/components/common/Card'

export function ProgressSummary() {
  const progressMap = useProgressStore((s) => s.progressMap)
  const videos = useVideoStore((s) => s.videos)

  const stats = useMemo(() => {
    const totalVideos = videos.length
    const completedCount = Object.values(progressMap).filter((p) => p.completed).length
    const inProgressCount = Object.values(progressMap).filter(
      (p) => !p.completed && p.watched_seconds > 0
    ).length
    const totalWatchedSeconds = Object.values(progressMap).reduce(
      (sum, p) => sum + p.watched_seconds,
      0
    )
    const percentage = totalVideos > 0 ? Math.round((completedCount / totalVideos) * 100) : 0

    return { totalVideos, completedCount, inProgressCount, totalWatchedSeconds, percentage }
  }, [progressMap, videos])

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    if (hours > 0) return `${hours}時間${minutes}分`
    return `${minutes}分`
  }

  return (
    <div className="grid grid-cols-2 gap-3">
      <Card className="text-center">
        <div className="text-3xl font-bold text-navy">{stats.percentage}%</div>
        <div className="text-xs text-text-secondary mt-1">
          {stats.completedCount}/{stats.totalVideos}本完了
        </div>
      </Card>
      <Card className="text-center">
        <div className="text-3xl font-bold text-teal">
          {formatTime(stats.totalWatchedSeconds)}
        </div>
        <div className="text-xs text-text-secondary mt-1">総学習時間</div>
      </Card>
      <Card className="text-center">
        <div className="text-3xl font-bold text-warning">{stats.inProgressCount}</div>
        <div className="text-xs text-text-secondary mt-1">視聴中</div>
      </Card>
      <Card className="text-center">
        <div className="text-3xl font-bold text-success">{stats.completedCount}</div>
        <div className="text-xs text-text-secondary mt-1">完了</div>
      </Card>
    </div>
  )
}
