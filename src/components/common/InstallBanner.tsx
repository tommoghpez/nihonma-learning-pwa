import { useState, useEffect } from 'react'
import { X, Download } from 'lucide-react'

const DISMISS_KEY = 'nihonma-install-dismissed'

// すでにPWAとしてインストール済みか
function isStandalone(): boolean {
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (navigator as any).standalone === true
  )
}

function isIOS(): boolean {
  return /iPad|iPhone|iPod/.test(navigator.userAgent)
}

function isDismissed(): boolean {
  try {
    return localStorage.getItem(DISMISS_KEY) === '1'
  } catch {
    return false
  }
}

function dismiss() {
  localStorage.setItem(DISMISS_KEY, '1')
}

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

export function InstallBanner() {
  const [visible, setVisible] = useState(false)
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const ios = isIOS()

  useEffect(() => {
    // すでに閉じた or インストール済みなら表示しない
    if (isDismissed() || isStandalone()) return

    setVisible(true)

    // Android Chrome: beforeinstallprompt を捕捉
    const handler = (e: Event) => {
      e.preventDefault()
      setDeferredPrompt(e as BeforeInstallPromptEvent)
    }
    window.addEventListener('beforeinstallprompt', handler)
    return () => window.removeEventListener('beforeinstallprompt', handler)
  }, [])

  if (!visible) return null

  const handleDismiss = () => {
    dismiss()
    setVisible(false)
  }

  const handleInstall = async () => {
    if (!deferredPrompt) return
    await deferredPrompt.prompt()
    const { outcome } = await deferredPrompt.userChoice
    if (outcome === 'accepted') {
      handleDismiss()
    }
    setDeferredPrompt(null)
  }

  return (
    <div className="flex items-start gap-2 px-3 py-2.5 rounded-card border bg-blue-50 border-blue-200 mb-4 animate-fade-in">
      <span className="text-base flex-shrink-0 mt-0.5">📲</span>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-bold text-blue-800 mb-0.5">
          ホーム画面に追加しよう
        </p>
        {ios ? (
          <p className="text-[11px] text-blue-700 leading-relaxed">
            画面下の <span className="inline-block">共有ボタン</span>
            <span className="text-sm">（↑）</span>→「ホーム画面に追加」をタップ
          </p>
        ) : deferredPrompt ? (
          <button
            onClick={handleInstall}
            className="mt-1 flex items-center gap-1 text-[11px] font-bold text-white bg-blue-600 hover:bg-blue-700 px-3 py-1 rounded-full transition-colors"
          >
            <Download className="w-3 h-3" />
            インストール
          </button>
        ) : (
          <p className="text-[11px] text-blue-700 leading-relaxed">
            ブラウザのメニュー →「ホーム画面に追加」でアプリとして使えます
          </p>
        )}
      </div>
      <button
        onClick={handleDismiss}
        className="text-blue-400 hover:text-blue-600 flex-shrink-0 mt-0.5"
      >
        <X className="w-3.5 h-3.5" />
      </button>
    </div>
  )
}
