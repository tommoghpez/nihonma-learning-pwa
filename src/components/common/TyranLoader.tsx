import { useMemo } from 'react'

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

function BabyTyranSVG() {
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
      width="64"
      height="64"
      viewBox="0 0 24 14"
      xmlns="http://www.w3.org/2000/svg"
      className="tyran-sprite"
      dangerouslySetInnerHTML={{ __html: rects }}
    />
  )
}

export function TyranLoader() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-b from-sky-100 via-sky-50 to-green-100 overflow-hidden">
      {/* ゲームエリア */}
      <div className="relative w-full max-w-sm h-32 mx-auto">
        {/* 地面 */}
        <div className="absolute bottom-0 left-0 right-0 h-2 bg-gradient-to-r from-green-400 via-green-500 to-green-400 rounded-full" />

        {/* ティラン（左寄り） */}
        <div className="tyran-runner absolute bottom-2 left-12">
          <BabyTyranSVG />
        </div>

        {/* MA NAVI テキスト（右から左に流れる） */}
        <div className="text-runner absolute bottom-3">
          <span
            className="text-3xl font-bold tracking-widest select-none"
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
        /* テキストが右→左に流れるアニメーション（3秒サイクル） */
        .text-runner {
          animation: scrollText 3s linear infinite;
        }
        @keyframes scrollText {
          0% { transform: translateX(calc(100vw)); }
          100% { transform: translateX(-200px); }
        }

        /* ティランのジャンプ（テキスト到達タイミングに合わせて）
           テキストは3秒で画面幅+200px移動
           ティランは左12(48px)にいる
           テキストがティラン位置に到達するタイミングでジャンプ */
        .tyran-runner {
          animation: jump 3s ease-in-out infinite;
        }
        @keyframes jump {
          0%, 30% { transform: translateY(0); }
          40% { transform: translateY(-40px); }
          55% { transform: translateY(0); }
          100% { transform: translateY(0); }
        }

        /* ティランスプライトの軽いバウンス */
        .tyran-sprite {
          animation: bounce 0.4s ease-in-out infinite alternate;
        }
        @keyframes bounce {
          0% { transform: scaleY(1); }
          100% { transform: scaleY(0.95) scaleX(1.02); }
        }

        /* ドットアニメーション */
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
