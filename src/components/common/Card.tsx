import { type ReactNode } from 'react'

interface CardProps {
  children: ReactNode
  className?: string
  onClick?: () => void
  variant?: 'default' | 'elevated' | 'outlined' | 'gradient'
  style?: React.CSSProperties
}

export function Card({ children, className = '', onClick, variant = 'default', style }: CardProps) {
  const baseClasses = 'rounded-card p-4 transition-all duration-200'

  const variantClasses = {
    default: 'bg-bg-secondary shadow-card hover:shadow-card-hover',
    elevated: 'bg-bg-secondary shadow-card-hover',
    outlined: 'bg-bg-secondary border border-border',
    gradient: 'bg-gradient-to-br from-navy-50 to-teal-50 shadow-card',
  }

  return (
    <div
      className={`${baseClasses} ${variantClasses[variant]} ${onClick ? 'cursor-pointer active:scale-[0.98]' : ''} ${className}`}
      onClick={onClick}
      style={style}
    >
      {children}
    </div>
  )
}

// 統計カード用の特別なコンポーネント
interface StatCardProps {
  value: string | number
  label: string
  color?: 'navy' | 'teal' | 'warning' | 'success' | 'coral'
  icon?: ReactNode
}

export function StatCard({ value, label, color = 'navy', icon }: StatCardProps) {
  const colorClasses = {
    navy: 'text-navy bg-navy-50',
    teal: 'text-teal bg-teal-50',
    warning: 'text-warning bg-orange-50',
    success: 'text-success bg-green-50',
    coral: 'text-coral bg-red-50',
  }

  return (
    <Card className={`text-center ${colorClasses[color]} border-none`}>
      {icon && <div className="mb-1">{icon}</div>}
      <div className="text-3xl font-bold">{value}</div>
      <div className="text-xs text-text-secondary mt-1">{label}</div>
    </Card>
  )
}
