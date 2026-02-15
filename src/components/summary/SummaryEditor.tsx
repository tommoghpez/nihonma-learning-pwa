import { useState, useEffect, useCallback, useRef } from 'react'
import { PenLine, Check, Cloud, CloudOff } from 'lucide-react'
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
  const [lastSaved, setLastSaved] = useState<string | null>(null)
  const [hasUnsaved, setHasUnsaved] = useState(false)
  const [isExpanded, setIsExpanded] = useState(false)
  const autoSaveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const savedContentRef = useRef(SUMMARY_TEMPLATE)

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
        if (data?.content) {
          setContent(data.content)
          savedContentRef.current = data.content
          setLastSaved(data.updated_at)
          // 既存ノートがある場合は開いた状態にする
          setIsExpanded(true)
        }
      } catch {
        const cached = await db.summaries
          .where('[user_id+video_id]')
          .equals([user.id, videoId])
          .first()
        if (cached?.content) {
          setContent(cached.content)
          savedContentRef.current = cached.content
          setLastSaved(cached.updated_at)
          setIsExpanded(true)
        }
      }
    }
    loadExisting()
  }, [user, videoId])

  const handleSave = useCallback(async (contentToSave?: string) => {
    if (!user) return
    const saveContent = contentToSave ?? content
    if (saveContent === savedContentRef.current) return // 変更なし

    setSaving(true)

    const now = new Date().toISOString()
    const summaryData = {
      user_id: user.id,
      video_id: videoId,
      content: saveContent,
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

      savedContentRef.current = saveContent
      setLastSaved(now)
      setHasUnsaved(false)
      onSaved?.()
    } catch {
      addToast('保存に失敗しました', 'error')
    } finally {
      setSaving(false)
    }
  }, [user, videoId, content, addToast, onSaved])

  // 自動保存（30秒間隔）
  const handleContentChange = useCallback((newContent: string) => {
    setContent(newContent)
    setHasUnsaved(newContent !== savedContentRef.current)

    // タイマーリセット
    if (autoSaveTimerRef.current) {
      clearTimeout(autoSaveTimerRef.current)
    }
    autoSaveTimerRef.current = setTimeout(() => {
      handleSave(newContent)
    }, 30000)
  }, [handleSave])

  // コンポーネントアンマウント時に未保存があれば保存
  useEffect(() => {
    return () => {
      if (autoSaveTimerRef.current) {
        clearTimeout(autoSaveTimerRef.current)
      }
    }
  }, [])

  const formatSavedTime = (dateStr: string) => {
    const d = new Date(dateStr)
    return d.toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' })
  }

  return (
    <div className="bg-bg-secondary rounded-card border border-border overflow-hidden">
      {/* ヘッダー（常に表示） */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between p-3 hover:bg-gray-50 transition-colors"
      >
        <div className="flex items-center gap-2">
          <PenLine className="w-4 h-4 text-navy" />
          <span className="text-sm font-bold text-text-primary">学習メモ</span>
          {hasUnsaved && (
            <span className="w-2 h-2 rounded-full bg-warning animate-pulse" />
          )}
        </div>
        <div className="flex items-center gap-2 text-xs text-text-secondary">
          {lastSaved && (
            <span className="flex items-center gap-1">
              {navigator.onLine
                ? <Cloud className="w-3 h-3 text-success" />
                : <CloudOff className="w-3 h-3 text-warning" />
              }
              {formatSavedTime(lastSaved)}
            </span>
          )}
          <span className={`transition-transform ${isExpanded ? 'rotate-180' : ''}`}>
            &#9662;
          </span>
        </div>
      </button>

      {/* エディタ部分（展開時のみ） */}
      {isExpanded && (
        <div className="border-t border-border">
          <textarea
            value={content}
            onChange={(e) => handleContentChange(e.target.value)}
            className="w-full h-48 p-3 bg-transparent text-text-primary text-sm focus:outline-none resize-y"
            placeholder="動画で学んだことを自由にメモしてください..."
          />

          <div className="flex justify-between items-center px-3 py-2 border-t border-border bg-gray-50/50">
            <div className="flex items-center gap-3 text-xs text-text-secondary">
              <span>{content.length} 文字</span>
              {saving && (
                <span className="flex items-center gap-1 text-navy">
                  <Cloud className="w-3 h-3 animate-pulse" />
                  保存中...
                </span>
              )}
              {!saving && !hasUnsaved && lastSaved && (
                <span className="flex items-center gap-1 text-success">
                  <Check className="w-3 h-3" />
                  保存済み
                </span>
              )}
            </div>
            <Button
              size="sm"
              onClick={() => handleSave()}
              isLoading={saving}
              disabled={!hasUnsaved}
            >
              保存
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
