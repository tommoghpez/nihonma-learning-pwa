import { useEffect } from 'react'
import { useAuthStore } from '@/stores/useAuthStore'
import { useVideoStore } from '@/stores/useVideoStore'
import { useProgressStore } from '@/stores/useProgressStore'
import { ProgressSummary } from '@/components/dashboard/ProgressSummary'
import { NextVideoSection } from '@/components/dashboard/NextVideoSection'
import { TeamRanking } from '@/components/dashboard/TeamRanking'
import { RecentActivity } from '@/components/dashboard/RecentActivity'
import { LoadingSpinner } from '@/components/common/LoadingSpinner'

export function DashboardPage() {
  const user = useAuthStore((s) => s.user)
  const { videos, fetchVideos, isLoading: videosLoading } = useVideoStore()
  const { fetchUserProgress } = useProgressStore()

  useEffect(() => {
    if (videos.length === 0) fetchVideos(true)
    if (user) fetchUserProgress(user.id)
  }, [user])

  if (videosLoading && videos.length === 0) {
    return <LoadingSpinner className="py-12" />
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-text-primary">
          {user ? `${user.display_name}さん` : 'ダッシュボード'}
        </h1>
        <p className="text-sm text-text-secondary">学習の進捗を確認しましょう</p>
      </div>

      <ProgressSummary />
      <NextVideoSection />
      <TeamRanking />
      <RecentActivity />
    </div>
  )
}
