import { create } from 'zustand'
import { supabase } from '@/lib/supabase'
import { db } from '@/lib/db'
import { syncVideosFromYouTube } from '@/lib/youtube'
import { VIDEOS_PAGE_SIZE } from '@/lib/constants'
import type { Video, VideoFilter } from '@/types'

interface VideoState {
  videos: Video[]
  currentVideo: Video | null
  filter: VideoFilter
  isLoading: boolean
  hasMore: boolean
  page: number
  totalCount: number
  lastSynced: number | null
  fetchVideos: (reset?: boolean) => Promise<void>
  fetchVideoById: (id: string) => Promise<void>
  setFilter: (filter: Partial<VideoFilter>) => void
  syncFromYouTube: () => Promise<void>
  loadMore: () => Promise<void>
}

export const useVideoStore = create<VideoState>((set, get) => ({
  videos: [],
  currentVideo: null,
  filter: { status: 'all', sortOrder: 'published_desc' },
  isLoading: false,
  hasMore: true,
  page: 0,
  totalCount: 0,
  lastSynced: null,

  fetchVideos: async (reset = false) => {
    const state = get()
    if (state.isLoading) return
    set({ isLoading: true })

    const page = reset ? 0 : state.page
    const from = page * VIDEOS_PAGE_SIZE
    const to = from + VIDEOS_PAGE_SIZE - 1

    try {
      // 総数を取得
      if (reset) {
        const { count } = await supabase.from('videos').select('*', { count: 'exact', head: true })
        set({ totalCount: count ?? 0 })
      }

      let query = supabase.from('videos').select('*')

      const { sortOrder } = state.filter
      if (sortOrder === 'published_asc') {
        query = query.order('published_at', { ascending: true })
      } else if (sortOrder === 'published_desc') {
        query = query.order('published_at', { ascending: false })
      } else {
        query = query.order('title', { ascending: true })
      }

      query = query.range(from, to)
      const { data, error } = await query

      if (error) throw error
      const videos = (data ?? []) as Video[]

      await db.videos.bulkPut(videos)

      set({
        videos: reset ? videos : [...state.videos, ...videos],
        page: page + 1,
        hasMore: videos.length === VIDEOS_PAGE_SIZE,
        isLoading: false,
      })
    } catch {
      const cached = await db.videos.toArray()
      set({
        videos: cached,
        isLoading: false,
        hasMore: false,
      })
    }
  },

  fetchVideoById: async (id: string) => {
    try {
      const { data } = await supabase
        .from('videos')
        .select('*')
        .eq('id', id)
        .single()
      if (data) {
        set({ currentVideo: data as Video })
        return
      }
    } catch {
      // fallback to IndexedDB
    }
    const cached = await db.videos.get(id)
    if (cached) set({ currentVideo: cached })
  },

  setFilter: (filter) => {
    set((state) => ({
      filter: { ...state.filter, ...filter },
      videos: [],
      page: 0,
      hasMore: true,
    }))
    get().fetchVideos(true)
  },

  syncFromYouTube: async () => {
    set({ isLoading: true })
    try {
      const videos = await syncVideosFromYouTube()

      // 古いデータを全て削除してから新しいデータを挿入
      await supabase.from('videos').delete().neq('id', '')
      await db.videos.clear()

      // バッチでupsert（50件ずつ）
      for (let i = 0; i < videos.length; i += 50) {
        const batch = videos.slice(i, i + 50)
        await supabase.from('videos').upsert(batch)
      }
      await db.videos.bulkPut(videos)
      set({ lastSynced: Date.now() })
      await get().fetchVideos(true)
    } catch (err) {
      console.error('syncFromYouTube error:', err)
      set({ isLoading: false })
    }
  },

  loadMore: async () => {
    const state = get()
    if (!state.hasMore || state.isLoading) return
    await state.fetchVideos()
  },
}))
