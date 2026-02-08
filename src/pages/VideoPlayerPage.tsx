import { useEffect, useRef, useState, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import ReactPlayer from 'react-player'
import { ChevronDown, ChevronUp, FileText } from 'lucide-react'
import { useVideoStore } from '@/stores/useVideoStore'
import { useWatchProgress } from '@/hooks/useWatchProgress'
import { VideoPlayer } from '@/components/video/VideoPlayer'
import { SpeedControl } from '@/components/video/SpeedControl'
import { ProgressBar } from '@/components/common/ProgressBar'
import { Button } from '@/components/common/Button'
import { Badge } from '@/components/common/Badge'
import { LoadingSpinner } from '@/components/common/LoadingSpinner'

export function VideoPlayerPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { currentVideo, fetchVideoById } = useVideoStore()
  const playerRef = useRef<ReactPlayer | null>(null)
  const [speed, setSpeed] = useState(1.0)
  const [showDescription, setShowDescription] = useState(false)
  const {
    isCompleted,
    lastPosition,
    percentage,
    startTracking,
    stopTracking,
    toggleCompleted,
  } = useWatchProgress(id ?? '', playerRef)

  useEffect(() => {
    if (id) fetchVideoById(id)
  }, [id])

  const handleReady = useCallback(() => {
    if (lastPosition > 0 && playerRef.current) {
      playerRef.current.seekTo(lastPosition, 'seconds')
    }
  }, [lastPosition])

  if (!id) return null
  if (!currentVideo) return <LoadingSpinner className="py-12" />

  return (
    <div className="space-y-4 -mx-4">
      <VideoPlayer
        ref={playerRef}
        videoId={id}
        playbackRate={speed}
        onReady={handleReady}
        onPlay={startTracking}
        onPause={stopTracking}
      />

      <div className="px-4 space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-sm text-text-secondary">再生速度</span>
          <SpeedControl currentSpeed={speed} onSpeedChange={setSpeed} />
        </div>

        <div>
          <h1 className="text-lg font-bold text-text-primary">{currentVideo.title}</h1>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-sm text-text-secondary">
              {currentVideo.published_at
                ? new Date(currentVideo.published_at).toLocaleDateString('ja-JP')
                : ''}
            </span>
            {isCompleted && <Badge variant="success">視聴完了</Badge>}
          </div>
        </div>

        <ProgressBar
          value={percentage}
          label="視聴進捗"
          showPercentage
          color={isCompleted ? 'success' : 'navy'}
        />

        <div className="flex items-center justify-between">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={isCompleted}
              onChange={toggleCompleted}
              className="w-4 h-4 text-navy rounded"
            />
            <span className="text-sm text-text-primary">視聴完了としてマーク</span>
          </label>
        </div>

        <Button
          onClick={() => navigate(`/videos/${id}/note`)}
          variant="secondary"
          className="w-full"
        >
          <FileText className="w-4 h-4 mr-2" />
          ノートを書く
        </Button>

        {currentVideo.description && (
          <div>
            <button
              onClick={() => setShowDescription(!showDescription)}
              className="flex items-center gap-1 text-sm text-text-secondary"
            >
              説明文
              {showDescription ? (
                <ChevronUp className="w-4 h-4" />
              ) : (
                <ChevronDown className="w-4 h-4" />
              )}
            </button>
            {showDescription && (
              <p className="mt-2 text-sm text-text-secondary whitespace-pre-wrap">
                {currentVideo.description}
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
