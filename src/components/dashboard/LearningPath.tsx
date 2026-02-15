import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { Map, ChevronRight, CheckCircle2, Lock } from 'lucide-react'
import { useVideoStore } from '@/stores/useVideoStore'
import { useProgressStore } from '@/stores/useProgressStore'
import { generateLearningPaths } from '@/lib/learningPaths'

export function LearningPath() {
  const navigate = useNavigate()
  const videos = useVideoStore((s) => s.videos)
  const progressMap = useProgressStore((s) => s.progressMap)

  const paths = useMemo(
    () => generateLearningPaths(videos, progressMap),
    [videos, progressMap]
  )

  if (paths.length === 0) return null

  return (
    <div>
      <h2 className="text-lg font-bold text-text-primary mb-3 flex items-center gap-2">
        <Map className="w-5 h-5 text-navy" />
        学習パス
      </h2>
      <div className="space-y-2">
        {paths.map((path, index) => {
          const isCompleted = path.percentage === 100
          const isLocked = index > 0 && paths[index - 1].percentage < 50
          // 最初の未完了動画を取得
          const nextVideo = path.videos.find((v) => !progressMap[v.id]?.completed)

          return (
            <div
              key={path.id}
              className={`bg-bg-secondary rounded-card shadow-card p-3 transition-all ${
                isLocked
                  ? 'opacity-50'
                  : 'cursor-pointer hover:shadow-md'
              } ${isCompleted ? 'ring-1 ring-success/30' : ''}`}
              onClick={() => {
                if (!isLocked && nextVideo) {
                  navigate(`/videos/${nextVideo.id}`)
                }
              }}
            >
              <div className="flex items-center gap-3">
                <span className="text-2xl">{path.icon}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className={`text-sm font-bold ${
                      isCompleted ? 'text-success' : 'text-text-primary'
                    }`}>
                      {path.name}
                    </h3>
                    {isCompleted && <CheckCircle2 className="w-4 h-4 text-success" />}
                    {isLocked && <Lock className="w-3.5 h-3.5 text-text-secondary" />}
                  </div>
                  <p className="text-[10px] text-text-secondary mt-0.5">
                    {path.description}
                  </p>
                  <div className="flex items-center gap-2 mt-1.5">
                    <div className="flex-1 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${
                          isCompleted ? 'bg-success' : 'bg-navy'
                        }`}
                        style={{ width: `${path.percentage}%` }}
                      />
                    </div>
                    <span className="text-[10px] text-text-secondary font-medium whitespace-nowrap">
                      {path.completedCount}/{path.totalCount}
                    </span>
                  </div>
                </div>
                {!isLocked && !isCompleted && (
                  <ChevronRight className="w-4 h-4 text-text-secondary flex-shrink-0" />
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
