import { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search, X, Clock, Play, FileText, Sparkles } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { db } from '@/lib/db'
import { SEARCH_DEBOUNCE_MS } from '@/lib/constants'
import { VideoList } from '@/components/video/VideoList'
import { useVideoStore } from '@/stores/useVideoStore'
import { useProgressStore } from '@/stores/useProgressStore'
import { useAuthStore } from '@/stores/useAuthStore'
import type { Video } from '@/types'

function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState(value)
  useEffect(() => {
    const handler = setTimeout(() => setDebouncedValue(value), delay)
    return () => clearTimeout(handler)
  }, [value, delay])
  return debouncedValue
}

const RECENT_SEARCHES_KEY = 'nihonma-recent-searches'

function getRecentSearches(): string[] {
  try {
    return JSON.parse(localStorage.getItem(RECENT_SEARCHES_KEY) || '[]')
  } catch {
    return []
  }
}

function addRecentSearch(query: string) {
  const recent = getRecentSearches().filter((s) => s !== query)
  recent.unshift(query)
  localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(recent.slice(0, 5)))
}

interface NoteResult {
  id: string
  video_id: string
  content: string
  updated_at: string
  video_title?: string
}

type SearchTab = 'videos' | 'notes'

export function SearchPage() {
  const navigate = useNavigate()
  const userId = useAuthStore((s) => s.user?.id)
  const videos = useVideoStore((s) => s.videos)
  const progressMap = useProgressStore((s) => s.progressMap)
  const [query, setQuery] = useState('')
  const [tab, setTab] = useState<SearchTab>('videos')
  const [videoResults, setVideoResults] = useState<Video[]>([])
  const [noteResults, setNoteResults] = useState<NoteResult[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [recentSearches, setRecentSearches] = useState(getRecentSearches)
  const debouncedQuery = useDebounce(query.trim(), SEARCH_DEBOUNCE_MS)

  // おすすめ動画（未視聴のものから3件）
  const recommendedVideos = useMemo(() => {
    return videos
      .filter((v) => !progressMap[v.id] || progressMap[v.id].watched_seconds === 0)
      .slice(0, 3)
  }, [videos, progressMap])

  // 動画検索
  useEffect(() => {
    if (!debouncedQuery) {
      setVideoResults([])
      return
    }

    async function searchVideos() {
      setIsLoading(true)
      try {
        const { data } = await supabase
          .from('videos')
          .select('*')
          .or(`title.ilike.%${debouncedQuery}%,description.ilike.%${debouncedQuery}%`)
          .order('published_at', { ascending: false })
          .limit(20)

        setVideoResults((data ?? []) as Video[])
        addRecentSearch(debouncedQuery)
        setRecentSearches(getRecentSearches())
      } catch {
        const cached = await db.videos
          .filter(
            (v) =>
              v.title.toLowerCase().includes(debouncedQuery.toLowerCase()) ||
              (v.description ?? '').toLowerCase().includes(debouncedQuery.toLowerCase())
          )
          .limit(20)
          .toArray()
        setVideoResults(cached)
      } finally {
        setIsLoading(false)
      }
    }

    searchVideos()
  }, [debouncedQuery])

  // ノート検索
  useEffect(() => {
    if (!debouncedQuery || !userId) {
      setNoteResults([])
      return
    }

    async function searchNotes() {
      try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { data } = await supabase
          .from('summaries')
          .select(`
            id,
            video_id,
            content,
            updated_at,
            videos (title)
          `)
          .eq('user_id', userId)
          .ilike('content', `%${debouncedQuery}%`)
          .order('updated_at', { ascending: false })
          .limit(10)

        if (data) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          setNoteResults(data.map((n: any) => ({
            id: n.id,
            video_id: n.video_id,
            content: n.content,
            updated_at: n.updated_at,
            video_title: n.videos?.title,
          })))
        }
      } catch {
        // オフライン時はローカルから
        const cached = await db.summaries
          .where('user_id')
          .equals(userId!)
          .filter((s) => s.content.toLowerCase().includes(debouncedQuery.toLowerCase()))
          .limit(10)
          .toArray()
        setNoteResults(cached.map((n) => ({
          id: n.id,
          video_id: n.video_id,
          content: n.content,
          updated_at: n.updated_at,
        })))
      }
    }

    searchNotes()
  }, [debouncedQuery, userId])

  const currentResults = tab === 'videos' ? videoResults : noteResults
  const resultCount = tab === 'videos' ? videoResults.length : noteResults.length

  return (
    <div>
      {/* 検索バー */}
      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-text-secondary" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="動画やノートを検索..."
          className="w-full pl-10 pr-10 py-3 border border-border rounded-card bg-bg-secondary text-text-primary focus:outline-none focus:ring-2 focus:ring-navy/50"
          autoFocus
        />
        {query && (
          <button
            onClick={() => { setQuery(''); setVideoResults([]); setNoteResults([]) }}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-text-secondary"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* タブ切替 */}
      {debouncedQuery && (
        <div className="flex gap-2 mb-4">
          <button
            onClick={() => setTab('videos')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm transition-colors ${
              tab === 'videos'
                ? 'bg-navy text-white'
                : 'bg-gray-100 text-text-secondary hover:bg-gray-200'
            }`}
          >
            <Play className="w-3.5 h-3.5" />
            動画
            {videoResults.length > 0 && (
              <span className="bg-white/20 text-xs px-1.5 rounded-full">{videoResults.length}</span>
            )}
          </button>
          <button
            onClick={() => setTab('notes')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm transition-colors ${
              tab === 'notes'
                ? 'bg-navy text-white'
                : 'bg-gray-100 text-text-secondary hover:bg-gray-200'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            ノート
            {noteResults.length > 0 && (
              <span className="bg-white/20 text-xs px-1.5 rounded-full">{noteResults.length}</span>
            )}
          </button>
        </div>
      )}

      {/* 最近の検索 */}
      {!debouncedQuery && recentSearches.length > 0 && (
        <div className="mb-6">
          <h2 className="text-sm font-medium text-text-secondary mb-2">最近の検索</h2>
          <div className="space-y-1">
            {recentSearches.map((search) => (
              <button
                key={search}
                onClick={() => setQuery(search)}
                className="flex items-center gap-2 w-full px-3 py-2 text-sm text-text-primary hover:bg-gray-50 rounded"
              >
                <Clock className="w-4 h-4 text-text-secondary" />
                {search}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* 検索結果 */}
      {debouncedQuery && (
        <>
          {/* 結果件数 */}
          {!isLoading && (
            <p className="text-xs text-text-secondary mb-3">
              {resultCount > 0
                ? `${resultCount}件見つかりました`
                : `「${debouncedQuery}」に一致する${tab === 'videos' ? '動画' : 'ノート'}が見つかりません`
              }
            </p>
          )}

          {/* 動画結果 */}
          {tab === 'videos' && (
            currentResults.length > 0 || isLoading ? (
              <VideoList videos={videoResults} isLoading={isLoading} />
            ) : null
          )}

          {/* ノート結果 */}
          {tab === 'notes' && noteResults.length > 0 && (
            <div className="space-y-3">
              {noteResults.map((note) => (
                <div
                  key={note.id}
                  className="bg-bg-secondary rounded-card shadow-card p-3 cursor-pointer hover:shadow-md transition-shadow"
                  onClick={() => navigate(`/videos/${note.video_id}/note`)}
                >
                  <h3 className="text-sm font-medium text-text-primary line-clamp-1">
                    {note.video_title || '動画タイトル'}
                  </h3>
                  <p className="text-xs text-text-secondary mt-1 line-clamp-3 leading-relaxed">
                    {note.content}
                  </p>
                  <span className="text-[10px] text-text-secondary mt-2 block">
                    {new Date(note.updated_at).toLocaleDateString('ja-JP')}
                  </span>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* おすすめ動画（検索前・最近の検索なし） */}
      {!debouncedQuery && recommendedVideos.length > 0 && (
        <div className="mb-6">
          <h2 className="text-sm font-medium text-text-secondary mb-3 flex items-center gap-1.5">
            <Sparkles className="w-4 h-4 text-warning" />
            おすすめの未視聴動画
          </h2>
          <VideoList videos={recommendedVideos} isLoading={false} />
        </div>
      )}

      {!debouncedQuery && recentSearches.length === 0 && recommendedVideos.length === 0 && (
        <div className="text-center py-12 text-text-secondary">
          タイトルや説明文で動画・ノートを検索できます
        </div>
      )}
    </div>
  )
}
