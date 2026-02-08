import { useEffect, useRef, useCallback } from 'react'
import { useVideoStore } from '@/stores/useVideoStore'
import { useProgressStore } from '@/stores/useProgressStore'

export function useVideos() {
  const store = useVideoStore()
  const progressMap = useProgressStore((s) => s.progressMap)
  const sentinelRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    if (store.videos.length === 0) {
      store.fetchVideos(true)
    }
  }, [])

  useEffect(() => {
    const sentinel = sentinelRef.current
    if (!sentinel) return

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && store.hasMore && !store.isLoading) {
          store.loadMore()
        }
      },
      { threshold: 0.1 }
    )

    observer.observe(sentinel)
    return () => observer.disconnect()
  }, [store.hasMore, store.isLoading])

  const getFilteredVideos = useCallback(() => {
    const { status } = store.filter
    if (status === 'all') return store.videos

    return store.videos.filter((video) => {
      const progress = progressMap[video.id]
      if (status === 'completed') return progress?.completed
      if (status === 'watching') return progress && !progress.completed && progress.watched_seconds > 0
      if (status === 'unwatched') return !progress || progress.watched_seconds === 0
      return true
    })
  }, [store.videos, store.filter.status, progressMap])

  return {
    videos: getFilteredVideos(),
    allVideos: store.videos,
    isLoading: store.isLoading,
    hasMore: store.hasMore,
    filter: store.filter,
    setFilter: store.setFilter,
    sentinelRef,
    totalCount: store.totalCount,
    syncFromYouTube: store.syncFromYouTube,
  }
}
