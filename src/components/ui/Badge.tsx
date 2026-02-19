import type { ReactNode } from 'react'

interface BadgeProps {
    children: ReactNode
    variant?: 'default' | 'primary' | 'accent' | 'success' | 'warning'
    size?: 'sm' | 'md'
    className?: string
}

export function Badge({ children, variant = 'default', size = 'sm', className = '' }: BadgeProps) {
    const variants = {
        default: 'bg-surface-100 text-surface-600',
        primary: 'bg-primary-100 text-primary-700',
        accent: 'bg-accent-100 text-accent-700',
        success: 'bg-green-100 text-green-700',
        warning: 'bg-amber-100 text-amber-700',
    }

    const sizes = {
        sm: 'text-xs px-2.5 py-0.5',
        md: 'text-sm px-3 py-1',
    }

    return (
        <span className={`inline-flex items-center font-medium rounded-full ${variants[variant]} ${sizes[size]} ${className}`}>
            {children}
        </span>
    )
}
