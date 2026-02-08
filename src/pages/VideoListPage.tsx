import { useEffect, useState } from 'react'
import { useAuthStore } from '@/stores/useAuthStore'
import { useProgressStore } from '@/stores/useProgressStore'
import { useVideos } from '@/hooks/useVideos'
import { VideoList } from '@/components/video/VideoList'
import { DEVELOPER_EMAILS } from '@/lib/constants'
import { RefreshCw } from 'lucide-react'
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
  const { videos, isLoading, filter, setFilter, sentinelRef, syncFromYouTube, allVideos, totalCount } = useVideos()
  const [isSyncing, setIsSyncing] = useState(false)
  const [syncError, setSyncError] = useState<string | null>(null)

  // 開発者かどうか
  const isDeveloper = user && DEVELOPER_EMAILS.includes(user.email as typeof DEVELOPER_EMAILS[number])

  useEffect(() => {
    if (user) fetchUserProgress(user.id)
  }, [user])

  // 初回: 動画がなければ自動でYouTubeから同期（開発者のみ）
  useEffect(() => {
    if (!isLoading && allVideos.length === 0 && !isSyncing && isDeveloper) {
      handleSync()
    }
  }, [isLoading, allVideos.length, isDeveloper])

  const handleSync = async () => {
    setIsSyncing(true)
    setSyncError(null)
    try {
      await syncFromYouTube()
    } catch (err) {
      console.error('YouTube sync failed:', err)
      setSyncError('YouTube同期に失敗しました。APIキーやチャンネルIDを確認してください。')
    } finally {
      setIsSyncing(false)
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-xl font-bold text-text-primary">動画一覧</h1>
          {totalCount > 0 && (
            <p className="text-sm text-text-secondary mt-0.5">全 {totalCount} 件</p>
          )}
        </div>
{isDeveloper && (
          <button
            onClick={handleSync}
            disabled={isSyncing}
            className="flex items-center gap-1.5 px-3 py-1.5 text-sm bg-navy text-white rounded-btn hover:bg-navy/90 disabled:opacity-50 transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`} />
            {isSyncing ? '同期中...' : 'YouTube同期'}
          </button>
        )}
      </div>

      {syncError && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded-card">
          {syncError}
        </div>
      )}

      {isSyncing && allVideos.length === 0 && (
        <div className="text-center py-12 text-text-secondary">
          <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-3 text-navy" />
          <p>YouTubeから動画を取得中...</p>
          <p className="text-xs mt-1">初回は少し時間がかかります</p>
        </div>
      )}

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
