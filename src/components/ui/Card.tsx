import { motion } from 'framer-motion'
import { ReactNode } from 'react'
import { clsx } from 'clsx'

type Props = {
  children: ReactNode
  className?: string
  hover?: boolean
  variant?: 'default' | 'elevated' | 'interactive' | 'gradient-border'
  loading?: boolean
  header?: ReactNode
  footer?: ReactNode
}

export default function Card({
  children,
  className = '',
  hover = true,
  variant = 'default',
  loading = false,
  header,
  footer
}: Props) {
  const variantStyles = {
    default: 'glass-panel',
    elevated: 'glass-panel shadow-premium',
    interactive: 'premium-card-hover cursor-pointer',
    'gradient-border': 'gradient-border glass-panel',
  }

  if (loading) {
    return (
      <div className={clsx('glass-panel rounded-2xl p-6 shimmer-effect', className)}>
        <div className="space-y-4">
          <div className="h-4 bg-white/5 rounded w-3/4 animate-pulse" />
          <div className="h-4 bg-white/5 rounded w-1/2 animate-pulse" />
          <div className="h-20 bg-white/5 rounded animate-pulse" />
        </div>
      </div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      whileHover={hover ? { scale: 1.02, y: -5 } : {}}
      className={clsx(
        variantStyles[variant],
        'rounded-2xl p-6 relative overflow-hidden group',
        className
      )}
    >
      <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
      <div className="relative z-10">
        {header && (
          <div className="mb-4 pb-4 border-b border-white/5">
            {header}
          </div>
        )}
        {children}
        {footer && (
          <div className="mt-4 pt-4 border-t border-white/5">
            {footer}
          </div>
        )}
      </div>
    </motion.div>
  )
}