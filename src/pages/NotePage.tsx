import { useState, useEffect, useCallback } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { ArrowLeft, Save, Trash2 } from 'lucide-react'
import { useVideoStore } from '@/stores/useVideoStore'
import { useAuthStore } from '@/stores/useAuthStore'
import { useUIStore } from '@/stores/useUIStore'
import { supabase } from '@/lib/supabase'
import { db } from '@/lib/db'
import { Button } from '@/components/common/Button'
import { LoadingSpinner } from '@/components/common/LoadingSpinner'

export function NotePage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { currentVideo, fetchVideoById } = useVideoStore()
  const user = useAuthStore((s) => s.user)
  const addToast = useUIStore((s) => s.addToast)
  const [content, setContent] = useState('')
  const [saving, setSaving] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (id) fetchVideoById(id)
  }, [id])

  useEffect(() => {
    async function loadNote() {
      if (!user || !id) {
        setIsLoading(false)
        return
      }
      setIsLoading(true)
      try {
        const { data } = await supabase
          .from('summaries')
          .select('*')
          .eq('user_id', user.id)
          .eq('video_id', id)
          .single()
        if (data?.content) setContent(data.content)
      } catch {
        const cached = await db.summaries
          .where('[user_id+video_id]')
          .equals([user.id, id])
          .first()
        if (cached?.content) setContent(cached.content)
      } finally {
        setIsLoading(false)
      }
    }
    loadNote()
  }, [user, id])

  const handleSave = useCallback(async () => {
    if (!user || !id) return
    setSaving(true)

    const now = new Date().toISOString()
    const noteData = {
      user_id: user.id,
      video_id: id,
      content,
      updated_at: now,
    }

    try {
      console.log('Saving note:', noteData)
      if (navigator.onLine) {
        const { error } = await supabase.from('summaries').upsert(noteData, {
          onConflict: 'user_id,video_id',
        })
        if (error) {
          console.error('Supabase error:', error)
          throw error
        }
        console.log('Saved to Supabase successfully')
      }

      await db.summaries.put({
        id: `${user.id}-${id}`,
        ...noteData,
        created_at: now,
      })
      console.log('Saved to local DB successfully')

      addToast('ノートを保存しました', 'success')
    } catch (err) {
      console.error('Save failed:', err)
      addToast('保存に失敗しました', 'error')
    } finally {
      setSaving(false)
    }
  }, [user, id, content, addToast])

  const handleDelete = useCallback(async () => {
    if (!user || !id) return
    if (!confirm('このノートを削除しますか？')) return

    try {
      if (navigator.onLine) {
        await supabase
          .from('summaries')
          .delete()
          .eq('user_id', user.id)
          .eq('video_id', id)
      }
      await db.summaries.delete(`${user.id}-${id}`)
      addToast('ノートを削除しました', 'success')
      navigate('/notes')
    } catch {
      addToast('削除に失敗しました', 'error')
    }
  }, [user, id, addToast, navigate])

  if (!id) return null

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="text-text-secondary">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="flex-1 min-w-0">
          <h1 className="text-lg font-bold text-text-primary">ノート</h1>
          {currentVideo && (
            <Link
              to={`/videos/${id}`}
              className="text-sm text-navy hover:underline truncate block"
            >
              {currentVideo.title}
            </Link>
          )}
        </div>
      </div>

      {isLoading ? (
        <LoadingSpinner className="py-12" />
      ) : (
        <>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="w-full h-80 p-3 border border-border rounded-card bg-bg-secondary text-text-primary text-sm focus:outline-none focus:ring-2 focus:ring-navy/50 resize-y"
            placeholder="動画を見て学んだこと、気づいたことを自由にメモしてください..."
          />

          <div className="flex items-center justify-between">
            <span className="text-xs text-text-secondary">
              {content.length} 文字
            </span>
            <div className="flex gap-2">
              {content && (
                <Button variant="ghost" onClick={handleDelete}>
                  <Trash2 className="w-4 h-4 mr-1" />
                  削除
                </Button>
              )}
              <Button onClick={handleSave} isLoading={saving}>
                <Save className="w-4 h-4 mr-1" />
                保存
              </Button>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
