import { TyranLoaderInline } from './TyranLoader'

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

export function LoadingSpinner({ className = '' }: LoadingSpinnerProps) {
  return <TyranLoaderInline className={className} />
}

export { TyranLoader as FullPageSpinner } from './TyranLoader'
