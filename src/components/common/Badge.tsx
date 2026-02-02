import { type ReactNode } from 'react'

interface BadgeProps {
  variant?: 'success' | 'warning' | 'default' | 'navy'
  children: ReactNode
  className?: string
}

const variants = {
  success: 'bg-success/10 text-success',
  warning: 'bg-warning/10 text-warning',
  default: 'bg-gray-100 text-text-secondary',
  navy: 'bg-navy/10 text-navy',
}

export function Badge({ variant = 'default', children, className = '' }: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${variants[variant]} ${className}`}
    >
      {children}
    </span>
  )
}
