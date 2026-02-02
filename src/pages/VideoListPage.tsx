import { useEffect } from 'react'
import { useAuthStore } from '@/stores/useAuthStore'
import { useProgressStore } from '@/stores/useProgressStore'
import { useVideos } from '@/hooks/useVideos'
import { VideoList } from '@/components/video/VideoList'
import type { VideoStatus, SortOrder } from '@/types'

const statusOptions: { value: VideoStatus; label: string }[] = [
  { value: 'all', label: 'すべて' },
  { value: 'unwatched', label: '未視聴' },
  { value: 'watching', label: '視聴中' },
  { value: 'completed', label: '完了' },
]

const sortOptions: { value: SortOrder; label: string }[] = [
  { value: 'published_asc', label: '公開日（古い順）' },
  { value: 'published_desc', label: '公開日（新しい順）' },
  { value: 'title', label: 'タイトル' },
]

export function VideoListPage() {
  const user = useAuthStore((s) => s.user)
  const fetchUserProgress = useProgressStore((s) => s.fetchUserProgress)
  const { videos, isLoading, filter, setFilter, sentinelRef } = useVideos()

  useEffect(() => {
    if (user) fetchUserProgress(user.id)
  }, [user])

  return (
    <div>
      <h1 className="text-xl font-bold text-text-primary mb-4">動画一覧</h1>

      <div className="mb-4 space-y-3">
        <div className="flex gap-2 overflow-x-auto pb-1">
          {statusOptions.map((opt) => (
            <button
              key={opt.value}
              onClick={() => setFilter({ status: opt.value })}
              className={`px-3 py-1.5 rounded-full text-sm whitespace-nowrap transition-colors ${
                filter.status === opt.value
                  ? 'bg-navy text-white'
                  : 'bg-gray-100 text-text-secondary hover:bg-gray-200'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>

        <select
          value={filter.sortOrder}
          onChange={(e) => setFilter({ sortOrder: e.target.value as SortOrder })}
          className="px-3 py-1.5 text-sm border border-border rounded-btn bg-bg-secondary text-text-primary"
        >
          {sortOptions.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>

      <VideoList videos={videos} isLoading={isLoading} sentinelRef={sentinelRef} />
    </div>
  )
}
