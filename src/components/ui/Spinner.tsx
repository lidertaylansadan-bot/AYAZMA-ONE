import { clsx } from 'clsx'

interface SpinnerProps {
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

export default function Spinner({ size = 'md', className }: SpinnerProps) {
  const sizeClasses = {
    sm: 'h-4 w-4 border-2',
    md: 'h-8 w-8 border-b-2',
    lg: 'h-12 w-12 border-4',
  }

  return (
    <div className={clsx("flex items-center justify-center", className)}>
      <div className={clsx("animate-spin rounded-full border-blue-600 border-t-transparent", sizeClasses[size])} />
    </div>
  )
}