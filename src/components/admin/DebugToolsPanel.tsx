import { useState, useEffect } from 'react'
import { Copy, CheckCircle2, ArrowLeft } from 'lucide-react'
import { Card } from '@/components/common/Card'
import { supabase } from '@/lib/supabase'
import { useUIStore } from '@/stores/useUIStore'
import { getAvatarDataUrl, parseAvatarString } from '@/lib/avatars'
import type { User } from '@/types'

interface ProgressRow {
  id: string
  video_id: string
  watched_seconds: number
  total_seconds: number | null
  completed: boolean
  completed_at: string | null
  created_at: string
  updated_at: string
  videos: { title: string } | null
}

interface Props {
  initialUserId: string | null
}

export function DebugToolsPanel({ initialUserId }: Props) {
  const addToast = useUIStore((s) => s.addToast)
  const [users, setUsers] = useState<User[]>([])
  const [selectedUserId, setSelectedUserId] = useState<string | null>(initialUserId)
  const [progress, setProgress] = useState<ProgressRow[]>([])
  const [loading, setLoading] = useState(false)
  const [loadingUsers, setLoadingUsers] = useState(true)

  // ユーザー一覧取得
  useEffect(() => {
    const fetchUsers = async () => {
      const { data } = await supabase
        .from('users')
        .select('*')
        .order('display_name')
      setUsers((data ?? []) as User[])
      setLoadingUsers(false)
    }
    fetchUsers()
  }, [])

  // initialUserIdの変更に追従
  useEffect(() => {
    if (initialUserId) {
      setSelectedUserId(initialUserId)
    }
  }, [initialUserId])

  // ユーザー選択時にデータ取得
  useEffect(() => {
    if (!selectedUserId) return
    const fetchProgress = async () => {
      setLoading(true)
      const { data } = await supabase
        .from('watch_progress')
        .select('id, video_id, watched_seconds, total_seconds, completed, completed_at, created_at, updated_at, videos(title)')
        .eq('user_id', selectedUserId)
        .order('updated_at', { ascending: false })
      // Supabaseのjoinは配列で返る場合があるため、videosを正規化
      const normalized = (data ?? []).map((row: Record<string, unknown>) => ({
        ...row,
        videos: Array.isArray(row.videos) ? row.videos[0] ?? null : row.videos ?? null,
      })) as ProgressRow[]
      setProgress(normalized)
      setLoading(false)
    }
    fetchProgress()
  }, [selectedUserId])

  const handleCopyJSON = async () => {
    try {
      const exportData = {
        user_id: selectedUserId,
        user_name: users.find((u) => u.id === selectedUserId)?.display_name,
        exported_at: new Date().toISOString(),
        progress: progress.map((p) => ({
          video_id: p.video_id,
          title: p.videos?.title,
          watched_seconds: p.watched_seconds,
          total_seconds: p.total_seconds,
          completed: p.completed,
          completed_at: p.completed_at,
          created_at: p.created_at,
          updated_at: p.updated_at,
        })),
      }
      await navigator.clipboard.writeText(JSON.stringify(exportData, null, 2))
      addToast('JSONをコピーしました', 'success')
    } catch {
      addToast('コピーに失敗しました', 'error')
    }
  }

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return '—'
    const d = new Date(dateStr)
    return `${d.getMonth() + 1}/${d.getDate()} ${d.getHours()}:${String(d.getMinutes()).padStart(2, '0')}`
  }

  const getPercent = (watched: number, total: number | null) => {
    if (!total || total === 0) return '—'
    return `${Math.round((watched / total) * 100)}%`
  }

  const selectedUser = users.find((u) => u.id === selectedUserId)
  const getAvatarSrc = (avatarUrl: string | null) => {
    const config = parseAvatarString(avatarUrl)
    return getAvatarDataUrl(config.character, config.colorName)
  }

  return (
    <div className="space-y-3">
      <h2 className="text-sm font-bold text-text-primary">デバッグツール</h2>

      {/* ユーザー選択 */}
      {loadingUsers ? (
        <p className="text-sm text-text-secondary text-center py-4">読み込み中...</p>
      ) : (
        <select
          value={selectedUserId ?? ''}
          onChange={(e) => setSelectedUserId(e.target.value || null)}
          className="w-full px-3 py-2 border border-border rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-teal/50"
        >
          <option value="">ユーザーを選択...</option>
          {users.map((u) => (
            <option key={u.id} value={u.id}>
              {u.display_name} ({u.email})
            </option>
          ))}
        </select>
      )}

      {/* 選択中のユーザー情報 */}
      {selectedUser && (
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <img
              src={getAvatarSrc(selectedUser.avatar_url)}
              alt=""
              className="w-6 h-6 rounded-full"
            />
            <span className="text-sm font-bold text-text-primary">{selectedUser.display_name}</span>
            <span className="text-xs text-text-secondary">{selectedUser.email}</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleCopyJSON}
              disabled={progress.length === 0}
              className="flex items-center gap-1 text-xs text-navy bg-blue-50 hover:bg-blue-100 px-2.5 py-1.5 rounded-lg transition-colors disabled:opacity-50"
            >
              <Copy className="w-3 h-3" />
              JSONコピー
            </button>
            <button
              onClick={() => { setSelectedUserId(null); setProgress([]) }}
              className="flex items-center gap-1 text-xs text-text-secondary hover:text-text-primary"
            >
              <ArrowLeft className="w-3 h-3" />
              戻る
            </button>
          </div>
        </div>
      )}

      {/* watch_progress一覧 */}
      {loading ? (
        <p className="text-sm text-text-secondary text-center py-8">読み込み中...</p>
      ) : selectedUserId && progress.length === 0 ? (
        <p className="text-sm text-text-secondary text-center py-8">視聴データなし</p>
      ) : progress.length > 0 ? (
        <div className="space-y-1.5">
          {progress.map((p) => (
            <Card key={p.id} className="p-2.5">
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-text-primary truncate">
                    {p.videos?.title ?? p.video_id}
                  </p>
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 mt-1 text-[10px] text-text-secondary">
                    <span>視聴: {p.watched_seconds}s / {p.total_seconds ?? '?'}s</span>
                    <span>進捗: {getPercent(p.watched_seconds, p.total_seconds)}</span>
                    <span>更新: {formatDate(p.updated_at)}</span>
                    {p.completed_at && <span>完了: {formatDate(p.completed_at)}</span>}
                  </div>
                </div>
                <div className="flex-shrink-0 mt-0.5">
                  {p.completed ? (
                    <CheckCircle2 className="w-4 h-4 text-success" />
                  ) : (
                    <div className="w-4 h-4 rounded-full border-2 border-gray-300" />
                  )}
                </div>
              </div>
            </Card>
          ))}
          <p className="text-[10px] text-text-secondary text-center pt-1">
            {progress.length}件のレコード
          </p>
        </div>
      ) : null}
    </div>
  )
}
