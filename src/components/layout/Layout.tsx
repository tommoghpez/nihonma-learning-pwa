import { Outlet } from 'react-router-dom'
import { Header } from './Header'
import { BottomNav } from './BottomNav'
import { ToastContainer } from '@/components/common/Toast'

export function Layout() {
  return (
    <div className="min-h-screen bg-bg-primary">
      <Header />
      <main className="pb-20 px-4 py-4 max-w-4xl mx-auto">
        <Outlet />
      </main>
      <BottomNav />
      <ToastContainer />
    </div>
  )
}
