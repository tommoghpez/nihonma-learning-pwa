import { useEffect, useRef, useCallback } from 'react'
import { useProgressStore } from '@/stores/useProgressStore'
import { useAuthStore } from '@/stores/useAuthStore'
import { useUIStore } from '@/stores/useUIStore'
import { PROGRESS_SAVE_INTERVAL, COMPLETION_THRESHOLD } from '@/lib/constants'
import type ReactPlayer from 'react-player'

export function useWatchProgress(videoId: string, playerRef: React.RefObject<ReactPlayer | null>) {
  const user = useAuthStore((s) => s.user)
  const { saveProgress, progressMap, toggleCompleted } = useProgressStore()
  const addToast = useUIStore((s) => s.addToast)
  const hasNotifiedCompletion = useRef(false)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const progress = progressMap[videoId]

  const startTracking = useCallback(() => {
    if (intervalRef.current) return
    intervalRef.current = setInterval(() => {
      const player = playerRef.current
      if (!player || !user) return

      const currentTime = player.getCurrentTime()
      const duration = player.getDuration()
      if (!currentTime || !duration) return

      saveProgress(
        user.id,
        videoId,
        Math.floor(currentTime),
        Math.floor(duration),
        Math.floor(currentTime)
      )

      if (
        !hasNotifiedCompletion.current &&
        currentTime / duration >= COMPLETION_THRESHOLD
      ) {
        hasNotifiedCompletion.current = true
        addToast('動画の視聴が完了しました！', 'success')
      }
    }, PROGRESS_SAVE_INTERVAL)
  }, [videoId, user, saveProgress, playerRef, addToast])

  const stopTracking = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }
  }, [])

  useEffect(() => {
    return () => stopTracking()
  }, [stopTracking])

  const handleToggleCompleted = useCallback(() => {
    if (!user) return
    toggleCompleted(user.id, videoId)
  }, [user, videoId, toggleCompleted])

  return {
    progress,
    isCompleted: progress?.completed ?? false,
    lastPosition: progress?.last_position_seconds ?? 0,
    percentage: progress?.total_seconds
      ? Math.round((progress.watched_seconds / progress.total_seconds) * 100)
      : 0,
    startTracking,
    stopTracking,
    toggleCompleted: handleToggleCompleted,
  }
}
