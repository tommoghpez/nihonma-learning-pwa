import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/common/Button'

export function NotFoundPage() {
  const navigate = useNavigate()

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
      <h1 className="text-6xl font-bold text-navy mb-4">404</h1>
      <p className="text-lg text-text-primary mb-2">ページが見つかりません</p>
      <p className="text-sm text-text-secondary mb-6">
        お探しのページは存在しないか、移動した可能性があります。
      </p>
      <Button onClick={() => navigate('/')}>ダッシュボードに戻る</Button>
    </div>
  )
}
