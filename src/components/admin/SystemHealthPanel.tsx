import { useState, useEffect } from 'react'
import { RefreshCw, Wifi, WifiOff, Film, Users, Zap, Calendar, Smartphone } from 'lucide-react'
import { Card } from '@/components/common/Card'
import { supabase } from '@/lib/supabase'

interface HealthData {
  supabaseOk: boolean
  pingMs: number
  totalVideos: number
  totalUsers: number
  activeUsers7d: number
  lastSyncAt: string | null
  lastSyncCount: number | null
  appVersion: string
}

export function SystemHealthPanel() {
  const [data, setData] = useState<HealthData | null>(null)
  const [loading, setLoading] = useState(true)

  const fetchHealth = async () => {
    setLoading(true)
    const result: HealthData = {
      supabaseOk: false,
      pingMs: 0,
      totalVideos: 0,
      totalUsers: 0,
      activeUsers7d: 0,
      lastSyncAt: null,
      lastSyncCount: null,
      appVersion: localStorage.getItem('app-version') ?? '不明',
    }

    try {
      // Supabase ping
      const start = Date.now()
      const { error: pingErr } = await supabase.from('users').select('id', { head: true, count: 'exact' })
      result.pingMs = Date.now() - start
      result.supabaseOk = !pingErr

      // 動画数
      const { count: vc } = await supabase.from('videos').select('*', { count: 'exact', head: true })
      result.totalVideos = vc ?? 0

      // ユーザー数
      const { count: uc } = await supabase.from('users').select('*', { count: 'exact', head: true })
      result.totalUsers = uc ?? 0

      // アクティブユーザー（7日以内）
      const sevenDaysAgo = new Date()
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
      const { data: activeData } = await supabase
        .from('watch_progress')
        .select('user_id')
        .gte('updated_at', sevenDaysAgo.toISOString())
      result.activeUsers7d = new Set(activeData?.map((r) => r.user_id)).size

      // 最終同期
      const { data: syncData } = await supabase
        .from('sync_logs')
        .select('synced_at, video_count')
        .order('synced_at', { ascending: false })
        .limit(1)
        .single()
      if (syncData) {
        result.lastSyncAt = syncData.synced_at
        result.lastSyncCount = syncData.video_count
      }
    } catch {
      // 接続失敗
    }

    setData(result)
    setLoading(false)
  }

  useEffect(() => {
    fetchHealth()
  }, [])

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr)
    return `${d.getMonth() + 1}/${d.getDate()} ${d.getHours()}:${String(d.getMinutes()).padStart(2, '0')}`
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-bold text-text-primary">システムヘルス</h2>
        <button
          onClick={fetchHealth}
          disabled={loading}
          className="flex items-center gap-1 text-xs text-teal hover:text-teal-700 disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          更新
        </button>
      </div>

      {loading && !data ? (
        <p className="text-sm text-text-secondary text-center py-8">読み込み中...</p>
      ) : data ? (
        <div className="grid grid-cols-2 gap-2">
          {/* Supabase接続 */}
          <Card className="p-3">
            <div className="flex items-center gap-2 mb-1">
              {data.supabaseOk ? (
                <Wifi className="w-4 h-4 text-success" />
              ) : (
                <WifiOff className="w-4 h-4 text-red-500" />
              )}
              <span className="text-[10px] text-text-secondary">Supabase</span>
            </div>
            <p className={`text-lg font-bold ${data.supabaseOk ? 'text-success' : 'text-red-500'}`}>
              {data.supabaseOk ? `${data.pingMs}ms` : 'Error'}
            </p>
            <p className="text-[10px] text-text-secondary">
              {data.supabaseOk ? '接続OK' : '接続エラー'}
            </p>
          </Card>

          {/* 動画数 */}
          <Card className="p-3">
            <div className="flex items-center gap-2 mb-1">
              <Film className="w-4 h-4 text-teal" />
              <span className="text-[10px] text-text-secondary">動画数</span>
            </div>
            <p className="text-lg font-bold text-navy">{data.totalVideos}</p>
            <p className="text-[10px] text-text-secondary">本</p>
          </Card>

          {/* 最終同期 */}
          <Card className="p-3">
            <div className="flex items-center gap-2 mb-1">
              <Calendar className="w-4 h-4 text-warning" />
              <span className="text-[10px] text-text-secondary">最終同期</span>
            </div>
            <p className="text-sm font-bold text-navy">
              {data.lastSyncAt ? formatDate(data.lastSyncAt) : '未同期'}
            </p>
            {data.lastSyncCount !== null && (
              <p className="text-[10px] text-text-secondary">{data.lastSyncCount}本取得</p>
            )}
          </Card>

          {/* ユーザー数 */}
          <Card className="p-3">
            <div className="flex items-center gap-2 mb-1">
              <Users className="w-4 h-4 text-navy" />
              <span className="text-[10px] text-text-secondary">ユーザー数</span>
            </div>
            <p className="text-lg font-bold text-navy">{data.totalUsers}</p>
            <p className="text-[10px] text-text-secondary">人</p>
          </Card>

          {/* アクティブ */}
          <Card className="p-3">
            <div className="flex items-center gap-2 mb-1">
              <Zap className="w-4 h-4 text-success" />
              <span className="text-[10px] text-text-secondary">アクティブ(7日)</span>
            </div>
            <p className="text-lg font-bold text-success">{data.activeUsers7d}</p>
            <p className="text-[10px] text-text-secondary">人</p>
          </Card>

          {/* アプリVer */}
          <Card className="p-3">
            <div className="flex items-center gap-2 mb-1">
              <Smartphone className="w-4 h-4 text-text-secondary" />
              <span className="text-[10px] text-text-secondary">アプリVer</span>
            </div>
            <p className="text-lg font-bold text-navy">v{data.appVersion}</p>
            <p className="text-[10px] text-text-secondary">現行バージョン</p>
          </Card>
        </div>
      ) : null}
    </div>
  )
}
