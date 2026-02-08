import { useEffect } from 'react'
import { Routes, Route } from 'react-router-dom'
import { useAuthStore } from '@/stores/useAuthStore'
import { Layout } from '@/components/layout/Layout'
import { AuthGuard } from '@/components/layout/AuthGuard'
import { DevGuard } from '@/components/layout/DevGuard'
import { PasswordGate } from '@/components/layout/PasswordGate'
import { FullPageSpinner } from '@/components/common/LoadingSpinner'
import { LoginPage } from '@/pages/LoginPage'
import { DashboardPage } from '@/pages/DashboardPage'
import { VideoListPage } from '@/pages/VideoListPage'
import { VideoPlayerPage } from '@/pages/VideoPlayerPage'
import { NotePage } from '@/pages/NotePage'
import { NotesListPage } from '@/pages/NotesListPage'
import { SearchPage } from '@/pages/SearchPage'
import { ProfilePage } from '@/pages/ProfilePage'
import { NotFoundPage } from '@/pages/NotFoundPage'
import { TyranPreviewPage } from '@/pages/TyranPreviewPage'

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
    <PasswordGate>
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
        <Route path="videos/:id/note" element={<NotePage />} />
        <Route path="notes" element={<NotesListPage />} />
        <Route path="search" element={<SearchPage />} />
        <Route path="profile" element={<ProfilePage />} />
        <Route path="tyran-preview" element={<DevGuard><TyranPreviewPage /></DevGuard>} />
      </Route>
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
    </PasswordGate>
  )
}
