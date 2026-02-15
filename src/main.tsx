import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { App } from './App'
import { ErrorBoundary } from '@/components/common/ErrorBoundary'
import './index.css'

// PWA service worker registration
import { registerSW } from 'virtual:pwa-register'

const updateSW = registerSW({
  onNeedRefresh() {
    // 新バージョン検知時に即座に更新を適用
    updateSW(true)
  },
  onOfflineReady() {
    console.log('オフラインで使用可能です')
  },
})

// 1時間ごとにSW更新チェック（Safari対策）
setInterval(() => {
  updateSW()
}, 60 * 60 * 1000)

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ErrorBoundary>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </ErrorBoundary>
  </React.StrictMode>
)
