/**
 * Skeleton Card Component
 * Loading placeholder for card content
 */

import { motion } from 'framer-motion'

interface SkeletonCardProps {
    count?: number
    variant?: 'default' | 'compact' | 'detailed'
}

export function SkeletonCard({ count = 1, variant = 'default' }: SkeletonCardProps) {
    return (
        <>
            {Array.from({ length: count }).map((_, index) => (
                <motion.div
                    key={index}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: index * 0.1 }}
                    className="glass-panel rounded-2xl p-6 space-y-4"
                >
                    {/* Header */}
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="w-12 h-12 rounded-xl bg-white/5 animate-pulse" />
                            <div className="space-y-2">
                                <div className="h-4 w-32 bg-white/5 rounded animate-pulse" />
                                {variant === 'detailed' && (
                                    <div className="h-3 w-24 bg-white/5 rounded animate-pulse" />
                                )}
                            </div>
                        </div>
                        <div className="h-6 w-20 bg-white/5 rounded-full animate-pulse" />
                    </div>

                    {/* Content */}
                    {variant !== 'compact' && (
                        <div className="space-y-2">
                            <div className="h-3 w-full bg-white/5 rounded animate-pulse" />
                            <div className="h-3 w-3/4 bg-white/5 rounded animate-pulse" />
                        </div>
                    )}

                    {/* Footer */}
                    <div className="flex items-center justify-between pt-4 border-t border-white/5">
                        <div className="h-4 w-24 bg-white/5 rounded animate-pulse" />
                        <div className="h-4 w-16 bg-white/5 rounded animate-pulse" />
                    </div>

                    {variant === 'detailed' && (
                        <div className="flex gap-2">
                            <div className="h-9 flex-1 bg-white/5 rounded-lg animate-pulse" />
                            <div className="h-9 flex-1 bg-white/5 rounded-lg animate-pulse" />
                        </div>
                    )}
                </motion.div>
            ))}
        </>
    )
}
