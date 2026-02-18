import { useState } from 'react'
import { Shield, Users, MessageSquare, Activity, Bug } from 'lucide-react'
import { UserStatusPanel } from '@/components/admin/UserStatusPanel'
import { FeedbackPanel } from '@/components/admin/FeedbackPanel'
import { SystemHealthPanel } from '@/components/admin/SystemHealthPanel'
import { DebugToolsPanel } from '@/components/admin/DebugToolsPanel'

type AdminTab = 'users' | 'feedback' | 'health' | 'debug'

const TABS: Array<{ key: AdminTab; label: string; icon: typeof Users }> = [
  { key: 'users', label: 'ユーザー', icon: Users },
  { key: 'feedback', label: 'FB', icon: MessageSquare },
  { key: 'health', label: 'システム', icon: Activity },
  { key: 'debug', label: 'デバッグ', icon: Bug },
]

export function AdminPage() {
  const [activeTab, setActiveTab] = useState<AdminTab>('users')
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null)

  const handleSelectUserForDebug = (userId: string) => {
    setSelectedUserId(userId)
    setActiveTab('debug')
  }

  return (
    <div className="space-y-4">
      {/* ヘッダー */}
      <div className="flex items-center gap-2">
        <Shield className="w-5 h-5 text-navy" />
        <h1 className="text-xl font-bold text-text-primary">管理ダッシュボード</h1>
      </div>

      {/* タブバー */}
      <div className="flex gap-1 bg-gray-100 rounded-lg p-1">
        {TABS.map((tab) => {
          const Icon = tab.icon
          const isActive = activeTab === tab.key
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex-1 flex items-center justify-center gap-1 py-2 rounded-md text-xs font-medium transition-all ${
                isActive
                  ? 'bg-white text-navy shadow-sm'
                  : 'text-text-secondary hover:text-text-primary'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              {tab.label}
            </button>
          )
        })}
      </div>

      {/* タブコンテンツ */}
      {activeTab === 'users' && <UserStatusPanel onSelectUser={handleSelectUserForDebug} />}
      {activeTab === 'feedback' && <FeedbackPanel />}
      {activeTab === 'health' && <SystemHealthPanel />}
      {activeTab === 'debug' && <DebugToolsPanel initialUserId={selectedUserId} />}
    </div>
  )
}
