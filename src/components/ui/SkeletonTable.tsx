/**
 * Skeleton Table Component
 * Loading placeholder for table content
 */

import { motion } from 'framer-motion'

interface SkeletonTableProps {
    rows?: number
    columns?: number
}

export function SkeletonTable({ rows = 5, columns = 4 }: SkeletonTableProps) {
    return (
        <div className="glass-panel rounded-2xl overflow-hidden">
            {/* Table Header */}
            <div className="grid gap-4 p-6 border-b border-white/5" style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}>
                {Array.from({ length: columns }).map((_, i) => (
                    <div key={`header-${i}`} className="h-4 bg-white/10 rounded animate-pulse" />
                ))}
            </div>

            {/* Table Rows */}
            <div className="divide-y divide-white/5">
                {Array.from({ length: rows }).map((_, rowIndex) => (
                    <motion.div
                        key={rowIndex}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: rowIndex * 0.05 }}
                        className="grid gap-4 p-6"
                        style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}
                    >
                        {Array.from({ length: columns }).map((_, colIndex) => (
                            <div
                                key={`cell-${rowIndex}-${colIndex}`}
                                className="h-4 bg-white/5 rounded animate-pulse"
                                style={{ animationDelay: `${(rowIndex * columns + colIndex) * 50}ms` }}
                            />
                        ))}
                    </motion.div>
                ))}
            </div>
        </div>
    )
}
