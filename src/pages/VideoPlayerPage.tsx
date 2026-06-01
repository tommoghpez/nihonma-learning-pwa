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
  const [playerReady, setPlayerReady] = useState(false)
  const [playerError, setPlayerError] = useState(false)
  const [reloadKey, setReloadKey] = useState(0)
  const hasSeekedRef = useRef(false)
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

  // 動画が切り替わったら seek 状態・エラーをリセット
  useEffect(() => {
    hasSeekedRef.current = false
    setPlayerReady(false)
    setPlayerError(false)
  }, [id])

  // 再生エラー時の手動リカバリ。プレイヤーを作り直し（key更新）、続きから再生し直せるようにする。
  // 「ミスタップ後に枠だけ表示・二度と再生できない」状態からの復帰手段。
  const handleReload = useCallback(() => {
    setPlayerError(false)
    setPlayerReady(false)
    hasSeekedRef.current = false
    setReloadKey((k) => k + 1)
  }, [])

  // プレイヤー準備完了「かつ」進捗読込済みになった時点で続きから再生位置へシーク。
  // onReady と進捗取得は非同期で順序が不定なため、両方揃ってから一度だけ実行する。
  useEffect(() => {
    if (playerReady && !hasSeekedRef.current && lastPosition > 0 && playerRef.current) {
      playerRef.current.seekTo(lastPosition, 'seconds')
      hasSeekedRef.current = true
    }
  }, [playerReady, lastPosition])

  useEffect(() => {
    const handler = () => setIsFullscreen(!!document.fullscreenElement)
    document.addEventListener('fullscreenchange', handler)
    return () => document.removeEventListener('fullscreenchange', handler)
  }, [])

  const handleReady = useCallback(() => {
    setPlayerReady(true)
  }, [])

  const handlePlay = useCallback(() => {
    startTracking()
    setHasPlayed(true)
  }, [startTracking])

  const handleError = useCallback(() => {
    setPlayerError(true)
  }, [])

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
        key={reloadKey}
        ref={playerRef}
        videoId={id}
        playbackRate={speed}
        onReady={handleReady}
        onPlay={handlePlay}
        onPause={stopTracking}
        onError={handleError}
      />

      {playerError && (
        <div className="px-4">
          <div className="flex items-center justify-between gap-3 rounded-card bg-red-50 border border-red-200 px-3 py-2">
            <p className="text-sm text-red-700">動画の再生に問題が発生しました。</p>
            <Button variant="ghost" size="sm" onClick={handleReload}>
              再読み込み
            </Button>
          </div>
        </div>
      )}

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
