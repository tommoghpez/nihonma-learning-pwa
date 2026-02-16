import { useMemo, useEffect, useRef, useState, useCallback } from 'react'

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

const CYCLE_MS = 2000    // 2秒サイクル（速くした）
const TEXT_WIDTH = 140   // "MA NAVI"の推定ピクセル幅
const TYRAN_LEFT = 48    // left-12 = 48px

// 共通のゲームエリア（フルページ版・インライン版共通）
// JSベースのアニメーションで正確にジャンプタイミングを同期
function TyranGameArea({ compact = false }: { compact?: boolean }) {
  const containerRef = useRef<HTMLDivElement>(null)
  const animRef = useRef<number>(0)
  const startTimeRef = useRef<number>(0)
  const [textX, setTextX] = useState(400)
  const [jumpY, setJumpY] = useState(0)

  const gameHeight = compact ? 'h-20' : 'h-32'
  const tyranSize = compact ? 48 : 64
  const textSize = compact ? 'text-2xl' : 'text-3xl'

  const animate = useCallback((timestamp: number) => {
    if (!startTimeRef.current) startTimeRef.current = timestamp
    const elapsed = (timestamp - startTimeRef.current) % CYCLE_MS
    const progress = elapsed / CYCLE_MS  // 0 → 1

    const containerWidth = containerRef.current?.offsetWidth ?? 384

    // テキスト位置: コンテナ右端 → コンテナ左端の外（-TEXT_WIDTH）
    const totalDistance = containerWidth + TEXT_WIDTH
    const currentTextX = containerWidth - progress * totalDistance
    setTextX(currentTextX)

    // テキスト先端がティラン位置に到達するタイミングを計算
    // テキスト先端(currentTextX)がTYRAN_LEFT + tyranSizeの位置を通過する時にジャンプ
    const arrivalProgress = (containerWidth - TYRAN_LEFT - tyranSize) / totalDistance

    // ジャンプ: 到達前後の区間でジャンプ
    const jumpWindow = 0.12  // ジャンプにかける時間割合
    const jumpStart = arrivalProgress - jumpWindow / 2
    const jumpEnd = arrivalProgress + jumpWindow / 2

    if (progress >= jumpStart && progress <= jumpEnd) {
      const jumpProgress = (progress - jumpStart) / (jumpEnd - jumpStart)
      // sin曲線でなめらかなジャンプ
      setJumpY(Math.sin(jumpProgress * Math.PI) * 40)
    } else {
      setJumpY(0)
    }

    animRef.current = requestAnimationFrame(animate)
  }, [tyranSize])

  useEffect(() => {
    animRef.current = requestAnimationFrame(animate)
    return () => cancelAnimationFrame(animRef.current)
  }, [animate])

  return (
    <div ref={containerRef} className={`relative w-full max-w-sm ${gameHeight} mx-auto overflow-hidden`}>
      {/* 地面 */}
      <div className="absolute bottom-0 left-0 right-0 h-2 bg-gradient-to-r from-green-400 via-green-500 to-green-400 rounded-full" />

      {/* ティラン（左寄り） */}
      <div
        className="absolute bottom-2 left-12"
        style={{ transform: `translateY(-${jumpY}px)` }}
      >
        <BabyTyranSVG size={tyranSize} />
      </div>

      {/* MA NAVI テキスト（JS制御で右から左に流れる） */}
      <div
        className="absolute bottom-3"
        style={{ transform: `translateX(${textX}px)` }}
      >
        <span
          className={`${textSize} font-bold tracking-widest select-none whitespace-nowrap`}
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
