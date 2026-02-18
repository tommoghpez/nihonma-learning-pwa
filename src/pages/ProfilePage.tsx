import { useState, useEffect, useMemo } from 'react'
import { LogOut, Save, Pencil, BookOpen, CheckCircle2, Clock, MessageSquarePlus, Bug, Lightbulb, Send, Shield } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '@/stores/useAuthStore'
import { useProgressStore } from '@/stores/useProgressStore'
import { useVideoStore } from '@/stores/useVideoStore'
import { useUIStore } from '@/stores/useUIStore'
import { Button } from '@/components/common/Button'
import { Input } from '@/components/common/Input'
import { Card } from '@/components/common/Card'
import { AvatarPicker } from '@/components/profile/AvatarPicker'
import { BadgeList } from '@/components/profile/BadgeList'
import { supabase } from '@/lib/supabase'
import {
  parseAvatarString,
  avatarConfigToString,
  getAvatarDataUrl,
  type AvatarConfig,
} from '@/lib/avatars'

export function ProfilePage() {
  const navigate = useNavigate()
  const { user, signOut, updateProfile, isNewUser, clearNewUserFlag, isAdmin } = useAuthStore()
  const addToast = useUIStore((s) => s.addToast)
  const progressMap = useProgressStore((s) => s.progressMap)
  const totalCount = useVideoStore((s) => s.totalCount)
  const fetchVideos = useVideoStore((s) => s.fetchVideos)
  const [displayName, setDisplayName] = useState(user?.display_name ?? '')
  const [avatarConfig, setAvatarConfig] = useState<AvatarConfig>(() =>
    parseAvatarString(user?.avatar_url)
  )
  const [showAvatarPicker, setShowAvatarPicker] = useState(isNewUser)
  const [saving, setSaving] = useState(false)

  // フィードバック関連
  const [feedbackType, setFeedbackType] = useState<'request' | 'bug'>('request')
  const [feedbackContent, setFeedbackContent] = useState('')
  const [sendingFeedback, setSendingFeedback] = useState(false)

  useEffect(() => {
    if (user) {
      setDisplayName(user.display_name)
      setAvatarConfig(parseAvatarString(user.avatar_url))
    }
  }, [user])

  // totalCountがない場合は取得
  useEffect(() => {
    if (totalCount === 0) {
      fetchVideos(true)
    }
  }, [totalCount, fetchVideos])

  const stats = useMemo(() => {
    const completed = Object.values(progressMap).filter((p) => p.completed).length
    const total = totalCount // 全動画数を使用
    const watchedSeconds = Object.values(progressMap).reduce((s, p) => s + p.watched_seconds, 0)
    return { completed, total, watchedSeconds }
  }, [progressMap, totalCount])

  const handleSave = async () => {
    if (!displayName.trim()) return
    setSaving(true)
    await updateProfile({
      display_name: displayName.trim(),
      avatar_url: avatarConfigToString(avatarConfig),
    })
    setSaving(false)
    addToast('プロフィールを更新しました', 'success')

    // 初回ユーザーフラグをクリアしてダッシュボードへ
    if (isNewUser) {
      clearNewUserFlag()
      navigate('/')
    }
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

  // フィードバック送信
  const handleSendFeedback = async () => {
    if (!feedbackContent.trim() || !user) return
    setSendingFeedback(true)
    const { error } = await supabase.from('feedback').insert({
      user_id: user.id,
      type: feedbackType,
      content: feedbackContent.trim(),
    })
    setSendingFeedback(false)
    if (!error) {
      addToast('フィードバックを送信しました！ありがとうございます 🎉', 'success')
      setFeedbackContent('')
    } else {
      addToast('送信に失敗しました。もう一度お試しください', 'error')
    }
  }

  return (
    <div className="space-y-6">
      {/* 初回ユーザー向けウェルカムバナー */}
      {isNewUser && (
        <Card className="bg-gradient-to-r from-teal-50 to-sky-50 border-2 border-teal-200">
          <div className="text-center space-y-2">
            <p className="text-2xl">🦖🎉</p>
            <h2 className="text-lg font-bold text-navy">ようこそ MA NAVI へ！</h2>
            <p className="text-sm text-text-secondary">
              まずは名前とアイコンを設定しましょう！<br />
              設定したら「保存」を押してスタート！
            </p>
          </div>
        </Card>
      )}

      <h1 className="text-xl font-bold text-text-primary">プロフィール</h1>

      <Card>
        <div className="flex items-center gap-4 mb-4">
          <button
            onClick={() => setShowAvatarPicker(!showAvatarPicker)}
            className="relative group"
          >
            <img
              src={getAvatarDataUrl(avatarConfig.character, avatarConfig.colorName)}
              alt="アバター"
              className="w-16 h-16 rounded-full"
            />
            <div className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
              <Pencil className="w-5 h-5 text-white" />
            </div>
          </button>
          <div>
            <p className="font-bold text-text-primary">{user?.display_name}</p>
            <p className="text-sm text-text-secondary">{user?.email}</p>
            <p className="text-xs text-text-secondary mt-1">
              {user?.role === 'admin' ? '管理者' : 'メンバー'}
            </p>
          </div>
        </div>

        {showAvatarPicker && (
          <div className="mb-4 p-4 bg-bg-secondary rounded-lg">
            <AvatarPicker value={avatarConfig} onChange={setAvatarConfig} />
          </div>
        )}

        <div className="space-y-3">
          <Input
            label="表示名"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
          />
          <Button onClick={handleSave} isLoading={saving} size="sm">
            <Save className="w-4 h-4 mr-1" />
            {isNewUser ? '保存してスタート！🚀' : '保存'}
          </Button>
        </div>
      </Card>

      <Card className="p-0 overflow-hidden">
        <div className="bg-gradient-to-r from-navy to-navy-600 p-4 text-white">
          <h2 className="text-base font-bold">学習統計</h2>
        </div>
        <div className="grid grid-cols-3 divide-x divide-border p-4">
          <div className="text-center px-2">
            <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-2">
              <CheckCircle2 className="w-5 h-5 text-success" />
            </div>
            <div className="text-2xl font-bold text-navy">{stats.completed}</div>
            <div className="text-[10px] text-text-secondary">完了動画</div>
          </div>
          <div className="text-center px-2">
            <div className="w-10 h-10 bg-teal-100 rounded-full flex items-center justify-center mx-auto mb-2">
              <BookOpen className="w-5 h-5 text-teal" />
            </div>
            <div className="text-2xl font-bold text-teal">{stats.total}</div>
            <div className="text-[10px] text-text-secondary">全動画</div>
          </div>
          <div className="text-center px-2">
            <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-2">
              <Clock className="w-5 h-5 text-warning" />
            </div>
            <div className="text-2xl font-bold text-warning">
              {formatTime(stats.watchedSeconds)}
            </div>
            <div className="text-[10px] text-text-secondary">学習時間</div>
          </div>
        </div>
      </Card>

      {/* 実績バッジ */}
      <Card>
        <BadgeList />
      </Card>

      {/* 要望・バグ報告 */}
      <Card>
        <div className="flex items-center gap-2 mb-3">
          <MessageSquarePlus className="w-5 h-5 text-teal" />
          <h2 className="text-base font-bold text-text-primary">要望・バグ報告</h2>
        </div>

        {/* タイプ選択 */}
        <div className="flex gap-2 mb-3">
          <button
            onClick={() => setFeedbackType('request')}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-lg text-sm font-medium transition-all ${
              feedbackType === 'request'
                ? 'bg-teal text-white shadow-sm'
                : 'bg-gray-100 text-text-secondary hover:bg-gray-200'
            }`}
          >
            <Lightbulb className="w-4 h-4" />
            要望
          </button>
          <button
            onClick={() => setFeedbackType('bug')}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-lg text-sm font-medium transition-all ${
              feedbackType === 'bug'
                ? 'bg-red-500 text-white shadow-sm'
                : 'bg-gray-100 text-text-secondary hover:bg-gray-200'
            }`}
          >
            <Bug className="w-4 h-4" />
            バグ報告
          </button>
        </div>

        {/* 内容入力 */}
        <textarea
          value={feedbackContent}
          onChange={(e) => setFeedbackContent(e.target.value)}
          placeholder={feedbackType === 'request' ? 'こんな機能が欲しい！...' : 'どんなバグが起きた？...'}
          className="w-full h-24 p-3 border border-border rounded-lg text-sm resize-none focus:outline-none focus:ring-2 focus:ring-teal/50 focus:border-teal"
        />

        <Button
          onClick={handleSendFeedback}
          isLoading={sendingFeedback}
          size="sm"
          className="mt-2"
          disabled={!feedbackContent.trim()}
        >
          <Send className="w-4 h-4 mr-1" />
          送信
        </Button>
      </Card>

      {/* 管理者専用：管理ダッシュボードリンク */}
      {isAdmin && (
        <Button variant="ghost" onClick={() => navigate('/admin')} className="w-full">
          <Shield className="w-4 h-4 mr-2" />
          管理ダッシュボード
        </Button>
      )}

      <Button variant="danger" onClick={handleSignOut} className="w-full">
        <LogOut className="w-4 h-4 mr-2" />
        ログアウト
      </Button>
    </div>
  )
}
