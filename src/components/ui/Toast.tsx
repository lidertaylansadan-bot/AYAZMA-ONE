/**
 * Toast Notification Component
 * Provides visual feedback for user actions
 */

import { useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, CheckCircle2, AlertCircle, Info, AlertTriangle } from 'lucide-react'

export type ToastVariant = 'success' | 'error' | 'warning' | 'info'

export interface ToastProps {
    id: string
    message: string
    variant?: ToastVariant
    duration?: number
    onClose: (id: string) => void
    action?: {
        label: string
        onClick: () => void
    }
}

const variantStyles = {
    success: {
        bg: 'bg-emerald-500/10 border-emerald-500/20',
        icon: CheckCircle2,
        iconColor: 'text-emerald-400',
        progressBg: 'bg-emerald-500'
    },
    error: {
        bg: 'bg-red-500/10 border-red-500/20',
        icon: AlertCircle,
        iconColor: 'text-red-400',
        progressBg: 'bg-red-500'
    },
    warning: {
        bg: 'bg-amber-500/10 border-amber-500/20',
        icon: AlertTriangle,
        iconColor: 'text-amber-400',
        progressBg: 'bg-amber-500'
    },
    info: {
        bg: 'bg-blue-500/10 border-blue-500/20',
        icon: Info,
        iconColor: 'text-blue-400',
        progressBg: 'bg-blue-500'
    }
}

export function Toast({
    id,
    message,
    variant = 'info',
    duration = 5000,
    onClose,
    action
}: ToastProps) {
    const style = variantStyles[variant]
    const Icon = style.icon

    useEffect(() => {
        if (duration > 0) {
            const timer = setTimeout(() => onClose(id), duration)
            return () => clearTimeout(timer)
        }
    }, [id, duration, onClose])

    return (
        <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, x: 100, scale: 0.95 }}
            className={`${style.bg} backdrop-blur-xl border rounded-xl p-4 shadow-lg min-w-[320px] max-w-md`}
        >
            <div className="flex items-start gap-3">
                <Icon className={`w-5 h-5 ${style.iconColor} flex-shrink-0 mt-0.5`} />

                <div className="flex-1 min-w-0">
                    <p className="text-sm text-white font-medium leading-relaxed">
                        {message}
                    </p>

                    {action && (
                        <button
                            onClick={action.onClick}
                            className="mt-2 text-xs font-semibold text-blue-400 hover:text-blue-300 transition-colors"
                        >
                            {action.label}
                        </button>
                    )}
                </div>

                <button
                    onClick={() => onClose(id)}
                    className="text-gray-400 hover:text-white transition-colors flex-shrink-0"
                    aria-label="Close notification"
                >
                    <X className="w-4 h-4" />
                </button>
            </div>

            {duration > 0 && (
                <motion.div
                    className={`h-1 ${style.progressBg} rounded-full mt-3`}
                    initial={{ width: '100%' }}
                    animate={{ width: '0%' }}
                    transition={{ duration: duration / 1000, ease: 'linear' }}
                />
            )}
        </motion.div>
    )
}
