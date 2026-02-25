// 称号システム — 完了動画数に基づく称号を算出

export interface Title {
  name: string
  color: string       // Tailwind color name (gray, blue, teal, etc.)
  bgClass: string     // バッジ背景色
  textClass: string   // バッジ文字色
  min: number
}

export const TITLES: Title[] = [
  { min: 0,   name: '新入り',             color: 'gray',   bgClass: 'bg-gray-100',    textClass: 'text-gray-600' },
  { min: 5,   name: 'M&A見習い',          color: 'blue',   bgClass: 'bg-blue-100',    textClass: 'text-blue-700' },
  { min: 15,  name: 'アソシエイト',        color: 'teal',   bgClass: 'bg-teal-100',    textClass: 'text-teal-700' },
  { min: 30,  name: 'アドバイザー',        color: 'purple', bgClass: 'bg-purple-100',  textClass: 'text-purple-700' },
  { min: 60,  name: 'シニアアドバイザー',   color: 'orange', bgClass: 'bg-orange-100',  textClass: 'text-orange-700' },
  { min: 100, name: 'エキスパート',        color: 'red',    bgClass: 'bg-red-100',     textClass: 'text-red-700' },
  { min: 150, name: 'マスター',            color: 'amber',  bgClass: 'bg-amber-100',   textClass: 'text-amber-700' },
  { min: 200, name: 'レジェンド',          color: 'gold',   bgClass: 'bg-gradient-to-r from-yellow-100 to-amber-100', textClass: 'text-yellow-700' },
]

export interface TitleInfo {
  current: Title
  next: Title | null
  remaining: number  // 次の称号まであと何本
}

/**
 * 完了動画数から現在の称号を算出
 */
export function getTitle(completedCount: number): TitleInfo {
  let current = TITLES[0]
  let nextIndex = 1

  for (let i = TITLES.length - 1; i >= 0; i--) {
    if (completedCount >= TITLES[i].min) {
      current = TITLES[i]
      nextIndex = i + 1
      break
    }
  }

  const next = nextIndex < TITLES.length ? TITLES[nextIndex] : null
  const remaining = next ? next.min - completedCount : 0

  return { current, next, remaining }
}
