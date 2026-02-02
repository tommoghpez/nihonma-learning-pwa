import { useState, useEffect } from 'react'
import { Trophy } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/stores/useAuthStore'
import { Card } from '@/components/common/Card'

interface RankingItem {
  user_id: string
  display_name: string
  completed_count: number
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

        const { data: users } = await supabase.from('users').select('id, display_name')
        if (!users) return

        const items: RankingItem[] = users
          .map((u) => ({
            user_id: u.id,
            display_name: u.display_name,
            completed_count: countMap.get(u.id) || 0,
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

  if (isLoading || ranking.length < 5) return null

  const topThree = ranking.slice(0, 3)
  const myRank = ranking.findIndex((r) => r.user_id === currentUser?.id) + 1

  return (
    <div>
      <h2 className="text-lg font-bold text-text-primary mb-3 flex items-center gap-2">
        <Trophy className="w-5 h-5 text-warning" />
        チームランキング
      </h2>
      <Card>
        <div className="space-y-3">
          {topThree.map((item, index) => (
            <div
              key={item.user_id}
              className={`flex items-center justify-between ${
                item.user_id === currentUser?.id ? 'font-bold' : ''
              }`}
            >
              <div className="flex items-center gap-3">
                <span className={`text-lg font-bold ${
                  index === 0 ? 'text-warning' : index === 1 ? 'text-gray-400' : 'text-amber-700'
                }`}>
                  {index + 1}
                </span>
                <span className="text-sm text-text-primary">{item.display_name}</span>
              </div>
              <span className="text-sm text-text-secondary">{item.completed_count}本完了</span>
            </div>
          ))}
          {myRank > 3 && currentUser && (
            <>
              <div className="text-center text-text-secondary text-xs">...</div>
              <div className="flex items-center justify-between font-bold">
                <div className="flex items-center gap-3">
                  <span className="text-lg text-text-secondary">{myRank}</span>
                  <span className="text-sm text-text-primary">{currentUser.display_name}</span>
                </div>
                <span className="text-sm text-text-secondary">
                  {ranking[myRank - 1]?.completed_count ?? 0}本完了
                </span>
              </div>
            </>
          )}
        </div>
      </Card>
    </div>
  )
}
