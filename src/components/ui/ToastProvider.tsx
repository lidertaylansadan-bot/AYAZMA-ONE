/**
 * Toast Provider
 * Global toast notification manager
 */

import { createContext, useContext, useState, useCallback, ReactNode } from 'react'
import { AnimatePresence } from 'framer-motion'
import { Toast, ToastProps, ToastVariant } from './Toast'

interface ToastContextType {
    showToast: (message: string, variant?: ToastVariant, action?: ToastProps['action']) => void
    success: (message: string, action?: ToastProps['action']) => void
    error: (message: string, action?: ToastProps['action']) => void
    warning: (message: string, action?: ToastProps['action']) => void
    info: (message: string, action?: ToastProps['action']) => void
}

const ToastContext = createContext<ToastContextType | undefined>(undefined)

interface ToastItem extends Omit<ToastProps, 'onClose'> {
    id: string
}

export function ToastProvider({ children }: { children: ReactNode }) {
    const [toasts, setToasts] = useState<ToastItem[]>([])

    const removeToast = useCallback((id: string) => {
        setToasts(prev => prev.filter(toast => toast.id !== id))
    }, [])

    const showToast = useCallback((
        message: string,
        variant: ToastVariant = 'info',
        action?: ToastProps['action']
    ) => {
        const id = Math.random().toString(36).substr(2, 9)
        setToasts(prev => [...prev, { id, message, variant, action }])
    }, [])

    const success = useCallback((message: string, action?: ToastProps['action']) => {
        showToast(message, 'success', action)
    }, [showToast])

    const error = useCallback((message: string, action?: ToastProps['action']) => {
        showToast(message, 'error', action)
    }, [showToast])

    const warning = useCallback((message: string, action?: ToastProps['action']) => {
        showToast(message, 'warning', action)
    }, [showToast])

    const info = useCallback((message: string, action?: ToastProps['action']) => {
        showToast(message, 'info', action)
    }, [showToast])

    return (
        <ToastContext.Provider value={{ showToast, success, error, warning, info }}>
            {children}

            {/* Toast Container */}
            <div className="fixed top-4 right-4 z-50 flex flex-col gap-2 pointer-events-none">
                <AnimatePresence>
                    {toasts.map(toast => (
                        <div key={toast.id} className="pointer-events-auto">
                            <Toast {...toast} onClose={removeToast} />
                        </div>
                    ))}
                </AnimatePresence>
            </div>
        </ToastContext.Provider>
    )
}

export function useToast() {
    const context = useContext(ToastContext)
    if (!context) {
        throw new Error('useToast must be used within ToastProvider')
    }
    return context
}
