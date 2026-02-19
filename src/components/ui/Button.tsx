import type { ReactNode, ButtonHTMLAttributes } from 'react'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: 'primary' | 'secondary' | 'ghost' | 'danger' | 'dark'
    size?: 'sm' | 'md' | 'lg'
    loading?: boolean
    icon?: ReactNode
    children?: ReactNode
    className?: string
}

export function Button({
    variant = 'primary',
    size = 'md',
    loading = false,
    icon,
    children,
    className = '',
    disabled,
    ...props
}: ButtonProps) {
    const base = 'inline-flex items-center justify-center font-semibold transition-all duration-200 focus:outline-none active:scale-[0.96] disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer select-none'

    const variants: Record<string, string> = {
        primary: 'bg-primary-500 text-white shadow-clay-button hover:shadow-clay-hover hover:-translate-y-0.5 active:shadow-clay-pressed rounded-[var(--radius-pill)]',
        secondary: 'bg-[#f0ebe3] text-surface-700 shadow-clay-button hover:shadow-clay-hover hover:-translate-y-0.5 active:shadow-clay-pressed rounded-[var(--radius-pill)]',
        ghost: 'text-surface-600 hover:bg-surface-100 rounded-[var(--radius-clay-sm)]',
        danger: 'bg-danger text-white shadow-clay-button hover:shadow-clay-hover active:shadow-clay-pressed rounded-[var(--radius-pill)]',
        dark: 'bg-surface-800 text-white shadow-clay-button hover:shadow-clay-hover hover:-translate-y-0.5 active:shadow-clay-pressed rounded-[var(--radius-pill)]',
    }

    const sizes: Record<string, string> = {
        sm: 'text-xs px-4 py-2 gap-1.5',
        md: 'text-sm px-6 py-2.5 gap-2',
        lg: 'text-base px-8 py-3 gap-2',
    }

    return (
        <button
            className={`${base} ${variants[variant]} ${sizes[size]} ${className}`}
            disabled={disabled || loading}
            {...props}
        >
            {loading ? (
                <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
            ) : icon ? (
                <span className="shrink-0">{icon}</span>
            ) : null}
            {children}
        </button>
    )
}
