import { X, CheckCircle, AlertCircle, Info } from 'lucide-react'
import { useUIStore, type Toast as ToastType } from '@/stores/useUIStore'

const icons = {
  success: CheckCircle,
  error: AlertCircle,
  info: Info,
}

const styles = {
  success: 'bg-success text-white',
  error: 'bg-error text-white',
  info: 'bg-navy text-white',
}

function ToastItem({ toast }: { toast: ToastType }) {
  const removeToast = useUIStore((s) => s.removeToast)
  const Icon = icons[toast.type]

  return (
    <div className={`flex items-center gap-2 px-4 py-3 rounded-card shadow-lg ${styles[toast.type]}`}>
      <Icon className="w-5 h-5 flex-shrink-0" />
      <span className="text-sm flex-1">{toast.message}</span>
      <button onClick={() => removeToast(toast.id)} className="flex-shrink-0">
        <X className="w-4 h-4" />
      </button>
    </div>
  )
}

export function ToastContainer() {
  const toasts = useUIStore((s) => s.toasts)

  if (toasts.length === 0) return null

  return (
    <div className="fixed top-4 right-4 z-50 flex flex-col gap-2 max-w-sm">
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} />
      ))}
    </div>
  )
}
