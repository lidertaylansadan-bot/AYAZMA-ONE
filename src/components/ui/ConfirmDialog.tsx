/**
 * Confirmation Dialog Component
 * Modal for confirming destructive actions
 */

import { ReactNode } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { AlertTriangle, X } from 'lucide-react'
import Button from './Button'

interface ConfirmDialogProps {
    isOpen: boolean
    onClose: () => void
    onConfirm: () => void | Promise<void>
    title: string
    description: string
    confirmLabel?: string
    cancelLabel?: string
    variant?: 'danger' | 'warning' | 'info'
    loading?: boolean
    children?: ReactNode
}

const variantStyles = {
    danger: {
        bg: 'from-red-500/20 to-pink-500/20',
        border: 'border-red-500/30',
        iconColor: 'text-red-400',
        confirmVariant: 'error' as const
    },
    warning: {
        bg: 'from-amber-500/20 to-orange-500/20',
        border: 'border-amber-500/30',
        iconColor: 'text-amber-400',
        confirmVariant: 'warning' as const
    },
    info: {
        bg: 'from-blue-500/20 to-indigo-500/20',
        border: 'border-blue-500/30',
        iconColor: 'text-blue-400',
        confirmVariant: 'primary' as const
    }
}

export function ConfirmDialog({
    isOpen,
    onClose,
    onConfirm,
    title,
    description,
    confirmLabel = 'Confirm',
    cancelLabel = 'Cancel',
    variant = 'danger',
    loading = false,
    children
}: ConfirmDialogProps) {
    const style = variantStyles[variant]

    const handleConfirm = async () => {
        await onConfirm()
        onClose()
    }

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="absolute inset-0 bg-black/80 backdrop-blur-md"
                    />

                    {/* Dialog */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 20 }}
                        className="relative glass-panel rounded-2xl p-6 w-full max-w-md shadow-2xl border border-white/10"
                    >
                        {/* Close Button */}
                        <button
                            onClick={onClose}
                            className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors"
                            aria-label="Close dialog"
                        >
                            <X className="w-5 h-5" />
                        </button>

                        {/* Icon */}
                        <div className={`w-12 h-12 rounded-full bg-gradient-to-br ${style.bg} border ${style.border} flex items-center justify-center mb-4`}>
                            <AlertTriangle className={`w-6 h-6 ${style.iconColor}`} />
                        </div>

                        {/* Content */}
                        <h3 className="text-xl font-bold text-white mb-2">
                            {title}
                        </h3>
                        <p className="text-premium-muted mb-6 leading-relaxed">
                            {description}
                        </p>

                        {children}

                        {/* Actions */}
                        <div className="flex gap-3">
                            <Button
                                variant="ghost"
                                onClick={onClose}
                                disabled={loading}
                                className="flex-1"
                            >
                                {cancelLabel}
                            </Button>
                            <Button
                                variant={style.confirmVariant}
                                onClick={handleConfirm}
                                loading={loading}
                                className="flex-1"
                            >
                                {confirmLabel}
                            </Button>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    )
}
