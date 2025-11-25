import React from 'react'
import { clsx } from 'clsx'

interface SkeletonProps {
    variant?: 'text' | 'circle' | 'rectangle'
    width?: string | number
    height?: string | number
    className?: string
    count?: number
}

export default function Skeleton({
    variant = 'text',
    width,
    height,
    className,
    count = 1
}: SkeletonProps) {
    const baseStyles = 'shimmer-effect bg-white/5 animate-pulse'

    const variantStyles = {
        text: 'h-4 rounded',
        circle: 'rounded-full',
        rectangle: 'rounded-lg',
    }

    const style: React.CSSProperties = {}
    if (width) style.width = typeof width === 'number' ? `${width}px` : width
    if (height) style.height = typeof height === 'number' ? `${height}px` : height

    // Default heights for variants if not specified
    if (!height) {
        if (variant === 'text') style.height = '1rem'
        if (variant === 'circle') {
            style.width = width || '3rem'
            style.height = width || '3rem'
        }
        if (variant === 'rectangle') style.height = '8rem'
    }

    const skeletonElement = (
        <div
            className={clsx(baseStyles, variantStyles[variant], className)}
            style={style}
        />
    )

    if (count === 1) {
        return skeletonElement
    }

    return (
        <div className="space-y-2">
            {Array.from({ length: count }).map((_, index) => (
                <div key={index}>{skeletonElement}</div>
            ))}
        </div>
    )
}
