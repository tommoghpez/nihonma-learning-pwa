import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { FileText, Play, Calendar, RefreshCw } from 'lucide-react'
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
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-text-primary">ノート一覧</h1>
        <span className="text-sm text-text-secondary">{notes.length} 件</span>
      </div>

      {notes.length === 0 ? (
        <div className="text-center py-12">
          <FileText className="w-12 h-12 mx-auto text-text-secondary/50 mb-3" />
          <p className="text-text-secondary">ノートはまだありません</p>
          <p className="text-sm text-text-secondary mt-1">
            動画を視聴して、学んだことをメモしましょう
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {notes.map((note) => (
            <div key={note.id} className="card">
              <div className="flex gap-3">
                {note.video_thumbnail && (
                  <Link to={`/videos/${note.video_id}`} className="flex-shrink-0">
                    <img
                      src={note.video_thumbnail}
                      alt=""
                      className="w-24 h-14 object-cover rounded"
                    />
                  </Link>
                )}
                <div className="flex-1 min-w-0">
                  <Link
                    to={`/videos/${note.video_id}/note`}
                    className="font-medium text-text-primary hover:text-navy line-clamp-1"
                  >
                    {note.video_title || '動画タイトル'}
                  </Link>
                  <p className="text-sm text-text-secondary mt-1 line-clamp-2">
                    {note.content}
                  </p>
                  <div className="flex items-center gap-4 mt-2 text-xs text-text-secondary">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {new Date(note.updated_at).toLocaleDateString('ja-JP')}
                    </span>
                    <Link
                      to={`/videos/${note.video_id}`}
                      className="flex items-center gap-1 text-navy hover:underline"
                    >
                      <Play className="w-3 h-3" />
                      動画を見る
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
