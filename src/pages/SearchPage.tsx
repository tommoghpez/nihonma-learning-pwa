import { useState, useEffect } from 'react'
import { Search, X, Clock } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { db } from '@/lib/db'
import { SEARCH_DEBOUNCE_MS } from '@/lib/constants'
import { VideoList } from '@/components/video/VideoList'
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

export function SearchPage() {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<Video[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [recentSearches, setRecentSearches] = useState(getRecentSearches)
  const debouncedQuery = useDebounce(query.trim(), SEARCH_DEBOUNCE_MS)

  useEffect(() => {
    if (!debouncedQuery) {
      setResults([])
      return
    }

    async function search() {
      setIsLoading(true)
      try {
        const { data } = await supabase
          .from('videos')
          .select('*')
          .or(`title.ilike.%${debouncedQuery}%,description.ilike.%${debouncedQuery}%`)
          .order('published_at', { ascending: false })
          .limit(20)

        setResults((data ?? []) as Video[])
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
        setResults(cached)
      } finally {
        setIsLoading(false)
      }
    }

    search()
  }, [debouncedQuery])

  return (
    <div>
      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-text-secondary" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="動画を検索..."
          className="w-full pl-10 pr-10 py-3 border border-border rounded-card bg-bg-secondary text-text-primary focus:outline-none focus:ring-2 focus:ring-navy/50"
          autoFocus
        />
        {query && (
          <button
            onClick={() => { setQuery(''); setResults([]) }}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-text-secondary"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

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

      {debouncedQuery && (
        <>
          {!isLoading && results.length === 0 ? (
            <div className="text-center py-12 text-text-secondary">
              「{debouncedQuery}」に一致する動画が見つかりません
            </div>
          ) : (
            <VideoList videos={results} isLoading={isLoading} />
          )}
        </>
      )}

      {!debouncedQuery && recentSearches.length === 0 && (
        <div className="text-center py-12 text-text-secondary">
          タイトルや説明文で動画を検索できます
        </div>
      )}
    </div>
  )
}
