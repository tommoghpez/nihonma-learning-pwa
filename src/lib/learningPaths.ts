// 学習パス定義
// DB不要 — 動画をpublished_at順にソートして自動的にパスに区分

import type { Video, WatchProgress } from '@/types'

export interface LearningPath {
  id: string
  name: string
  icon: string
  description: string
  videos: Video[]
  completedCount: number
  totalCount: number
  percentage: number
}

const PATH_SIZE = 10 // 1パスあたりの動画数

const PATH_NAMES = [
  { name: '基礎コース', icon: '📗', description: 'まずはここから！基礎を固めよう' },
  { name: '実践コース', icon: '📘', description: '基礎を活かして実践力を身につけよう' },
  { name: '応用コース', icon: '📙', description: 'さらに深く学んでレベルアップ' },
  { name: 'マスターコース', icon: '📕', description: '上級者への道を歩もう' },
  { name: 'エキスパートコース', icon: '🏆', description: '全てを極めた者の道' },
]

export function generateLearningPaths(
  videos: Video[],
  progressMap: Record<string, WatchProgress>
): LearningPath[] {
  // published_at昇順（古い順）にソート
  const sorted = [...videos].sort((a, b) => {
    const aDate = a.published_at ?? ''
    const bDate = b.published_at ?? ''
    return aDate.localeCompare(bDate)
  })

  const paths: LearningPath[] = []

  for (let i = 0; i < sorted.length; i += PATH_SIZE) {
    const pathIndex = Math.floor(i / PATH_SIZE)
    const pathVideos = sorted.slice(i, i + PATH_SIZE)
    const pathInfo = PATH_NAMES[pathIndex] ?? {
      name: `コース ${pathIndex + 1}`,
      icon: '📚',
      description: '学習を続けよう',
    }

    const completedCount = pathVideos.filter(
      (v) => progressMap[v.id]?.completed
    ).length

    paths.push({
      id: `path-${pathIndex}`,
      name: pathInfo.name,
      icon: pathInfo.icon,
      description: pathInfo.description,
      videos: pathVideos,
      completedCount,
      totalCount: pathVideos.length,
      percentage: pathVideos.length > 0
        ? Math.round((completedCount / pathVideos.length) * 100)
        : 0,
    })
  }

  return paths
}
