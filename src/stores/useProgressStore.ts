import { create } from 'zustand'
import { supabase } from '@/lib/supabase'
import { db } from '@/lib/db'
import { enqueueSync } from '@/lib/sync'
import { COMPLETION_THRESHOLD } from '@/lib/constants'
import type { WatchProgress } from '@/types'

interface ProgressState {
  progressMap: Record<string, WatchProgress>
  isLoading: boolean
  clearProgress: () => void
  fetchUserProgress: (userId: string) => Promise<void>
  saveProgress: (
    userId: string,
    videoId: string,
    watchedSeconds: number,
    totalSeconds: number,
    lastPositionSeconds: number
  ) => Promise<void>
  markCompleted: (userId: string, videoId: string) => Promise<void>
  toggleCompleted: (userId: string, videoId: string) => Promise<void>
  getProgressForVideo: (videoId: string) => WatchProgress | undefined
}

export const useProgressStore = create<ProgressState>((set, get) => ({
  progressMap: {},
  isLoading: false,

  clearProgress: () => set({ progressMap: {}, isLoading: false }),

  fetchUserProgress: async (userId: string) => {
    set({ isLoading: true })
    try {
      const { data } = await supabase
        .from('watch_progress')
        .select('*')
        .eq('user_id', userId)

      const items = (data ?? []) as WatchProgress[]
      const map: Record<string, WatchProgress> = {}
      for (const item of items) {
        map[item.video_id] = item
        await db.watchProgress.put(item)
      }
      set({ progressMap: map, isLoading: false })
    } catch {
      const cached = await db.watchProgress
        .where('user_id')
        .equals(userId)
        .toArray()
      const map: Record<string, WatchProgress> = {}
      for (const item of cached) {
        map[item.video_id] = item
      }
      set({ progressMap: map, isLoading: false })
    }
  },

  saveProgress: async (userId, videoId, watchedSeconds, totalSeconds, lastPositionSeconds) => {
    const existing = get().progressMap[videoId]
    const now = new Date().toISOString()
    const completed = totalSeconds > 0 && watchedSeconds / totalSeconds >= COMPLETION_THRESHOLD

    const progress: WatchProgress = {
      id: existing?.id ?? crypto.randomUUID(),
      user_id: userId,
      video_id: videoId,
      watched_seconds: Math.max(existing?.watched_seconds ?? 0, watchedSeconds),
      total_seconds: totalSeconds,
      completed: completed || (existing?.completed ?? false),
      completed_at: completed && !existing?.completed ? now : (existing?.completed_at ?? null),
      last_position_seconds: lastPositionSeconds,
      created_at: existing?.created_at ?? now,
      updated_at: now,
    }

    set((state) => ({
      progressMap: { ...state.progressMap, [videoId]: progress },
    }))

    await db.watchProgress.put(progress)

    if (navigator.onLine) {
      try {
        await supabase.from('watch_progress').upsert({
          id: progress.id,
          user_id: progress.user_id,
          video_id: progress.video_id,
          watched_seconds: progress.watched_seconds,
          total_seconds: progress.total_seconds,
          completed: progress.completed,
          completed_at: progress.completed_at,
          last_position_seconds: progress.last_position_seconds,
          updated_at: progress.updated_at,
        })
      } catch {
        await enqueueSync('watch_progress', 'upsert', progress as unknown as Record<string, unknown>)
      }
    } else {
      await enqueueSync('watch_progress', 'upsert', progress as unknown as Record<string, unknown>)
    }
  },

  markCompleted: async (_userId, videoId) => {
    const existing = get().progressMap[videoId]
    if (!existing) return
    const now = new Date().toISOString()
    const updated = { ...existing, completed: true, completed_at: now, updated_at: now }

    set((state) => ({
      progressMap: { ...state.progressMap, [videoId]: updated },
    }))

    await db.watchProgress.put(updated)
    if (navigator.onLine) {
      await supabase.from('watch_progress').upsert({
        id: updated.id,
        user_id: updated.user_id,
        video_id: updated.video_id,
        completed: true,
        completed_at: now,
        updated_at: now,
      })
    } else {
      await enqueueSync('watch_progress', 'upsert', updated as unknown as Record<string, unknown>)
    }
  },

  toggleCompleted: async (userId, videoId) => {
    const existing = get().progressMap[videoId]
    const wasCompleted = existing?.completed ?? false
    const now = new Date().toISOString()

    const progress: WatchProgress = {
      id: existing?.id ?? crypto.randomUUID(),
      user_id: userId,
      video_id: videoId,
      watched_seconds: existing?.watched_seconds ?? 0,
      total_seconds: existing?.total_seconds ?? null,
      completed: !wasCompleted,
      completed_at: !wasCompleted ? now : null,
      last_position_seconds: existing?.last_position_seconds ?? 0,
      created_at: existing?.created_at ?? now,
      updated_at: now,
    }

    set((state) => ({
      progressMap: { ...state.progressMap, [videoId]: progress },
    }))

    await db.watchProgress.put(progress)
    if (navigator.onLine) {
      await supabase.from('watch_progress').upsert(progress as never)
    } else {
      await enqueueSync('watch_progress', 'upsert', progress as unknown as Record<string, unknown>)
    }
  },

  getProgressForVideo: (videoId) => {
    return get().progressMap[videoId]
  },
}))
