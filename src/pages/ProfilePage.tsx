import { useState, useEffect, useMemo } from 'react'
import { LogOut, Save } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '@/stores/useAuthStore'
import { useProgressStore } from '@/stores/useProgressStore'
import { useVideoStore } from '@/stores/useVideoStore'
import { useUIStore } from '@/stores/useUIStore'
import { Button } from '@/components/common/Button'
import { Input } from '@/components/common/Input'
import { Card } from '@/components/common/Card'

export function ProfilePage() {
  const navigate = useNavigate()
  const { user, signOut, updateProfile } = useAuthStore()
  const addToast = useUIStore((s) => s.addToast)
  const progressMap = useProgressStore((s) => s.progressMap)
  const videos = useVideoStore((s) => s.videos)
  const [displayName, setDisplayName] = useState(user?.display_name ?? '')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (user) setDisplayName(user.display_name)
  }, [user])

  const stats = useMemo(() => {
    const completed = Object.values(progressMap).filter((p) => p.completed).length
    const total = videos.length
    const watchedSeconds = Object.values(progressMap).reduce((s, p) => s + p.watched_seconds, 0)
    return { completed, total, watchedSeconds }
  }, [progressMap, videos])

  const handleSave = async () => {
    if (!displayName.trim()) return
    setSaving(true)
    await updateProfile({ display_name: displayName.trim() })
    setSaving(false)
    addToast('プロフィールを更新しました', 'success')
  }

  const handleSignOut = async () => {
    await signOut()
    navigate('/login')
  }

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    if (hours > 0) return `${hours}時間${minutes}分`
    return `${minutes}分`
  }

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-bold text-text-primary">プロフィール</h1>

      <Card>
        <div className="flex items-center gap-4 mb-4">
          <div className="w-16 h-16 rounded-full bg-navy flex items-center justify-center text-white text-2xl font-bold">
            {(user?.display_name ?? user?.email ?? '?').charAt(0).toUpperCase()}
          </div>
          <div>
            <p className="font-bold text-text-primary">{user?.display_name}</p>
            <p className="text-sm text-text-secondary">{user?.email}</p>
            <p className="text-xs text-text-secondary mt-1">
              {user?.role === 'admin' ? '管理者' : 'メンバー'}
            </p>
          </div>
        </div>

        <div className="space-y-3">
          <Input
            label="表示名"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
          />
          <Button onClick={handleSave} isLoading={saving} size="sm">
            <Save className="w-4 h-4 mr-1" /> 保存
          </Button>
        </div>
      </Card>

      <Card>
        <h2 className="text-base font-bold text-text-primary mb-3">学習統計</h2>
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <div className="text-2xl font-bold text-navy">{stats.completed}</div>
            <div className="text-xs text-text-secondary">完了動画</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-teal">{stats.total}</div>
            <div className="text-xs text-text-secondary">全動画</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-warning">
              {formatTime(stats.watchedSeconds)}
            </div>
            <div className="text-xs text-text-secondary">学習時間</div>
          </div>
        </div>
      </Card>

      <Button variant="danger" onClick={handleSignOut} className="w-full">
        <LogOut className="w-4 h-4 mr-2" />
        ログアウト
      </Button>
    </div>
  )
}
