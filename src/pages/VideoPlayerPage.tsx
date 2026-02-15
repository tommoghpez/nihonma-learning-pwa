import { useEffect, useRef, useState, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import ReactPlayer from 'react-player'
import { ChevronDown, ChevronUp, ArrowLeft } from 'lucide-react'
import { useVideoStore } from '@/stores/useVideoStore'
import { useWatchProgress } from '@/hooks/useWatchProgress'
import { VideoPlayer } from '@/components/video/VideoPlayer'
import { SpeedControl } from '@/components/video/SpeedControl'
import { ProgressBar } from '@/components/common/ProgressBar'
import { Button } from '@/components/common/Button'
import { Badge } from '@/components/common/Badge'
import { LoadingSpinner } from '@/components/common/LoadingSpinner'
import { SummaryEditor } from '@/components/summary/SummaryEditor'

export function VideoPlayerPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { currentVideo, currentVideoLoading, currentVideoError, fetchVideoById } = useVideoStore()
  const playerRef = useRef<ReactPlayer | null>(null)
  const [speed, setSpeed] = useState(1.0)
  const [showDescription, setShowDescription] = useState(false)
  const [hasPlayed, setHasPlayed] = useState(false)
  const [isFullscreen, setIsFullscreen] = useState(false)
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

  useEffect(() => {
    const handler = () => setIsFullscreen(!!document.fullscreenElement)
    document.addEventListener('fullscreenchange', handler)
    return () => document.removeEventListener('fullscreenchange', handler)
  }, [])

  const handleReady = useCallback(() => {
    if (lastPosition > 0 && playerRef.current) {
      playerRef.current.seekTo(lastPosition, 'seconds')
    }
  }, [lastPosition])

  const handlePlay = useCallback(() => {
    startTracking()
    setHasPlayed(true)
  }, [startTracking])

  if (!id) return null

  if (currentVideoLoading) {
    return <LoadingSpinner className="py-12" />
  }

  if (currentVideoError || !currentVideo) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <p className="text-text-secondary mb-3">
          {currentVideoError || '動画が見つかりませんでした'}
        </p>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate(-1)}
        >
          <ArrowLeft className="w-4 h-4 mr-1" />
          戻る
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-4 -mx-4">
      <VideoPlayer
        ref={playerRef}
        videoId={id}
        playbackRate={speed}
        onReady={handleReady}
        onPlay={handlePlay}
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

        {hasPlayed && !isFullscreen && (
          <SummaryEditor videoId={id} />
        )}

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
