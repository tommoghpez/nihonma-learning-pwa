import { useMemo, useState, useEffect } from 'react'
import { Award } from 'lucide-react'
import { useProgressStore } from '@/stores/useProgressStore'
import { useVideoStore } from '@/stores/useVideoStore'
import { useAuthStore } from '@/stores/useAuthStore'
import { supabase } from '@/lib/supabase'
import { calculateBadges, type Badge } from '@/lib/badges'

export function BadgeList() {
  const progressMap = useProgressStore((s) => s.progressMap)
  const totalCount = useVideoStore((s) => s.totalCount)
  const userId = useAuthStore((s) => s.user?.id)
  const [summaryCount, setSummaryCount] = useState(0)

  useEffect(() => {
    async function fetchCount() {
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
    fetchCount()
  }, [userId])

  // ストリーク日数を計算
  const streakDays = useMemo(() => {
    const todayStr = new Date().toISOString().split('T')[0]
    const dates = new Set<string>()
    for (const p of Object.values(progressMap)) {
      if (p.watched_seconds > 0) {
        dates.add(p.created_at.split('T')[0])
        dates.add(p.updated_at.split('T')[0])
      }
    }

    let streak = 0
    const checkDate = new Date()
    if (!dates.has(todayStr)) checkDate.setDate(checkDate.getDate() - 1)
    while (true) {
      const checkStr = checkDate.toISOString().split('T')[0]
      if (dates.has(checkStr)) {
        streak++
        checkDate.setDate(checkDate.getDate() - 1)
      } else {
        break
      }
    }
    return streak
  }, [progressMap])

  const badges = useMemo(
    () => calculateBadges(progressMap, summaryCount, streakDays, totalCount),
    [progressMap, summaryCount, streakDays, totalCount]
  )

  const unlockedCount = badges.filter((b) => b.unlocked).length

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-base font-bold text-text-primary flex items-center gap-2">
          <Award className="w-5 h-5 text-warning" />
          実績バッジ
        </h2>
        <span className="text-xs text-text-secondary">
          {unlockedCount}/{badges.length} 解除
        </span>
      </div>

      <div className="grid grid-cols-4 gap-2">
        {badges.map((badge) => (
          <BadgeItem key={badge.id} badge={badge} />
        ))}
      </div>
    </div>
  )
}

function BadgeItem({ badge }: { badge: Badge }) {
  const [showDetail, setShowDetail] = useState(false)

  return (
    <div className="relative">
      <button
        onClick={() => setShowDetail(!showDetail)}
        className={`w-full aspect-square rounded-card flex flex-col items-center justify-center gap-1 transition-all ${
          badge.unlocked
            ? 'bg-gradient-to-br from-yellow-50 to-amber-50 shadow-card hover:shadow-md'
            : 'bg-gray-100 opacity-50'
        }`}
      >
        <span className={`text-2xl ${badge.unlocked ? '' : 'grayscale'}`}>
          {badge.icon}
        </span>
        <span className={`text-[9px] font-medium text-center leading-tight px-1 ${
          badge.unlocked ? 'text-text-primary' : 'text-text-secondary'
        }`}>
          {badge.name}
        </span>
      </button>

      {/* 詳細ポップアップ */}
      {showDetail && (
        <div
          className="absolute z-20 bottom-full left-1/2 -translate-x-1/2 mb-1 bg-white rounded-lg shadow-lg p-2 w-36 animate-fade-in"
          onClick={() => setShowDetail(false)}
        >
          <p className="text-[10px] font-medium text-text-primary text-center">
            {badge.unlocked ? badge.description : badge.condition}
          </p>
        </div>
      )}
    </div>
  )
}
