import { useState, useEffect, useCallback } from 'react'
import { Button } from '@/components/common/Button'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/stores/useAuthStore'
import { useUIStore } from '@/stores/useUIStore'
import { SUMMARY_TEMPLATE } from '@/lib/constants'
import { db } from '@/lib/db'
import { enqueueSync } from '@/lib/sync'

interface SummaryEditorProps {
  videoId: string
  onSaved?: () => void
}

export function SummaryEditor({ videoId, onSaved }: SummaryEditorProps) {
  const user = useAuthStore((s) => s.user)
  const addToast = useUIStore((s) => s.addToast)
  const [content, setContent] = useState(SUMMARY_TEMPLATE)
  const [saving, setSaving] = useState(false)
  const [showPreview, setShowPreview] = useState(false)

  useEffect(() => {
    async function loadExisting() {
      if (!user) return
      try {
        const { data } = await supabase
          .from('summaries')
          .select('*')
          .eq('user_id', user.id)
          .eq('video_id', videoId)
          .single()
        if (data?.content) setContent(data.content)
      } catch {
        const cached = await db.summaries
          .where('[user_id+video_id]')
          .equals([user.id, videoId])
          .first()
        if (cached?.content) setContent(cached.content)
      }
    }
    loadExisting()
  }, [user, videoId])

  const handleSave = useCallback(async () => {
    if (!user) return
    setSaving(true)

    const now = new Date().toISOString()
    const summaryData = {
      user_id: user.id,
      video_id: videoId,
      content,
      updated_at: now,
    }

    try {
      if (navigator.onLine) {
        const { error } = await supabase.from('summaries').upsert(summaryData, {
          onConflict: 'user_id,video_id',
        })
        if (error) throw error
      } else {
        await enqueueSync('summaries', 'upsert', summaryData)
      }

      await db.summaries.put({
        id: `${user.id}-${videoId}`,
        ...summaryData,
        created_at: now,
      })

      addToast('要約を保存しました', 'success')
      onSaved?.()
    } catch {
      addToast('保存に失敗しました', 'error')
    } finally {
      setSaving(false)
    }
  }, [user, videoId, content, addToast, onSaved])

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-lg font-bold text-text-primary">要約メモ</h3>
        <button
          onClick={() => setShowPreview(!showPreview)}
          className="text-sm text-navy font-medium"
        >
          {showPreview ? '編集' : 'プレビュー'}
        </button>
      </div>

      {showPreview ? (
        <div className="card prose prose-sm max-w-none whitespace-pre-wrap min-h-[200px]">
          {content}
        </div>
      ) : (
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          className="w-full h-64 p-3 border border-border rounded-card bg-bg-secondary text-text-primary text-sm focus:outline-none focus:ring-2 focus:ring-navy/50 resize-y"
          placeholder="学んだことを自由に書いてください..."
        />
      )}

      <div className="flex justify-between items-center mt-3">
        <span className="text-xs text-text-secondary">
          {content.length} 文字
        </span>
        <Button onClick={handleSave} isLoading={saving}>
          保存
        </Button>
      </div>
    </div>
  )
}
