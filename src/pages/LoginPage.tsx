import { useState } from 'react'
import { Navigate } from 'react-router-dom'
import { Mail } from 'lucide-react'
import { useAuthStore } from '@/stores/useAuthStore'
import { Button } from '@/components/common/Button'
import { Input } from '@/components/common/Input'

export function LoginPage() {
  const { session, isLoading, signInWithMagicLink } = useAuthStore()
  const [email, setEmail] = useState('')
  const [isSending, setIsSending] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')

  if (session) {
    return <Navigate to="/" replace />
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email.trim()) return

    setIsSending(true)
    setError('')
    const result = await signInWithMagicLink(email)
    setIsSending(false)

    if (result.error) {
      setError(result.error)
    } else {
      setSent(true)
    }
  }

  if (isLoading) return null

  return (
    <div className="min-h-screen bg-bg-primary flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-navy rounded-2xl flex items-center justify-center mx-auto mb-4">
            <span className="text-white text-xl font-bold">M&A</span>
          </div>
          <h1 className="text-2xl font-bold text-text-primary">日本M&A学習</h1>
          <p className="text-sm text-text-secondary mt-1">
            公式YouTube視聴管理アプリ
          </p>
        </div>

        {sent ? (
          <div className="card text-center">
            <Mail className="w-12 h-12 text-navy mx-auto mb-3" />
            <h2 className="text-lg font-bold text-text-primary mb-2">
              メールを送信しました
            </h2>
            <p className="text-sm text-text-secondary mb-4">
              <strong>{email}</strong> に送信されたリンクをクリックしてログインしてください。
            </p>
            <button
              onClick={() => { setSent(false); setEmail('') }}
              className="text-sm text-navy font-medium"
            >
              別のメールアドレスを使う
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="card">
            <h2 className="text-lg font-bold text-text-primary mb-4 text-center">
              ログイン
            </h2>
            <Input
              type="email"
              label="メールアドレス"
              placeholder="example@nihon-ma.co.jp"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              error={error}
              required
            />
            <Button
              type="submit"
              isLoading={isSending}
              className="w-full mt-4"
            >
              <Mail className="w-4 h-4 mr-2" />
              ログインリンクを送信
            </Button>
            <p className="text-xs text-text-secondary text-center mt-3">
              パスワード不要。メールに届くリンクでログインできます。
            </p>
          </form>
        )}
      </div>
    </div>
  )
}
