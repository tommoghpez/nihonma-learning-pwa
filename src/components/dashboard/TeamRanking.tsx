import { useState, useEffect } from 'react'
import { Trophy, Medal, Award, Crown } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/stores/useAuthStore'
import { Card } from '@/components/common/Card'
import { parseAvatarString, getAvatarDataUrl } from '@/lib/avatars'
import { getTitle } from '@/lib/titles'
import { TitleBadge } from '@/components/common/TitleBadge'

interface RankingItem {
  user_id: string
  display_name: string
  completed_count: number
  avatar_url?: string | null
}

export function TeamRanking() {
  const currentUser = useAuthStore((s) => s.user)
  const [ranking, setRanking] = useState<RankingItem[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    async function fetchRanking() {
      try {
        const { data: progressData } = await supabase
          .from('watch_progress')
          .select('user_id')
          .eq('completed', true)

        if (!progressData) return

        const countMap = new Map<string, number>()
        for (const row of progressData) {
          countMap.set(row.user_id, (countMap.get(row.user_id) || 0) + 1)
        }

        const { data: users } = await supabase.from('users').select('id, display_name, avatar_url')
        if (!users) return

        const items: RankingItem[] = users
          .map((u) => ({
            user_id: u.id,
            display_name: u.display_name,
            completed_count: countMap.get(u.id) || 0,
            avatar_url: u.avatar_url,
          }))
          .sort((a, b) => b.completed_count - a.completed_count)

        setRanking(items)
      } catch {
        // ignore
      } finally {
        setIsLoading(false)
      }
    }
    fetchRanking()
  }, [])

  if (isLoading || ranking.length < 1) return null

  const topEight = ranking.slice(0, 8)
  const myRank = ranking.findIndex((r) => r.user_id === currentUser?.id) + 1

  const getRankIcon = (index: number) => {
    if (index === 0) return <Crown className="w-5 h-5 text-yellow-500" />
    if (index === 1) return <Medal className="w-5 h-5 text-gray-400" />
    if (index === 2) return <Award className="w-5 h-5 text-amber-600" />
    return <span className="text-sm font-bold text-text-secondary">{index + 1}</span>
  }

  const getRankBgColor = (index: number) => {
    if (index === 0) return 'bg-gradient-to-r from-yellow-50 to-amber-50'
    if (index === 1) return 'bg-gradient-to-r from-gray-50 to-slate-50'
    if (index === 2) return 'bg-gradient-to-r from-orange-50 to-amber-50'
    return ''
  }

  return (
    <div>
      <h2 className="text-lg font-bold text-text-primary mb-3 flex items-center gap-2">
        <Trophy className="w-5 h-5 text-warning" />
        チームランキング
      </h2>
      <Card className="p-3">
        <div className="space-y-2">
          {topEight.map((item, index) => {
            const avatarConfig = parseAvatarString(item.avatar_url)
            const avatarUrl = getAvatarDataUrl(avatarConfig.character, avatarConfig.colorName)
            const isMe = item.user_id === currentUser?.id

            return (
              <div
                key={item.user_id}
                className={`flex items-center justify-between p-3 rounded-lg transition-all ${getRankBgColor(index)} ${
                  isMe ? 'ring-2 ring-teal ring-offset-1' : ''
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 flex items-center justify-center">
                    {getRankIcon(index)}
                  </div>
                  <img
                    src={avatarUrl}
                    alt=""
                    className="w-8 h-8 rounded-full"
                  />
                  <div>
                    <span className={`text-sm ${isMe ? 'font-bold text-navy' : 'text-text-primary'}`}>
                      {item.display_name}
                      {isMe && <span className="ml-1 text-teal text-xs">（あなた）</span>}
                    </span>
                    <div className="mt-0.5">
                      <TitleBadge title={getTitle(item.completed_count).current} />
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-sm font-bold text-navy">{item.completed_count}</span>
                  <span className="text-xs text-text-secondary ml-1">本</span>
                </div>
              </div>
            )
          })}
          {myRank > 8 && currentUser && (
            <>
              <div className="text-center text-text-secondary text-xs py-1">・・・</div>
              <div className={`flex items-center justify-between p-3 rounded-lg bg-teal-50 ring-2 ring-teal ring-offset-1`}>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 flex items-center justify-center">
                    <span className="text-sm font-bold text-text-secondary">{myRank}</span>
                  </div>
                  <img
                    src={getAvatarDataUrl(
                      parseAvatarString(currentUser.avatar_url).character,
                      parseAvatarString(currentUser.avatar_url).colorName
                    )}
                    alt=""
                    className="w-8 h-8 rounded-full"
                  />
                  <div>
                    <span className="text-sm font-bold text-navy">
                      {currentUser.display_name}
                      <span className="ml-1 text-teal text-xs">（あなた）</span>
                    </span>
                    <div className="mt-0.5">
                      <TitleBadge title={getTitle(ranking[myRank - 1]?.completed_count ?? 0).current} />
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-sm font-bold text-navy">
                    {ranking[myRank - 1]?.completed_count ?? 0}
                  </span>
                  <span className="text-xs text-text-secondary ml-1">本</span>
                </div>
              </div>
            </>
          )}
        </div>
      </Card>
    </div>
  )
}
