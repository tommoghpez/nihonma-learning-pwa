import { useState, useMemo } from 'react'
import { X, AlertTriangle, Flame, Trophy } from 'lucide-react'
import { useProgressStore } from '@/stores/useProgressStore'

const DISMISS_KEY = 'nihonma-banner-dismissed'

function isDismissedToday(): boolean {
  try {
    const dismissed = localStorage.getItem(DISMISS_KEY)
    if (!dismissed) return false
    return dismissed === new Date().toISOString().split('T')[0]
  } catch {
    return false
  }
}

function dismissToday() {
  localStorage.setItem(DISMISS_KEY, new Date().toISOString().split('T')[0])
}

interface BannerData {
  type: 'warning' | 'encouragement' | 'celebration'
  message: string
  icon: typeof AlertTriangle
  bgClass: string
  textClass: string
}

export function NotificationBanner() {
  const progressMap = useProgressStore((s) => s.progressMap)
  const [isDismissed, setIsDismissed] = useState(isDismissedToday)

  const banner = useMemo<BannerData | null>(() => {
    // 最終学習日を計算
    let lastDate: string | null = null
    for (const p of Object.values(progressMap)) {
      if (p.watched_seconds > 0) {
        const updated = p.updated_at.split('T')[0]
        if (!lastDate || updated > lastDate) lastDate = updated
      }
    }

    if (!lastDate) return null

    const today = new Date().toISOString().split('T')[0]
    const lastDateObj = new Date(lastDate)
    const todayObj = new Date(today)
    const diffDays = Math.floor((todayObj.getTime() - lastDateObj.getTime()) / (1000 * 60 * 60 * 24))

    // 今日学習済み → 学習した日数をカウントして連続日数を判定
    const dates = new Set<string>()
    for (const p of Object.values(progressMap)) {
      if (p.watched_seconds > 0) {
        dates.add(p.created_at.split('T')[0])
        dates.add(p.updated_at.split('T')[0])
      }
    }

    // 連続日数を計算
    let streak = 0
    const checkDate = new Date(todayObj)
    if (!dates.has(today)) checkDate.setDate(checkDate.getDate() - 1)
    while (true) {
      const checkStr = checkDate.toISOString().split('T')[0]
      if (dates.has(checkStr)) {
        streak++
        checkDate.setDate(checkDate.getDate() - 1)
      } else {
        break
      }
    }

    if (diffDays >= 3) {
      return {
        type: 'warning',
        message: `${diffDays}日間学習していません！ティランが心配しているよ😢`,
        icon: AlertTriangle,
        bgClass: 'bg-warning/10 border-warning/30',
        textClass: 'text-warning',
      }
    }

    if (dates.has(today) && streak >= 3) {
      return {
        type: 'celebration',
        message: `${streak}日連続学習中！🎉 この調子で続けよう！`,
        icon: Trophy,
        bgClass: 'bg-success/10 border-success/30',
        textClass: 'text-success',
      }
    }

    if (diffDays === 1 || diffDays === 2) {
      return {
        type: 'encouragement',
        message: streak > 0
          ? `${streak}日連続学習中！今日も学習してストリークを伸ばそう🔥`
          : '今日も学習して連続記録を始めよう！',
        icon: Flame,
        bgClass: 'bg-teal/10 border-teal/30',
        textClass: 'text-teal',
      }
    }

    return null
  }, [progressMap])

  if (isDismissed || !banner) return null

  const Icon = banner.icon

  return (
    <div className={`flex items-center gap-2 px-3 py-2 rounded-card border ${banner.bgClass} mb-4 animate-fade-in`}>
      <Icon className={`w-4 h-4 ${banner.textClass} flex-shrink-0`} />
      <p className="text-xs text-text-primary flex-1">{banner.message}</p>
      <button
        onClick={() => {
          dismissToday()
          setIsDismissed(true)
        }}
        className="text-text-secondary hover:text-text-primary flex-shrink-0"
      >
        <X className="w-3.5 h-3.5" />
      </button>
    </div>
  )
}
