import { useState, useEffect } from 'react'
import { RefreshCw } from 'lucide-react'
import { Card } from '@/components/common/Card'
import { supabase } from '@/lib/supabase'
import { getAvatarDataUrl, parseAvatarString } from '@/lib/avatars'

interface FeedbackItem {
  id: string
  user_id: string
  type: 'request' | 'bug'
  content: string
  created_at: string
  user_name: string
  user_avatar: string | null
}

type FilterType = 'all' | 'bug' | 'request'

export function FeedbackPanel() {
  const [items, setItems] = useState<FeedbackItem[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<FilterType>('all')

  const fetchFeedback = async () => {
    setLoading(true)

    const { data } = await supabase
      .from('feedback')
      .select('*')
      .order('created_at', { ascending: false })

    if (data) {
      const userIds = [...new Set(data.map((f: { user_id: string }) => f.user_id))]
      const { data: users } = await supabase
        .from('users')
        .select('id, display_name, avatar_url')
        .in('id', userIds)

      const userMap = new Map(
        users?.map((u: { id: string; display_name: string; avatar_url: string | null }) => [
          u.id,
          { name: u.display_name, avatar: u.avatar_url },
        ]) ?? []
      )

      setItems(
        data.map((f: { id: string; user_id: string; type: 'request' | 'bug'; content: string; created_at: string }) => ({
          ...f,
          user_name: userMap.get(f.user_id)?.name ?? '不明',
          user_avatar: userMap.get(f.user_id)?.avatar ?? null,
        }))
      )
    }

    setLoading(false)
  }

  useEffect(() => {
    fetchFeedback()
  }, [])

  const filtered = filter === 'all' ? items : items.filter((f) => f.type === filter)
  const bugCount = items.filter((f) => f.type === 'bug').length
  const reqCount = items.filter((f) => f.type === 'request').length

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr)
    return `${d.getMonth() + 1}/${d.getDate()} ${d.getHours()}:${String(d.getMinutes()).padStart(2, '0')}`
  }

  const getAvatarSrc = (avatarUrl: string | null) => {
    const config = parseAvatarString(avatarUrl)
    return getAvatarDataUrl(config.character, config.colorName)
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-bold text-text-primary">
          フィードバック
          <span className="ml-2 text-xs font-normal text-text-secondary">{items.length}件</span>
        </h2>
        <button
          onClick={fetchFeedback}
          disabled={loading}
          className="flex items-center gap-1 text-xs text-teal hover:text-teal-700 disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          更新
        </button>
      </div>

      {/* フィルター */}
      <div className="flex gap-1">
        {[
          { key: 'all' as FilterType, label: `全部 (${items.length})` },
          { key: 'bug' as FilterType, label: `バグ (${bugCount})` },
          { key: 'request' as FilterType, label: `要望 (${reqCount})` },
        ].map((f) => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
              filter === f.key
                ? f.key === 'bug'
                  ? 'bg-red-500 text-white'
                  : f.key === 'request'
                    ? 'bg-teal text-white'
                    : 'bg-navy text-white'
                : 'bg-gray-100 text-text-secondary hover:bg-gray-200'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* リスト */}
      {loading ? (
        <p className="text-sm text-text-secondary text-center py-8">読み込み中...</p>
      ) : filtered.length === 0 ? (
        <p className="text-sm text-text-secondary text-center py-8">フィードバックはありません</p>
      ) : (
        <div className="space-y-2">
          {filtered.map((fb) => (
            <Card
              key={fb.id}
              className={`p-3 ${
                fb.type === 'bug' ? 'border-red-200 bg-red-50/50' : 'border-teal-200 bg-teal-50/50'
              }`}
            >
              <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center gap-2">
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      fb.type === 'bug' ? 'bg-red-500 text-white' : 'bg-teal text-white'
                    }`}
                  >
                    {fb.type === 'bug' ? 'バグ' : '要望'}
                  </span>
                  <div className="flex items-center gap-1.5">
                    <img
                      src={getAvatarSrc(fb.user_avatar)}
                      alt=""
                      className="w-4 h-4 rounded-full"
                    />
                    <span className="text-xs text-text-primary font-medium">{fb.user_name}</span>
                  </div>
                </div>
                <span className="text-[10px] text-text-secondary">{formatDate(fb.created_at)}</span>
              </div>
              <p className="text-sm text-text-primary whitespace-pre-wrap">{fb.content}</p>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
