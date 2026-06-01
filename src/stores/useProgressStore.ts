import { create } from 'zustand'
import { supabase } from '@/lib/supabase'
import { db } from '@/lib/db'
import { enqueueSync } from '@/lib/sync'
import { COMPLETION_THRESHOLD } from '@/lib/constants'
import type { WatchProgress } from '@/types'

// watch_progress は UNIQUE(user_id, video_id) を持つ。
// upsert は必ずこのキーで衝突解決する（主キー id でやると新規 id 生成時に制約違反で保存が失敗する）。
const WATCH_PROGRESS_CONFLICT = 'user_id,video_id'

interface ProgressState {
  progressMap: Record<string, WatchProgress>
  isLoading: boolean
  clearProgress: () => void
  fetchUserProgress: (userId: string) => Promise<void>
  fetchVideoProgress: (userId: string, videoId: string) => Promise<void>
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

  // プレイヤー画面など、progressMap がまだ読み込まれていない場面でも
  // その動画の進捗を確実に取得する（直リンク・リロード・PWAコールドスタート対策）。
  // これが無いと「視聴済みなのに視聴中表示」「続きから再生不可」「新規 id 生成→保存失敗」が起きる。
  fetchVideoProgress: async (userId, videoId) => {
    try {
      const { data } = await supabase
        .from('watch_progress')
        .select('*')
        .eq('user_id', userId)
        .eq('video_id', videoId)
        .maybeSingle()

      if (data) {
        const item = data as WatchProgress
        set((state) => ({ progressMap: { ...state.progressMap, [videoId]: item } }))
        await db.watchProgress.put(item)
      }
    } catch {
      const cached = await db.watchProgress
        .where('[user_id+video_id]')
        .equals([userId, videoId])
        .first()
      if (cached) {
        set((state) => ({ progressMap: { ...state.progressMap, [videoId]: cached } }))
      }
    }
  },

  saveProgress: async (userId, videoId, watchedSeconds, totalSeconds, lastPositionSeconds) => {
    const existing = get().progressMap[videoId]
    const now = new Date().toISOString()
    const reachedThreshold = totalSeconds > 0 && watchedSeconds / totalSeconds >= COMPLETION_THRESHOLD
    // 一度完了した記録は視聴トラッキングで false に戻さない（巻き戻し＝反感の元）
    const completed = reachedThreshold || (existing?.completed ?? false)

    const progress: WatchProgress = {
      id: existing?.id ?? crypto.randomUUID(),
      user_id: userId,
      video_id: videoId,
      watched_seconds: Math.max(existing?.watched_seconds ?? 0, watchedSeconds),
      total_seconds: totalSeconds,
      completed,
      completed_at: completed ? (existing?.completed_at ?? now) : null,
      last_position_seconds: lastPositionSeconds,
      created_at: existing?.created_at ?? now,
      updated_at: now,
    }

    set((state) => ({
      progressMap: { ...state.progressMap, [videoId]: progress },
    }))

    await db.watchProgress.put(progress)

    // DB へは id を送らない。送ると衝突時に既存行の主キーを書き換えてしまい、
    // reactions などの参照（FK）を壊す。識別は user_id+video_id に任せる。
    const payload = {
      user_id: progress.user_id,
      video_id: progress.video_id,
      watched_seconds: progress.watched_seconds,
      total_seconds: progress.total_seconds,
      completed: progress.completed,
      completed_at: progress.completed_at,
      last_position_seconds: progress.last_position_seconds,
      updated_at: progress.updated_at,
    }

    if (navigator.onLine) {
      try {
        const { error } = await supabase
          .from('watch_progress')
          .upsert(payload, { onConflict: WATCH_PROGRESS_CONFLICT })
        if (error) throw error
      } catch {
        await enqueueSync('watch_progress', 'upsert', payload, WATCH_PROGRESS_CONFLICT)
      }
    } else {
      await enqueueSync('watch_progress', 'upsert', payload, WATCH_PROGRESS_CONFLICT)
    }
  },

  markCompleted: async (_userId, videoId) => {
    const existing = get().progressMap[videoId]
    if (!existing) return
    const now = new Date().toISOString()
    const updated = { ...existing, completed: true, completed_at: existing.completed_at ?? now, updated_at: now }

    set((state) => ({
      progressMap: { ...state.progressMap, [videoId]: updated },
    }))

    await db.watchProgress.put(updated)
    const payload = {
      user_id: updated.user_id,
      video_id: updated.video_id,
      completed: true,
      completed_at: updated.completed_at,
      updated_at: now,
    }
    if (navigator.onLine) {
      try {
        const { error } = await supabase
          .from('watch_progress')
          .upsert(payload, { onConflict: WATCH_PROGRESS_CONFLICT })
        if (error) throw error
      } catch {
        await enqueueSync('watch_progress', 'upsert', payload, WATCH_PROGRESS_CONFLICT)
      }
    } else {
      await enqueueSync('watch_progress', 'upsert', payload, WATCH_PROGRESS_CONFLICT)
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
    const payload = {
      user_id: progress.user_id,
      video_id: progress.video_id,
      watched_seconds: progress.watched_seconds,
      total_seconds: progress.total_seconds,
      completed: progress.completed,
      completed_at: progress.completed_at,
      last_position_seconds: progress.last_position_seconds,
      updated_at: progress.updated_at,
    }
    if (navigator.onLine) {
      try {
        const { error } = await supabase
          .from('watch_progress')
          .upsert(payload, { onConflict: WATCH_PROGRESS_CONFLICT })
        if (error) throw error
      } catch {
        await enqueueSync('watch_progress', 'upsert', payload, WATCH_PROGRESS_CONFLICT)
      }
    } else {
      await enqueueSync('watch_progress', 'upsert', payload, WATCH_PROGRESS_CONFLICT)
    }
  },

  getProgressForVideo: (videoId) => {
    return get().progressMap[videoId]
  },
}))
