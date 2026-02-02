import { useEffect } from 'react'
import { Routes, Route } from 'react-router-dom'
import { useAuthStore } from '@/stores/useAuthStore'
import { Layout } from '@/components/layout/Layout'
import { AuthGuard } from '@/components/layout/AuthGuard'
import { FullPageSpinner } from '@/components/common/LoadingSpinner'
import { LoginPage } from '@/pages/LoginPage'
import { DashboardPage } from '@/pages/DashboardPage'
import { VideoListPage } from '@/pages/VideoListPage'
import { VideoPlayerPage } from '@/pages/VideoPlayerPage'
import { ReviewPage } from '@/pages/ReviewPage'
import { SearchPage } from '@/pages/SearchPage'
import { ProfilePage } from '@/pages/ProfilePage'
import { AdminQuizPage } from '@/pages/AdminQuizPage'
import { NotFoundPage } from '@/pages/NotFoundPage'

export function App() {
  const initialize = useAuthStore((s) => s.initialize)
  const isLoading = useAuthStore((s) => s.isLoading)

  useEffect(() => {
    initialize()
  }, [])

  if (isLoading) {
    return <FullPageSpinner />
  }

  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route
        element={
          <AuthGuard>
            <Layout />
          </AuthGuard>
        }
      >
        <Route index element={<DashboardPage />} />
        <Route path="videos" element={<VideoListPage />} />
        <Route path="videos/:id" element={<VideoPlayerPage />} />
        <Route path="videos/:id/review" element={<ReviewPage />} />
        <Route path="search" element={<SearchPage />} />
        <Route path="profile" element={<ProfilePage />} />
        <Route path="admin/quiz" element={<AdminQuizPage />} />
      </Route>
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  )
}
