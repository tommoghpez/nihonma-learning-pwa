import { Link } from 'react-router-dom'

// ベビーティランのピクセルアートSVG（静的・ハッピー状態）
function BabyTyranIcon({ size = 32, className = '' }: { size?: number; className?: string }) {
  // baby stage pixels (happy mood, frame 0) - simplified for icon use
  const pixels = [
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

  const colors: Record<string, string> = {
    D: '#1B5E20', G: '#2E7D32', g: '#4CAF50', L: '#81C784',
    C: '#FFF9C4', c: '#FFF59D', E: '#212121', W: '#FFFFFF',
    P: '#FF8A80', M: '#D32F2F', T: '#5D4037', t: '#795548',
  }

  const rects: string[] = []
  pixels.forEach((row, y) => {
    for (let x = 0; x < row.length; x++) {
      const ch = row[x]
      if (ch !== ' ' && colors[ch]) {
        rects.push(`<rect x="${x}" y="${y}" width="1" height="1" fill="${colors[ch]}"/>`)
      }
    }
  })

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 14"
      xmlns="http://www.w3.org/2000/svg"
      className={`flex-shrink-0 ${className}`}
      dangerouslySetInnerHTML={{ __html: rects.join('') }}
    />
  )
}

export function Logo({ className = '' }: { className?: string }) {
  return (
    <Link to="/" className={`flex items-center gap-2 ${className}`}>
      <BabyTyranIcon size={32} />
      <span className="text-lg font-bold tracking-tight text-white">
        MA NAVI
      </span>
    </Link>
  )
}

// 白背景用のロゴ
export function LogoDark({ className = '' }: { className?: string }) {
  return (
    <Link to="/" className={`flex items-center gap-2 ${className}`}>
      <BabyTyranIcon size={32} />
      <span className="text-lg font-bold tracking-tight text-navy">
        MA NAVI
      </span>
    </Link>
  )
}
