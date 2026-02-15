// 週間チャレンジシステム
// DB不要 — progressMap + summaries数から算出

import type { WatchProgress } from '@/types'

export interface Challenge {
  id: string
  title: string
  description: string
  icon: string
  target: number
  current: number
  completed: boolean
}

// 今週の月曜日（00:00:00）を取得
function getThisMonday(): Date {
  const now = new Date()
  const day = now.getDay()
  const diff = day === 0 ? -6 : 1 - day // 日曜日は-6
  const monday = new Date(now)
  monday.setDate(monday.getDate() + diff)
  monday.setHours(0, 0, 0, 0)
  return monday
}

// 今週の日付文字列セットを取得
function getThisWeekDateStrings(): Set<string> {
  const monday = getThisMonday()
  const dates = new Set<string>()
  for (let i = 0; i < 7; i++) {
    const d = new Date(monday)
    d.setDate(d.getDate() + i)
    dates.add(d.toISOString().split('T')[0])
  }
  return dates
}

export function calculateWeeklyChallenges(
  progressMap: Record<string, WatchProgress>,
  _summaryCount: number
): Challenge[] {
  const weekDates = getThisWeekDateStrings()

  // 今週完了した動画数
  const completedThisWeek = Object.values(progressMap).filter((p) => {
    if (!p.completed || !p.completed_at) return false
    const dateStr = p.completed_at.split('T')[0]
    return weekDates.has(dateStr)
  }).length

  // 今週視聴した動画数（少しでも見た）
  const watchedThisWeek = Object.values(progressMap).filter((p) => {
    if (p.watched_seconds <= 0) return false
    const dateStr = p.updated_at.split('T')[0]
    return weekDates.has(dateStr)
  }).length

  // 今週学習した日数
  const learnedDaysThisWeek = new Set<string>()
  for (const p of Object.values(progressMap)) {
    if (p.watched_seconds > 0) {
      const created = p.created_at.split('T')[0]
      const updated = p.updated_at.split('T')[0]
      if (weekDates.has(created)) learnedDaysThisWeek.add(created)
      if (weekDates.has(updated)) learnedDaysThisWeek.add(updated)
    }
  }

  return [
    {
      id: 'watch-3',
      title: '動画を3本見よう',
      description: '今週中に3本の動画を視聴しよう',
      icon: '🎬',
      target: 3,
      current: Math.min(watchedThisWeek, 3),
      completed: watchedThisWeek >= 3,
    },
    {
      id: 'complete-1',
      title: '1本完了しよう',
      description: '動画を最後まで見てみよう',
      icon: '✅',
      target: 1,
      current: Math.min(completedThisWeek, 1),
      completed: completedThisWeek >= 1,
    },
    {
      id: 'streak-5',
      title: '5日連続学習',
      description: '今週5日間学習しよう',
      icon: '🔥',
      target: 5,
      current: Math.min(learnedDaysThisWeek.size, 5),
      completed: learnedDaysThisWeek.size >= 5,
    },
  ]
}
