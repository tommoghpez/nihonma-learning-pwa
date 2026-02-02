interface ProgressBarProps {
  value: number
  max?: number
  label?: string
  showPercentage?: boolean
  className?: string
  color?: 'navy' | 'teal' | 'success' | 'warning'
}

const colors = {
  navy: 'bg-navy',
  teal: 'bg-teal',
  success: 'bg-success',
  warning: 'bg-warning',
}

export function ProgressBar({
  value,
  max = 100,
  label,
  showPercentage = false,
  className = '',
  color = 'navy',
}: ProgressBarProps) {
  const percentage = Math.min(Math.round((value / max) * 100), 100)

  return (
    <div className={className}>
      {(label || showPercentage) && (
        <div className="flex justify-between items-center mb-1">
          {label && <span className="text-sm text-text-secondary">{label}</span>}
          {showPercentage && (
            <span className="text-sm font-medium text-text-primary">{percentage}%</span>
          )}
        </div>
      )}
      <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-300 ${colors[color]}`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  )
}
