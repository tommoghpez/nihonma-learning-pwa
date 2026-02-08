import { useMemo } from 'react'
import { useProgressStore } from '@/stores/useProgressStore'
import { useVideoStore } from '@/stores/useVideoStore'
import { BookOpen, Clock, Play, CheckCircle2 } from 'lucide-react'

export function ProgressSummary() {
  const progressMap = useProgressStore((s) => s.progressMap)
  const totalCount = useVideoStore((s) => s.totalCount)

  const stats = useMemo(() => {
    const totalVideos = totalCount // 全動画数を使用
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
  }, [progressMap, totalCount])

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    if (hours > 0) return `${hours}時間${minutes}分`
    return `${minutes}分`
  }

  return (
    <div className="space-y-4">
      {/* メイン進捗カード */}
      <div className="bg-gradient-to-br from-navy to-navy-600 rounded-card p-5 text-white shadow-card">
        <div className="flex items-center justify-between mb-4">
          <div>
            <div className="text-4xl font-bold">{stats.percentage}%</div>
            <div className="text-sm text-navy-200 mt-1">
              {stats.completedCount} / {stats.totalVideos}本完了
            </div>
          </div>
          <div className="w-16 h-16 rounded-full bg-white/10 flex items-center justify-center">
            <BookOpen className="w-8 h-8 text-teal-300" />
          </div>
        </div>
        {/* プログレスバー */}
        <div className="h-2 bg-white/20 rounded-full overflow-hidden">
          <div
            className="h-full bg-teal rounded-full transition-all duration-500"
            style={{ width: `${stats.percentage}%` }}
          />
        </div>
      </div>

      {/* サブ統計カード */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-teal-50 rounded-card p-3 text-center">
          <Clock className="w-5 h-5 text-teal mx-auto mb-1" />
          <div className="text-xl font-bold text-teal">
            {formatTime(stats.totalWatchedSeconds)}
          </div>
          <div className="text-[10px] text-text-secondary">学習時間</div>
        </div>
        <div className="bg-orange-50 rounded-card p-3 text-center">
          <Play className="w-5 h-5 text-warning mx-auto mb-1" />
          <div className="text-xl font-bold text-warning">{stats.inProgressCount}</div>
          <div className="text-[10px] text-text-secondary">視聴中</div>
        </div>
        <div className="bg-green-50 rounded-card p-3 text-center">
          <CheckCircle2 className="w-5 h-5 text-success mx-auto mb-1" />
          <div className="text-xl font-bold text-success">{stats.completedCount}</div>
          <div className="text-[10px] text-text-secondary">完了</div>
        </div>
      </div>
    </div>
  )
}
