import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { Users, CheckCircle } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/stores/useAuthStore'
import { parseAvatarString, getAvatarDataUrl } from '@/lib/avatars'

const REACTION_EMOJIS = ['👍', '🔥', '👏', '💪'] as const

interface ReactionCount {
  emoji: string
  count: number
  hasReacted: boolean
}

interface ActivityItem {
  id: string
  user_id: string
  video_id: string
  display_name: string
  avatar_url: string | null
  video_title: string
  completed: boolean
  updated_at: string
  reactions: ReactionCount[]
}

export function TeamActivity() {
  const navigate = useNavigate()
  const currentUser = useAuthStore((s) => s.user)
  const [activities, setActivities] = useState<ActivityItem[]>([])
  const [isLoading, setIsLoading] = useState(true)

  const fetchActivity = useCallback(async () => {
    if (!currentUser) return
    try {
      // 完了した視聴活動を取得（全ユーザー、最新15件）
      const { data } = await supabase
        .from('watch_progress')
        .select(`
          id,
          user_id,
          video_id,
          completed,
          updated_at,
          users (display_name, avatar_url),
          videos (title)
        `)
        .eq('completed', true)
        .order('updated_at', { ascending: false })
        .limit(15)

      if (!data || data.length === 0) {
        setActivities([])
        return
      }

      // リアクションを一括取得
      const progressIds = data.map((d: { id: string }) => d.id)
      const { data: reactionsData } = await supabase
        .from('reactions')
        .select('progress_id, emoji, user_id')
        .in('progress_id', progressIds)

      // リアクションをprogress_idごとに集計
      const reactionMap = new Map<string, { emoji: string; user_id: string }[]>()
      for (const r of reactionsData ?? []) {
        const list = reactionMap.get(r.progress_id) ?? []
        list.push({ emoji: r.emoji, user_id: r.user_id })
        reactionMap.set(r.progress_id, list)
      }

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const items: ActivityItem[] = data.map((d: any) => {
        const rawReactions = reactionMap.get(d.id) ?? []
        const reactionCounts: ReactionCount[] = REACTION_EMOJIS.map((emoji) => {
          const matching = rawReactions.filter((r) => r.emoji === emoji)
          return {
            emoji,
            count: matching.length,
            hasReacted: matching.some((r) => r.user_id === currentUser.id),
          }
        })

        return {
          id: d.id,
          user_id: d.user_id,
          video_id: d.video_id,
          display_name: d.users?.display_name ?? '匿名',
          avatar_url: d.users?.avatar_url ?? null,
          video_title: d.videos?.title ?? '動画',
          completed: d.completed,
          updated_at: d.updated_at,
          reactions: reactionCounts,
        }
      })

      setActivities(items.slice(0, 10))
    } catch {
      // ソーシャル機能は失敗しても問題なし
    } finally {
      setIsLoading(false)
    }
  }, [currentUser])

  useEffect(() => {
    if (currentUser) fetchActivity()
    else setIsLoading(false)
  }, [currentUser, fetchActivity])

  // リアクション トグル（楽観的UI更新）
  const handleReaction = async (activityId: string, emoji: string) => {
    if (!currentUser) return

    const activityIndex = activities.findIndex((a) => a.id === activityId)
    if (activityIndex === -1) return

    const activity = activities[activityIndex]
    const reactionIndex = activity.reactions.findIndex((r) => r.emoji === emoji)
    if (reactionIndex === -1) return

    const reaction = activity.reactions[reactionIndex]
    const willAdd = !reaction.hasReacted

    // 楽観的更新
    setActivities((prev) =>
      prev.map((a) => {
        if (a.id !== activityId) return a
        return {
          ...a,
          reactions: a.reactions.map((r) =>
            r.emoji === emoji
              ? { ...r, count: r.count + (willAdd ? 1 : -1), hasReacted: willAdd }
              : r
          ),
        }
      })
    )

    try {
      if (willAdd) {
        await supabase.from('reactions').insert({
          user_id: currentUser.id,
          progress_id: activityId,
          emoji,
        })
      } else {
        await supabase
          .from('reactions')
          .delete()
          .match({ user_id: currentUser.id, progress_id: activityId, emoji })
      }
    } catch {
      // ロールバック
      setActivities((prev) =>
        prev.map((a) => {
          if (a.id !== activityId) return a
          return {
            ...a,
            reactions: a.reactions.map((r) =>
              r.emoji === emoji
                ? { ...r, count: r.count + (willAdd ? -1 : 1), hasReacted: !willAdd }
                : r
            ),
          }
        })
      )
    }
  }

  if (isLoading || activities.length === 0) return null

  const timeAgo = (dateStr: string) => {
    const diff = Date.now() - new Date(dateStr).getTime()
    const minutes = Math.floor(diff / 60000)
    if (minutes < 1) return 'たった今'
    if (minutes < 60) return `${minutes}分前`
    const hours = Math.floor(minutes / 60)
    if (hours < 24) return `${hours}時間前`
    const days = Math.floor(hours / 24)
    if (days < 7) return `${days}日前`
    return new Date(dateStr).toLocaleDateString('ja-JP')
  }

  return (
    <div>
      <h2 className="text-lg font-bold text-text-primary mb-3 flex items-center gap-2">
        <Users className="w-5 h-5 text-teal" />
        チームの活動
      </h2>
      <div className="space-y-2">
        {activities.map((item) => {
          const avatarConfig = parseAvatarString(item.avatar_url)
          const avatarUrl = getAvatarDataUrl(avatarConfig.character, avatarConfig.colorName)
          const isMe = item.user_id === currentUser?.id
          const hasAnyReaction = item.reactions.some((r) => r.count > 0)

          return (
            <div
              key={item.id}
              className={`bg-bg-secondary rounded-xl shadow-card overflow-hidden ${
                isMe ? 'ring-1 ring-teal/30' : ''
              }`}
            >
              {/* 活動内容 */}
              <div
                className="flex items-center gap-3 px-3 py-3 cursor-pointer hover:bg-gray-50 transition-colors"
                onClick={() => navigate(`/videos/${item.video_id}`)}
              >
                <img
                  src={avatarUrl}
                  alt=""
                  className="w-8 h-8 rounded-full flex-shrink-0"
                />
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-text-primary leading-relaxed">
                    <span className="font-bold">{item.display_name}</span>
                    {isMe && <span className="text-teal text-[10px] ml-1">(あなた)</span>}
                    <span className="text-text-secondary"> が </span>
                    <span className="font-medium">{item.video_title}</span>
                    <span className="text-text-secondary"> を視聴完了</span>
                  </p>
                </div>
                <div className="flex items-center gap-1.5 flex-shrink-0">
                  <CheckCircle className="w-3.5 h-3.5 text-success" />
                  <span className="text-[10px] text-text-secondary whitespace-nowrap">
                    {timeAgo(item.updated_at)}
                  </span>
                </div>
              </div>

              {/* リアクションバー */}
              <div className="flex items-center gap-1 px-3 pb-2">
                {!isMe && (
                  <>
                    {REACTION_EMOJIS.map((emoji) => {
                      const r = item.reactions.find((r) => r.emoji === emoji)
                      const count = r?.count ?? 0
                      const hasReacted = r?.hasReacted ?? false

                      return (
                        <button
                          key={emoji}
                          onClick={() => handleReaction(item.id, emoji)}
                          className={`flex items-center gap-0.5 px-2 py-1 rounded-full text-xs transition-all active:scale-110 ${
                            hasReacted
                              ? 'bg-teal-100 border border-teal-300 shadow-sm'
                              : 'bg-gray-100 border border-transparent hover:bg-gray-200'
                          }`}
                        >
                          <span className="text-sm">{emoji}</span>
                          {count > 0 && (
                            <span className={`text-[10px] font-bold ${
                              hasReacted ? 'text-teal-700' : 'text-text-secondary'
                            }`}>
                              {count}
                            </span>
                          )}
                        </button>
                      )
                    })}
                  </>
                )}
                {isMe && hasAnyReaction && (
                  <div className="flex items-center gap-1">
                    {item.reactions
                      .filter((r) => r.count > 0)
                      .map((r) => (
                        <span
                          key={r.emoji}
                          className="flex items-center gap-0.5 px-2 py-1 rounded-full bg-teal-50 text-xs"
                        >
                          <span className="text-sm">{r.emoji}</span>
                          <span className="text-[10px] font-bold text-teal-700">{r.count}</span>
                        </span>
                      ))}
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
