import { Link } from 'react-router-dom'

export function Logo({ className = '' }: { className?: string }) {
  return (
    <Link to="/" className={`flex items-center gap-2 ${className}`}>
      <svg
        width="32"
        height="32"
        viewBox="0 0 48 48"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="flex-shrink-0"
      >
        {/* 本のベース */}
        <rect x="6" y="8" width="36" height="32" rx="2" fill="#4ECDC4" />

        {/* 本の背表紙 */}
        <rect x="6" y="8" width="8" height="32" fill="#3DBDB5" />

        {/* 本のページ */}
        <rect x="14" y="12" width="24" height="24" rx="1" fill="#FFFFFF" />

        {/* ページの線 */}
        <line x1="18" y1="18" x2="34" y2="18" stroke="#E0E0E0" strokeWidth="1.5" />
        <line x1="18" y1="24" x2="34" y2="24" stroke="#E0E0E0" strokeWidth="1.5" />
        <line x1="18" y1="30" x2="28" y2="30" stroke="#E0E0E0" strokeWidth="1.5" />

        {/* M&Aのシンボル（矢印で表現） */}
        <path
          d="M22 20 L26 16 L30 20"
          stroke="#1B365D"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />
        <line x1="26" y1="16" x2="26" y2="28" stroke="#1B365D" strokeWidth="2" strokeLinecap="round" />

        {/* しおり */}
        <path d="M38 8 L38 18 L34 14 L30 18 L30 8" fill="#FF6B6B" />
      </svg>

      <div className="flex flex-col leading-none">
        <span className="text-lg font-bold tracking-tight text-white">
          MA NAVI
        </span>
        <span className="text-[9px] text-teal-200 tracking-wider">
          まなび
        </span>
      </div>
    </Link>
  )
}

// 白背景用のロゴ
export function LogoDark({ className = '' }: { className?: string }) {
  return (
    <Link to="/" className={`flex items-center gap-2 ${className}`}>
      <svg
        width="32"
        height="32"
        viewBox="0 0 48 48"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="flex-shrink-0"
      >
        {/* 本のベース */}
        <rect x="6" y="8" width="36" height="32" rx="2" fill="#1B365D" />

        {/* 本の背表紙 */}
        <rect x="6" y="8" width="8" height="32" fill="#152a4a" />

        {/* 本のページ */}
        <rect x="14" y="12" width="24" height="24" rx="1" fill="#FFFFFF" />

        {/* ページの線 */}
        <line x1="18" y1="18" x2="34" y2="18" stroke="#E0E0E0" strokeWidth="1.5" />
        <line x1="18" y1="24" x2="34" y2="24" stroke="#E0E0E0" strokeWidth="1.5" />
        <line x1="18" y1="30" x2="28" y2="30" stroke="#E0E0E0" strokeWidth="1.5" />

        {/* M&Aのシンボル（矢印で表現） */}
        <path
          d="M22 20 L26 16 L30 20"
          stroke="#4ECDC4"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />
        <line x1="26" y1="16" x2="26" y2="28" stroke="#4ECDC4" strokeWidth="2" strokeLinecap="round" />

        {/* しおり */}
        <path d="M38 8 L38 18 L34 14 L30 18 L30 8" fill="#FF6B6B" />
      </svg>

      <div className="flex flex-col leading-none">
        <span className="text-lg font-bold tracking-tight text-navy">
          MA NAVI
        </span>
        <span className="text-[9px] text-teal tracking-wider">
          まなび
        </span>
      </div>
    </Link>
  )
}
