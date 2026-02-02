import { VideoCard } from './VideoCard'
import { LoadingSpinner } from '@/components/common/LoadingSpinner'
import type { Video } from '@/types'

interface VideoListProps {
  videos: Video[]
  isLoading: boolean
  sentinelRef?: React.Ref<HTMLDivElement>
}

export function VideoList({ videos, isLoading, sentinelRef }: VideoListProps) {
  if (!isLoading && videos.length === 0) {
    return (
      <div className="text-center py-12 text-text-secondary">
        動画が見つかりません
      </div>
    )
  }

  return (
    <div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {videos.map((video) => (
          <VideoCard key={video.id} video={video} />
        ))}
      </div>
      {isLoading && <LoadingSpinner className="py-8" />}
      {sentinelRef && <div ref={sentinelRef} className="h-4" />}
    </div>
  )
}
