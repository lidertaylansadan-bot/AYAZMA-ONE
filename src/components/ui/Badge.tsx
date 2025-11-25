import React from 'react'
import { LucideIcon } from 'lucide-react'
import { clsx } from 'clsx'

interface BadgeProps {
    children: React.ReactNode
    variant?: 'default' | 'success' | 'warning' | 'error' | 'info' | 'purple' | 'pink'
    size?: 'sm' | 'md' | 'lg'
    icon?: LucideIcon
    pulse?: boolean
    className?: string
}

export default function Badge({
    children,
    variant = 'default',
    size = 'md',
    icon: Icon,
    pulse = false,
    className
}: BadgeProps) {
    const baseStyles = 'inline-flex items-center font-medium rounded-full border transition-all duration-200'

    const sizeStyles = {
        sm: 'px-2 py-0.5 text-xs',
        md: 'px-3 py-1 text-sm',
        lg: 'px-4 py-1.5 text-base',
    }

    const variantStyles = {
        default: 'bg-gray-500/10 text-gray-300 border-gray-500/20',
        success: 'bg-semantic-success-bg text-semantic-success-light border-semantic-success/20',
        warning: 'bg-semantic-warning-bg text-semantic-warning-light border-semantic-warning/20',
        error: 'bg-semantic-error-bg text-semantic-error-light border-semantic-error/20',
        info: 'bg-semantic-info-bg text-semantic-info-light border-semantic-info/20',
        purple: 'bg-purple-500/10 text-purple-300 border-purple-500/20',
        pink: 'bg-pink-500/10 text-pink-300 border-pink-500/20',
    }

    return (
        <span
            className={clsx(
                baseStyles,
                sizeStyles[size],
                variantStyles[variant],
                pulse && 'animate-pulse',
                className
            )}
        >
            {Icon && <Icon className={clsx('mr-1', size === 'sm' ? 'w-3 h-3' : size === 'lg' ? 'w-5 h-5' : 'w-4 h-4')} />}
            {children}
        </span>
    )
}
