import { useMemo, useState, useEffect } from 'react'
import { Target, Check } from 'lucide-react'
import { useProgressStore } from '@/stores/useProgressStore'
import { useAuthStore } from '@/stores/useAuthStore'
import { supabase } from '@/lib/supabase'
import { calculateWeeklyChallenges, type Challenge } from '@/lib/challenges'

export function WeeklyChallenge() {
  const progressMap = useProgressStore((s) => s.progressMap)
  const userId = useAuthStore((s) => s.user?.id)
  const [summaryCount, setSummaryCount] = useState(0)

  useEffect(() => {
    async function fetchSummaryCount() {
      if (!userId) return
      try {
        const { count } = await supabase
          .from('summaries')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', userId)
        setSummaryCount(count ?? 0)
      } catch {
        // ignore
      }
    }
    fetchSummaryCount()
  }, [userId])

  const challenges = useMemo(
    () => calculateWeeklyChallenges(progressMap, summaryCount),
    [progressMap, summaryCount]
  )

  const completedCount = challenges.filter((c) => c.completed).length

  return (
    <div className="bg-bg-secondary rounded-card shadow-card p-4">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-sm font-bold text-text-primary flex items-center gap-1.5">
          <Target className="w-4 h-4 text-teal" />
          今週のチャレンジ
        </h2>
        <span className="text-xs text-text-secondary">
          {completedCount}/{challenges.length} 達成
        </span>
      </div>

      <div className="space-y-2.5">
        {challenges.map((challenge) => (
          <ChallengeItem key={challenge.id} challenge={challenge} />
        ))}
      </div>
    </div>
  )
}

function ChallengeItem({ challenge }: { challenge: Challenge }) {
  const percentage = Math.round((challenge.current / challenge.target) * 100)

  return (
    <div className={`flex items-center gap-3 p-2 rounded-lg transition-colors ${
      challenge.completed ? 'bg-success/5' : 'bg-gray-50'
    }`}>
      <span className="text-lg flex-shrink-0">{challenge.icon}</span>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between">
          <span className={`text-xs font-medium ${
            challenge.completed ? 'text-success' : 'text-text-primary'
          }`}>
            {challenge.title}
          </span>
          {challenge.completed ? (
            <Check className="w-4 h-4 text-success flex-shrink-0" />
          ) : (
            <span className="text-[10px] text-text-secondary flex-shrink-0">
              {challenge.current}/{challenge.target}
            </span>
          )}
        </div>
        <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden mt-1">
          <div
            className={`h-full rounded-full transition-all duration-500 ${
              challenge.completed ? 'bg-success' : 'bg-teal'
            }`}
            style={{ width: `${percentage}%` }}
          />
        </div>
      </div>
    </div>
  )
}
