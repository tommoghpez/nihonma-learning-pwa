import { useState, useEffect, useMemo } from 'react'
import { RefreshCw, ChevronRight } from 'lucide-react'
import { Card } from '@/components/common/Card'
import { supabase } from '@/lib/supabase'
import { calculateTyranState, TYRAN_STAGES, type TyranState, type TyranMood } from '@/lib/tyran'
import { getAvatarDataUrl, parseAvatarString } from '@/lib/avatars'
import type { User } from '@/types'

interface WatchProgressRow {
  user_id: string
  video_id: string
  watched_seconds: number
  completed: boolean
  created_at: string
  updated_at: string
}

interface UserWithStatus {
  user: User
  tyranState: TyranState
  completedCount: number
  totalVideos: number
}

const MOOD_EMOJI: Record<TyranMood, string> = {
  ecstatic: '🤩',
  happy: '😊',
  normal: '😐',
  worried: '😰',
  sad: '😢',
  dying: '💀',
}

interface Props {
  onSelectUser: (userId: string) => void
}

export function UserStatusPanel({ onSelectUser }: Props) {
  const [usersWithStatus, setUsersWithStatus] = useState<UserWithStatus[]>([])
  const [loading, setLoading] = useState(true)

  const fetchData = async () => {
    setLoading(true)

    // 並列でデータ取得
    const [usersRes, progressRes, videosRes] = await Promise.all([
      supabase.from('users').select('*').order('created_at', { ascending: true }),
      supabase.from('watch_progress').select('user_id, video_id, watched_seconds, completed, created_at, updated_at'),
      supabase.from('videos').select('*', { count: 'exact', head: true }),
    ])

    const users = (usersRes.data ?? []) as User[]
    const allProgress = (progressRes.data ?? []) as WatchProgressRow[]
    const totalVideos = videosRes.count ?? 0

    // user_idでグループ化
    const progressByUser = new Map<string, WatchProgressRow[]>()
    for (const row of allProgress) {
      const existing = progressByUser.get(row.user_id) ?? []
      existing.push(row)
      progressByUser.set(row.user_id, existing)
    }

    // 各ユーザーのステータスを計算
    const result: UserWithStatus[] = users.map((user) => {
      const progress = progressByUser.get(user.id) ?? []

      // 学習日付を抽出（TyranStreak.tsxと同じロジック）
      const dates: string[] = []
      for (const p of progress) {
        if (p.watched_seconds > 0) {
          dates.push(p.created_at)
          dates.push(p.updated_at)
        }
      }

      const tyranState = calculateTyranState(dates)
      const completedCount = progress.filter((p) => p.completed).length

      return { user, tyranState, completedCount, totalVideos }
    })

    setUsersWithStatus(result)
    setLoading(false)
  }

  useEffect(() => {
    fetchData()
  }, [])

  // ソート: アクティブ順（最終学習が新しい順）
  const sorted = useMemo(() => {
    return [...usersWithStatus].sort((a, b) => {
      // 未学習を最後に
      if (!a.tyranState.lastLearnedAt && !b.tyranState.lastLearnedAt) return 0
      if (!a.tyranState.lastLearnedAt) return 1
      if (!b.tyranState.lastLearnedAt) return -1
      return b.tyranState.lastLearnedAt.localeCompare(a.tyranState.lastLearnedAt)
    })
  }, [usersWithStatus])

  const getStatusBadge = (daysSince: number, isAlive: boolean) => {
    if (!isAlive) return { label: '💤 死亡', cls: 'bg-gray-200 text-gray-600' }
    if (daysSince >= 3) return { label: '⚠️ 注意', cls: 'bg-orange-100 text-orange-700' }
    if (daysSince <= 0) return { label: '🟢 学習中', cls: 'bg-green-100 text-green-700' }
    return { label: '✅ 正常', cls: 'bg-blue-50 text-blue-700' }
  }

  const getAvatarSrc = (avatarUrl: string | null) => {
    const config = parseAvatarString(avatarUrl)
    return getAvatarDataUrl(config.character, config.colorName)
  }

  const formatLastLearned = (dateStr: string | null) => {
    if (!dateStr) return '未学習'
    const d = new Date(dateStr)
    const now = new Date()
    const diffDays = Math.floor((now.getTime() - d.getTime()) / (1000 * 60 * 60 * 24))
    if (diffDays === 0) return '今日'
    if (diffDays === 1) return '昨日'
    return `${diffDays}日前`
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-bold text-text-primary">
          ユーザー状況
          <span className="ml-2 text-xs font-normal text-text-secondary">{usersWithStatus.length}人</span>
        </h2>
        <button
          onClick={fetchData}
          disabled={loading}
          className="flex items-center gap-1 text-xs text-teal hover:text-teal-700 disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          更新
        </button>
      </div>

      {loading ? (
        <p className="text-sm text-text-secondary text-center py-8">読み込み中...</p>
      ) : (
        <div className="space-y-2">
          {sorted.map(({ user, tyranState, completedCount, totalVideos }) => {
            const status = getStatusBadge(tyranState.daysSinceLastLearned, tyranState.isAlive)
            const stageInfo = TYRAN_STAGES[tyranState.stage]

            return (
              <Card
                key={user.id}
                className="p-3 cursor-pointer hover:bg-gray-50 active:bg-gray-100 transition-colors"
                onClick={() => onSelectUser(user.id)}
              >
                <div className="flex items-center gap-3">
                  {/* アバター */}
                  <img
                    src={getAvatarSrc(user.avatar_url)}
                    alt=""
                    className="w-10 h-10 rounded-full flex-shrink-0"
                  />

                  {/* ユーザー情報 */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm font-bold text-text-primary truncate">
                        {user.display_name}
                      </span>
                      <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full ${status.cls}`}>
                        {status.label}
                      </span>
                    </div>

                    {/* メトリクス行 */}
                    <div className="flex items-center gap-3 text-[11px] text-text-secondary">
                      <span>
                        {MOOD_EMOJI[tyranState.mood]} {stageInfo.name}
                      </span>
                      <span>
                        📅 {formatLastLearned(tyranState.lastLearnedAt)}
                      </span>
                      <span>
                        📚 {completedCount}/{totalVideos}本
                      </span>
                    </div>

                    {/* 詳細行 */}
                    <div className="flex items-center gap-3 text-[10px] text-text-secondary mt-0.5">
                      <span>累計{tyranState.totalLearnedDays}日</span>
                      <span>🔥{tyranState.streakDays}日連続</span>
                      <span>最長{tyranState.longestStreak}日</span>
                    </div>
                  </div>

                  {/* 矢印 */}
                  <ChevronRight className="w-4 h-4 text-text-secondary flex-shrink-0" />
                </div>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
