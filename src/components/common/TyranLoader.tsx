import { useMemo, useEffect, useRef, useState } from 'react'

// ベビーティランのピクセルデータ（happy mood）
const BABY_PIXELS = [
  '        DDDDD           ',
  '       DGGGGGD          ',
  '      DGgLLLgGD         ',
  '     DGg WEWE gD       ',
  '     DGgP      PgD      ',
  '      DGgMMMMMgGD       ',
  '       DDDGGGDD         ',
  '        DcCCcD          ',
  '       DcCCCCcD         ',
  '      DcCCCCCCcD        ',
  '       DcCCCCcD         ',
  '        DcCCcD          ',
  '       Dt    tD         ',
  '      TTT    TTT        ',
]

const COLORS: Record<string, string> = {
  D: '#1B5E20', G: '#2E7D32', g: '#4CAF50', L: '#81C784',
  C: '#FFF9C4', c: '#FFF59D', E: '#212121', W: '#FFFFFF',
  P: '#FF8A80', M: '#D32F2F', T: '#5D4037', t: '#795548',
}

function BabyTyranSVG({ size = 64 }: { size?: number }) {
  const rects = useMemo(() => {
    const result: string[] = []
    BABY_PIXELS.forEach((row, y) => {
      for (let x = 0; x < row.length; x++) {
        const ch = row[x]
        if (ch !== ' ' && COLORS[ch]) {
          result.push(`<rect x="${x}" y="${y}" width="1" height="1" fill="${COLORS[ch]}"/>`)
        }
      }
    })
    return result.join('')
  }, [])

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 14"
      xmlns="http://www.w3.org/2000/svg"
      className="tyran-sprite"
      dangerouslySetInnerHTML={{ __html: rects }}
    />
  )
}

// テキストがティラン位置に到達するタイミングを計算するフック
function useJumpTiming(containerRef: React.RefObject<HTMLDivElement | null>) {
  const [jumpPercent, setJumpPercent] = useState(58) // デフォルト値

  useEffect(() => {
    function calculate() {
      const container = containerRef.current
      if (!container) return

      const containerWidth = container.offsetWidth
      const tyranLeft = 48 // left-12 = 48px
      const textWidth = 200 // テキスト幅の推定値

      // テキストは containerWidth → -textWidth まで移動
      const totalDistance = containerWidth + textWidth
      // テキストがティラン位置に到達する割合
      const arrivalPercent = ((containerWidth - tyranLeft) / totalDistance) * 100

      // ジャンプはテキスト到達の少し前に開始（ジャンプ頂点 = テキスト到達）
      setJumpPercent(Math.round(arrivalPercent))
    }

    calculate()
    window.addEventListener('resize', calculate)
    return () => window.removeEventListener('resize', calculate)
  }, [containerRef])

  return jumpPercent
}

// 共通のゲームエリア（フルページ版・インライン版共通）
function TyranGameArea({ compact = false }: { compact?: boolean }) {
  const containerRef = useRef<HTMLDivElement>(null)
  const jumpPercent = useJumpTiming(containerRef)

  // ジャンプ開始はテキスト到達の8%前、頂点は到達時
  const jumpStart = Math.max(0, jumpPercent - 8)
  const jumpPeak = jumpPercent
  const jumpEnd = Math.min(100, jumpPercent + 10)

  const gameHeight = compact ? 'h-20' : 'h-32'
  const tyranSize = compact ? 48 : 64
  const textSize = compact ? 'text-2xl' : 'text-3xl'

  return (
    <div ref={containerRef} className={`relative w-full max-w-sm ${gameHeight} mx-auto overflow-hidden`}>
      {/* 地面 */}
      <div className="absolute bottom-0 left-0 right-0 h-2 bg-gradient-to-r from-green-400 via-green-500 to-green-400 rounded-full" />

      {/* ティラン（左寄り） */}
      <div className="tyran-runner absolute bottom-2 left-12">
        <BabyTyranSVG size={tyranSize} />
      </div>

      {/* MA NAVI テキスト（右から左に流れる） */}
      <div className="text-runner absolute bottom-3">
        <span
          className={`${textSize} font-bold tracking-widest select-none`}
          style={{
            fontFamily: '"Courier New", "Menlo", monospace',
            color: '#1B365D',
            textShadow: '2px 2px 0 #4ECDC4, -1px -1px 0 #3DBDB5',
            letterSpacing: '0.15em',
          }}
        >
          MA NAVI
        </span>
      </div>

      <style>{`
        .text-runner {
          animation: scrollText 3s linear infinite;
        }
        @keyframes scrollText {
          0% { transform: translateX(calc(100vw)); }
          100% { transform: translateX(-200px); }
        }

        .tyran-runner {
          animation: jump 3s ease-in-out infinite;
        }
        @keyframes jump {
          0%, ${jumpStart}% { transform: translateY(0); }
          ${jumpPeak}% { transform: translateY(-40px); }
          ${jumpEnd}% { transform: translateY(0); }
          100% { transform: translateY(0); }
        }

        .tyran-sprite {
          animation: tyranBounce 0.4s ease-in-out infinite alternate;
        }
        @keyframes tyranBounce {
          0% { transform: scaleY(1); }
          100% { transform: scaleY(0.95) scaleX(1.02); }
        }
      `}</style>
    </div>
  )
}

// フルページ版（認証ロード時など）
export function TyranLoader() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-b from-sky-100 via-sky-50 to-green-100 overflow-hidden">
      <TyranGameArea />

      {/* 読み込み中テキスト */}
      <div className="mt-6 flex items-center gap-1 text-sm text-gray-500">
        <span>読み込み中</span>
        <span className="loading-dots">
          <span className="dot dot-1">.</span>
          <span className="dot dot-2">.</span>
          <span className="dot dot-3">.</span>
        </span>
      </div>

      <style>{`
        .loading-dots .dot {
          animation: dotPulse 1.4s infinite;
          opacity: 0;
        }
        .dot-1 { animation-delay: 0s; }
        .dot-2 { animation-delay: 0.2s; }
        .dot-3 { animation-delay: 0.4s; }
        @keyframes dotPulse {
          0%, 80%, 100% { opacity: 0; }
          40% { opacity: 1; }
        }
      `}</style>
    </div>
  )
}

// インライン版（ページ内ローディング時）
export function TyranLoaderInline({ className = '' }: { className?: string }) {
  return (
    <div className={`flex flex-col items-center justify-center py-8 ${className}`}>
      <TyranGameArea compact />
    </div>
  )
}
