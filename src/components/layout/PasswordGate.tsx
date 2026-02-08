import { useState, useEffect } from 'react'
import { Lock } from 'lucide-react'
import { Button } from '@/components/common/Button'
import { Input } from '@/components/common/Input'

const CORRECT_PASSWORD = 'bwed'
const STORAGE_KEY = 'ma-navi-access-granted'

interface PasswordGateProps {
  children: React.ReactNode
}

export function PasswordGate({ children }: PasswordGateProps) {
  const [isGranted, setIsGranted] = useState<boolean | null>(null)
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    // ローカルストレージから認証状態を確認
    const granted = localStorage.getItem(STORAGE_KEY)
    setIsGranted(granted === 'true')
  }, [])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (password === CORRECT_PASSWORD) {
      localStorage.setItem(STORAGE_KEY, 'true')
      setIsGranted(true)
      setError('')
    } else {
      setError('パスワードが違います')
      setPassword('')
    }
  }

  // 初期ロード中
  if (isGranted === null) {
    return null
  }

  // 認証済み
  if (isGranted) {
    return <>{children}</>
  }

  // パスワード入力画面
  return (
    <div className="min-h-screen bg-bg-primary flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-navy rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Lock className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-text-primary">アクセス認証</h1>
          <p className="text-sm text-text-secondary mt-1">
            パスワードを入力してください
          </p>
        </div>

        <form onSubmit={handleSubmit} className="card">
          <Input
            type="password"
            label="パスワード"
            placeholder="パスワードを入力"
            value={password}
            onChange={(e) => {
              setPassword(e.target.value)
              setError('')
            }}
            error={error}
            required
            autoFocus
          />
          <Button
            type="submit"
            className="w-full mt-4"
          >
            <Lock className="w-4 h-4 mr-2" />
            認証
          </Button>
          <p className="text-xs text-text-secondary text-center mt-3">
            管理者から共有されたパスワードを入力してください
          </p>
        </form>
      </div>
    </div>
  )
}
