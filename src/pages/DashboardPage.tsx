import { useEffect, useMemo } from 'react'
import { useAuthStore } from '@/stores/useAuthStore'
import { useVideoStore } from '@/stores/useVideoStore'
import { useProgressStore } from '@/stores/useProgressStore'
import { ProgressSummary } from '@/components/dashboard/ProgressSummary'
import { TyranStreak } from '@/components/dashboard/TyranStreak'
import { NextVideoSection } from '@/components/dashboard/NextVideoSection'
import { WeeklyChallenge } from '@/components/dashboard/WeeklyChallenge'
import { TeamActivity } from '@/components/dashboard/TeamActivity'
import { TeamRanking } from '@/components/dashboard/TeamRanking'
import { LearningPath } from '@/components/dashboard/LearningPath'
import { RecentActivity } from '@/components/dashboard/RecentActivity'
import { NotificationBanner } from '@/components/common/NotificationBanner'
import { LoadingSpinner } from '@/components/common/LoadingSpinner'

export function DashboardPage() {
  const user = useAuthStore((s) => s.user)
  const { videos, fetchVideos, isLoading: videosLoading } = useVideoStore()
  const { progressMap, fetchUserProgress } = useProgressStore()

  useEffect(() => {
    if (videos.length === 0) fetchVideos(true)
    if (user) fetchUserProgress(user.id)
  }, [user])

  // 今日の学習状況を計算
  const { hasLearnedToday, streakDays } = useMemo(() => {
    const todayStr = new Date().toISOString().split('T')[0]
    const dates = new Set<string>()
    for (const p of Object.values(progressMap)) {
      if (p.watched_seconds > 0) {
        dates.add(p.created_at.split('T')[0])
        dates.add(p.updated_at.split('T')[0])
      }
    }
    const learned = dates.has(todayStr)

    // ストリーク日数を計算
    let streak = 0
    const checkDate = new Date()
    if (!learned) checkDate.setDate(checkDate.getDate() - 1)
    while (dates.size > 0) {
      const checkStr = checkDate.toISOString().split('T')[0]
      if (dates.has(checkStr)) {
        streak++
        checkDate.setDate(checkDate.getDate() - 1)
      } else {
        break
      }
    }
    return { hasLearnedToday: learned, streakDays: streak }
  }, [progressMap])

  // 時間帯別あいさつ
  const timeGreeting = useMemo(() => {
    const hour = new Date().getHours()
    if (hour < 12) return 'おはようございます'
    if (hour < 18) return 'こんにちは'
    return 'こんばんは'
  }, [])

  if (videosLoading && videos.length === 0) {
    return <LoadingSpinner className="py-12" />
  }

  return (
    <div className="space-y-6">
      {/* アプリ内通知バナー */}
      <NotificationBanner />

      {/* 強化されたあいさつ + 今日の目標 */}
      <div className="space-y-2">
        <h1 className="text-xl font-bold text-text-primary">
          {timeGreeting}、{user ? `${user.display_name}さん` : 'ゲストさん'}
        </h1>
        <div className={`rounded-xl p-3 ${
          hasLearnedToday
            ? 'bg-gradient-to-r from-green-50 to-teal-50 border border-green-200'
            : 'bg-gradient-to-r from-orange-50 to-amber-50 border border-orange-200'
        }`}>
          <div className="flex items-center gap-2">
            <span className="text-lg">{hasLearnedToday ? '🎉' : '🦖'}</span>
            <div className="flex-1">
              <p className="text-sm font-medium text-text-primary">
                {hasLearnedToday
                  ? '今日も学習しました！素晴らしい！'
                  : '今日1本動画を見てティランを育てよう！'}
              </p>
              {streakDays > 0 && (
                <p className="text-xs text-text-secondary mt-0.5">
                  🔥 {streakDays}日連続学習中
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 週間チャレンジ */}
      <WeeklyChallenge />

      {/* まず行動を促す — 次に見る動画 */}
      <NextVideoSection />

      {/* ティラン育成（モチベーション） */}
      <TyranStreak />

      {/* 学習パス */}
      <LearningPath />

      {/* 学習統計 */}
      <ProgressSummary />

      {/* チームの活動フィード */}
      <TeamActivity />

      {/* チームランキング */}
      <TeamRanking />

      {/* 最近のアクティビティ */}
      <RecentActivity />
    </div>
  )
}
