import { forwardRef } from 'react'
import ReactPlayer from 'react-player'

interface VideoPlayerProps {
  videoId: string
  playbackRate: number
  onReady?: () => void
  onPlay?: () => void
  onPause?: () => void
}

export const VideoPlayer = forwardRef<ReactPlayer, VideoPlayerProps>(
  ({ videoId, playbackRate, onReady, onPlay, onPause }, ref) => {
    return (
      <div className="relative aspect-video bg-black rounded-card overflow-hidden">
        <ReactPlayer
          ref={ref}
          url={`https://www.youtube.com/watch?v=${videoId}`}
          width="100%"
          height="100%"
          controls
          playbackRate={playbackRate}
          onReady={onReady}
          onPlay={onPlay}
          onPause={onPause}
          config={{
            youtube: {
              playerVars: {
                modestbranding: 1,
                rel: 0,
              },
            },
          }}
        />
      </div>
    )
  }
)

VideoPlayer.displayName = 'VideoPlayer'
