// 実績バッジシステム
// DB不要 — progressMap + summaryCount + streakDays から判定

import type { WatchProgress } from '@/types'
import { toLocalDateKey } from '@/lib/tyran'

export interface Badge {
  id: string
  name: string
  description: string
  icon: string
  unlocked: boolean
  condition: string // 未解除時に表示する条件説明
}

export function calculateBadges(
  progressMap: Record<string, WatchProgress>,
  summaryCount: number,
  streakDays: number,
  totalVideoCount: number
): Badge[] {
  const watchedCount = Object.values(progressMap).filter(
    (p) => p.watched_seconds > 0
  ).length
  const completedCount = Object.values(progressMap).filter(
    (p) => p.completed
  ).length

  // 1日で完了した動画数の最大値を計算
  const completionsByDate = new Map<string, number>()
  for (const p of Object.values(progressMap)) {
    if (p.completed && p.completed_at) {
      const dateStr = toLocalDateKey(new Date(p.completed_at))
      completionsByDate.set(dateStr, (completionsByDate.get(dateStr) ?? 0) + 1)
    }
  }
  const maxCompletionsInOneDay = Math.max(0, ...completionsByDate.values())

  return [
    {
      id: 'first-step',
      name: '初めての一歩',
      description: '初めて動画を視聴した',
      icon: '🐣',
      unlocked: watchedCount >= 1,
      condition: '動画を1本視聴しよう',
    },
    {
      id: 'note-taker',
      name: 'メモ魔',
      description: 'ノートを3つ書いた',
      icon: '📝',
      unlocked: summaryCount >= 3,
      condition: `ノートを3つ書こう (${summaryCount}/3)`,
    },
    {
      id: 'streak-7',
      name: '連続学習者',
      description: '7日連続で学習した',
      icon: '🔥',
      unlocked: streakDays >= 7,
      condition: `7日連続学習しよう (${streakDays}/7)`,
    },
    {
      id: 'complete-5',
      name: '5本制覇',
      description: '動画を5本完了した',
      icon: '🎯',
      unlocked: completedCount >= 5,
      condition: `動画を5本完了しよう (${completedCount}/5)`,
    },
    {
      id: 'speed-learner',
      name: 'スピードラーナー',
      description: '1日で3本の動画を完了した',
      icon: '⚡',
      unlocked: maxCompletionsInOneDay >= 3,
      condition: '1日で3本の動画を完了しよう',
    },
    {
      id: 'completer',
      name: 'コンプリート',
      description: '全動画を視聴完了した',
      icon: '🏆',
      unlocked: totalVideoCount > 0 && completedCount >= totalVideoCount,
      condition: `全動画を完了しよう (${completedCount}/${totalVideoCount})`,
    },
    {
      id: 'king-road',
      name: 'キングへの道',
      description: 'ティランを30日間育てた',
      icon: '👑',
      unlocked: streakDays >= 30,
      condition: `30日連続学習しよう (${streakDays}/30)`,
    },
    {
      id: 'note-master',
      name: 'ノートマスター',
      description: 'ノートを10個書いた',
      icon: '📚',
      unlocked: summaryCount >= 10,
      condition: `ノートを10個書こう (${summaryCount}/10)`,
    },
  ]
}
