/**
 * Empty State Component
 * Displays when no data is available
 */

import { ReactNode } from 'react'
import { LucideIcon } from 'lucide-react'
import { motion } from 'framer-motion'
import Button from './Button'

interface EmptyStateProps {
    icon: LucideIcon
    title: string
    description: string
    action?: {
        label: string
        onClick: () => void
        icon?: LucideIcon
    }
    children?: ReactNode
    variant?: 'default' | 'compact'
}

export function EmptyState({
    icon: Icon,
    title,
    description,
    action,
    children,
    variant = 'default'
}: EmptyStateProps) {
    const isCompact = variant === 'compact'

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className={`text-center ${isCompact ? 'py-12' : 'py-24'} glass-panel rounded-3xl border-dashed border-2 border-glass-border/50 relative overflow-hidden group`}
        >
            {/* Background Effect */}
            <div className="absolute inset-0 bg-gradient-to-b from-transparent via-indigo-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700" />

            {/* Icon */}
            <motion.div
                className={`${isCompact ? 'w-16 h-16' : 'w-24 h-24'} mx-auto mb-6 rounded-full bg-gradient-to-br from-blue-500/20 to-indigo-500/20 flex items-center justify-center relative`}
                animate={{
                    y: [0, -10, 0],
                }}
                transition={{
                    duration: 3,
                    repeat: Infinity,
                    ease: "easeInOut"
                }}
            >
                <div className="absolute inset-0 bg-blue-500/20 blur-xl rounded-full"></div>
                <Icon className={`${isCompact ? 'w-8 h-8' : 'w-12 h-12'} text-blue-400 relative z-10`} />
            </motion.div>

            {/* Content */}
            <h3 className={`${isCompact ? 'text-xl' : 'text-2xl'} font-bold text-white mb-3`}>
                {title}
            </h3>
            <p className={`text-premium-muted ${isCompact ? 'mb-6' : 'mb-8'} max-w-md mx-auto ${isCompact ? 'text-base' : 'text-lg'}`}>
                {description}
            </p>

            {/* Action or Custom Children */}
            {action && (
                <Button
                    onClick={action.onClick}
                    variant="gradient"
                    size={isCompact ? 'md' : 'lg'}
                    icon={action.icon}
                    className="mx-auto rounded-xl"
                >
                    {action.label}
                </Button>
            )}

            {children}
        </motion.div>
    )
}
