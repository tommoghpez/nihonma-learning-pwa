import { useState, useEffect } from 'react'
import { Navigate } from 'react-router-dom'
import { RefreshCw } from 'lucide-react'
import { useAuthStore } from '@/stores/useAuthStore'
import { useVideoStore } from '@/stores/useVideoStore'
import { supabase } from '@/lib/supabase'
import { QuizEditor } from '@/components/quiz/QuizEditor'
import { Button } from '@/components/common/Button'
import { LoadingSpinner } from '@/components/common/LoadingSpinner'
import { useUIStore } from '@/stores/useUIStore'
import type { QuizQuestion } from '@/types'

export function AdminQuizPage() {
  const { isAdmin } = useAuthStore()
  const { videos, syncFromYouTube, isLoading: syncing } = useVideoStore()
  const addToast = useUIStore((s) => s.addToast)
  const [selectedVideoId, setSelectedVideoId] = useState('')
  const [questions, setQuestions] = useState<QuizQuestion[]>([])
  const [loadingQuestions, setLoadingQuestions] = useState(false)

  if (!isAdmin) return <Navigate to="/" replace />

  useEffect(() => {
    if (!selectedVideoId) return
    loadQuestions()
  }, [selectedVideoId])

  const loadQuestions = async () => {
    setLoadingQuestions(true)
    const { data } = await supabase
      .from('quiz_questions')
      .select('*')
      .eq('video_id', selectedVideoId)
      .order('order_index')

    setQuestions(
      (data ?? []).map((q) => ({
        ...q,
        options: typeof q.options === 'string' ? JSON.parse(q.options) : q.options,
      })) as QuizQuestion[]
    )
    setLoadingQuestions(false)
  }

  const handleSync = async () => {
    await syncFromYouTube()
    addToast('動画を同期しました', 'success')
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-text-primary">クイズ管理</h1>
        <Button onClick={handleSync} isLoading={syncing} size="sm" variant="secondary">
          <RefreshCw className="w-4 h-4 mr-1" />
          動画同期
        </Button>
      </div>

      <div>
        <label className="block text-sm font-medium text-text-primary mb-1">動画を選択</label>
        <select
          value={selectedVideoId}
          onChange={(e) => setSelectedVideoId(e.target.value)}
          className="w-full px-3 py-2 border border-border rounded-btn bg-bg-secondary text-text-primary"
        >
          <option value="">-- 動画を選択 --</option>
          {videos.map((v) => (
            <option key={v.id} value={v.id}>
              {v.title}
            </option>
          ))}
        </select>
      </div>

      {selectedVideoId && (
        loadingQuestions ? (
          <LoadingSpinner className="py-8" />
        ) : (
          <QuizEditor
            videoId={selectedVideoId}
            initialQuestions={questions}
            onSaved={loadQuestions}
          />
        )
      )}
    </div>
  )
}
