import { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { FileText, Play, Calendar, RefreshCw, PenLine, BookOpen } from 'lucide-react'
import { supabase, withTimeout } from '@/lib/supabase'
import { db } from '@/lib/db'
import { useAuthStore } from '@/stores/useAuthStore'
import { LoadingSpinner } from '@/components/common/LoadingSpinner'
import { Button } from '@/components/common/Button'

interface NoteWithVideo {
  id: string
  video_id: string
  content: string
  updated_at: string
  video_title?: string
  video_thumbnail?: string
}

export function NotesListPage() {
  const userId = useAuthStore((s) => s.user?.id)
  const navigate = useNavigate()
  const [notes, setNotes] = useState<NoteWithVideo[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false

    async function loadNotes() {
      if (!userId) {
        setIsLoading(false)
        return
      }
      setIsLoading(true)
      setError(null)

      try {
        const { data, error: queryError } = await withTimeout(
          supabase
            .from('summaries')
            .select(`
              id,
              video_id,
              content,
              updated_at,
              videos (
                title,
                thumbnail_url
              )
            `)
            .eq('user_id', userId)
            .order('updated_at', { ascending: false }),
          10000
        )

        if (cancelled) return

        if (queryError) {
          console.error('Supabase error:', queryError)
          throw queryError
        }

        if (data) {
          setNotes(
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            data.map((n: any) => ({
              id: n.id,
              video_id: n.video_id,
              content: n.content,
              updated_at: n.updated_at,
              video_title: n.videos?.title,
              video_thumbnail: n.videos?.thumbnail_url,
            }))
          )
        } else {
          setNotes([])
        }
      } catch (err) {
        if (cancelled) return
        console.error('Failed to load notes:', err)

        // オフライン時はローカルDBから取得
        try {
          const cached = await db.summaries
            .where('user_id')
            .equals(userId)
            .toArray()

          const videos = await db.videos.toArray()
          const videoMap = new Map(videos.map((v) => [v.id, v]))

          if (cancelled) return

          setNotes(
            cached
              .map((n) => ({
                id: n.id,
                video_id: n.video_id,
                content: n.content,
                updated_at: n.updated_at,
                video_title: videoMap.get(n.video_id)?.title,
                video_thumbnail: videoMap.get(n.video_id)?.thumbnail_url ?? undefined,
              }))
              .sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime())
          )
        } catch {
          if (!cancelled) {
            setError('ノートの読み込みに失敗しました')
          }
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false)
        }
      }
    }

    loadNotes()
    return () => { cancelled = true }
  }, [userId])

  // 統計情報
  const stats = useMemo(() => {
    const totalChars = notes.reduce((sum, n) => sum + n.content.length, 0)
    return { totalNotes: notes.length, totalChars }
  }, [notes])

  // 相対日時フォーマット
  const formatRelativeDate = (dateStr: string) => {
    const date = new Date(dateStr)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

    if (diffDays === 0) return '今日'
    if (diffDays === 1) return '昨日'
    if (diffDays < 7) return `${diffDays}日前`
    return date.toLocaleDateString('ja-JP')
  }

  if (isLoading) {
    return <LoadingSpinner className="py-12" />
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-red-500 mb-3">{error}</p>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => window.location.reload()}
        >
          <RefreshCw className="w-4 h-4 mr-1" />
          再読み込み
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* ヘッダー + 統計 */}
      <div>
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold text-text-primary flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-navy" />
            学習ノート
          </h1>
        </div>
        {stats.totalNotes > 0 && (
          <div className="flex gap-4 mt-2">
            <div className="flex items-center gap-1.5 text-sm text-text-secondary">
              <PenLine className="w-3.5 h-3.5" />
              <span>{stats.totalNotes} 件のノート</span>
            </div>
            <div className="flex items-center gap-1.5 text-sm text-text-secondary">
              <FileText className="w-3.5 h-3.5" />
              <span>合計 {stats.totalChars.toLocaleString()} 文字</span>
            </div>
          </div>
        )}
      </div>

      {notes.length === 0 ? (
        <div className="text-center py-12">
          <div className="w-16 h-16 mx-auto mb-4 bg-navy/10 rounded-full flex items-center justify-center">
            <PenLine className="w-8 h-8 text-navy" />
          </div>
          <p className="text-text-primary font-medium text-lg">ノートはまだありません</p>
          <p className="text-sm text-text-secondary mt-2 max-w-xs mx-auto">
            動画を視聴しながら学んだことをメモしましょう。動画再生中にノートが自動表示されます。
          </p>
          <Button
            className="mt-4"
            onClick={() => navigate('/videos')}
          >
            <Play className="w-4 h-4 mr-1" />
            動画を見に行く
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          {notes.map((note, index) => {
            // コンテンツからテンプレート部分を除いた実質的なメモ
            const cleanContent = note.content
              .replace(/^## .*$/gm, '')
              .replace(/^-\s*$/gm, '')
              .trim()
            const charCount = cleanContent.length
            const isRecent = index === 0

            return (
              <div
                key={note.id}
                className={`bg-bg-secondary rounded-card shadow-card overflow-hidden cursor-pointer hover:shadow-md transition-all ${
                  isRecent ? 'ring-1 ring-navy/20' : ''
                }`}
                onClick={() => navigate(`/videos/${note.video_id}/note`)}
              >
                <div className="flex gap-3 p-3">
                  {note.video_thumbnail && (
                    <div className="flex-shrink-0 relative">
                      <img
                        src={note.video_thumbnail}
                        alt=""
                        className="w-28 h-16 object-cover rounded-lg"
                        loading="lazy"
                      />
                      <div className="absolute inset-0 bg-black/0 hover:bg-black/30 transition-colors rounded-lg flex items-center justify-center group/thumb">
                        <Play className="w-5 h-5 text-white opacity-0 group-hover/thumb:opacity-100 transition-opacity" />
                      </div>
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium text-text-primary line-clamp-1 text-sm">
                      {note.video_title || '動画タイトル'}
                    </h3>
                    <p className="text-xs text-text-secondary mt-1 line-clamp-2 leading-relaxed">
                      {cleanContent || 'テンプレートのみ'}
                    </p>
                    <div className="flex items-center gap-3 mt-2 text-xs text-text-secondary">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {formatRelativeDate(note.updated_at)}
                      </span>
                      <span className="flex items-center gap-1">
                        <PenLine className="w-3 h-3" />
                        {charCount > 0 ? `${charCount}文字` : '未記入'}
                      </span>
                    </div>
                  </div>
                </div>
                {/* 最新ノートにはラベル */}
                {isRecent && (
                  <div className="bg-navy/5 px-3 py-1.5 text-xs text-navy font-medium border-t border-navy/10">
                    最後に編集したノート
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
