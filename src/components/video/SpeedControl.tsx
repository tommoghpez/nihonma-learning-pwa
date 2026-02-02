import { PLAYBACK_SPEEDS } from '@/lib/constants'

interface SpeedControlProps {
  currentSpeed: number
  onSpeedChange: (speed: number) => void
}

export function SpeedControl({ currentSpeed, onSpeedChange }: SpeedControlProps) {
  return (
    <div className="flex items-center gap-1 flex-wrap">
      {PLAYBACK_SPEEDS.map((speed) => (
        <button
          key={speed}
          onClick={() => onSpeedChange(speed)}
          className={`px-3 py-1.5 text-sm rounded-btn transition-colors ${
            currentSpeed === speed
              ? 'bg-navy text-white'
              : 'bg-gray-100 text-text-secondary hover:bg-gray-200'
          }`}
        >
          {speed}x
        </button>
      ))}
    </div>
  )
}
