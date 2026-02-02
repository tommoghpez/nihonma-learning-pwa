import { type InputHTMLAttributes } from 'react'

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
}

export function Input({ label, error, className = '', ...props }: InputProps) {
  return (
    <div className="w-full">
      {label && (
        <label className="block text-sm font-medium text-text-primary mb-1">
          {label}
        </label>
      )}
      <input
        className={`
          w-full px-3 py-2 rounded-btn border border-border
          text-text-primary bg-bg-secondary
          focus:outline-none focus:ring-2 focus:ring-navy/50 focus:border-navy
          placeholder:text-text-secondary
          ${error ? 'border-error' : ''}
          ${className}
        `}
        {...props}
      />
      {error && <p className="mt-1 text-sm text-error">{error}</p>}
    </div>
  )
}
