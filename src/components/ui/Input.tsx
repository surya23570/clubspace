import type { InputHTMLAttributes } from 'react'
import { forwardRef } from 'react'

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
    label?: string
    error?: string
    icon?: React.ReactNode
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
    ({ label, error, icon, className = '', ...props }, ref) => {
        return (
            <div className="flex flex-col gap-1.5">
                {label && (
                    <label className="text-sm font-medium text-surface-700">
                        {label}
                    </label>
                )}
                <div className="relative">
                    {icon && (
                        <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-surface-400">
                            {icon}
                        </span>
                    )}
                    <input
                        ref={ref}
                        className={`
              w-full rounded-xl border border-surface-300 bg-white/80
              px-4 py-2.5 text-sm text-surface-800
              placeholder:text-surface-400
              focus:outline-none focus:ring-2 focus:ring-primary-300 focus:border-primary-400
              transition-all duration-200
              disabled:opacity-50 disabled:cursor-not-allowed
              ${icon ? 'pl-10' : ''}
              ${error ? 'border-danger ring-1 ring-danger/30' : ''}
              ${className}
            `}
                        {...props}
                    />
                </div>
                {error && (
                    <p className="text-xs text-danger font-medium">{error}</p>
                )}
            </div>
        )
    }
)

Input.displayName = 'Input'
