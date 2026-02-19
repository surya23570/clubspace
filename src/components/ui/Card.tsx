import type { ReactNode, HTMLAttributes } from 'react'

interface CardProps extends HTMLAttributes<HTMLDivElement> {
    children: ReactNode
    hover?: boolean
    padding?: 'none' | 'sm' | 'md' | 'lg'
    variant?: 'default' | 'inset'
    className?: string
}

const paddings = {
    none: '',
    sm: 'p-4',
    md: 'p-5',
    lg: 'p-6',
}

export function Card({
    children,
    hover = false,
    padding = 'md',
    variant = 'default',
    className = '',
    ...props
}: CardProps) {
    return (
        <div
            className={`
        ${variant === 'inset' ? 'clay-inset' : 'clay'}
        ${hover ? 'hover:shadow-clay-hover hover:-translate-y-1 cursor-pointer' : ''}
        ${paddings[padding]}
        transition-all duration-300 ease-out
        ${className}
      `}
            {...props}
        >
            {children}
        </div>
    )
}
