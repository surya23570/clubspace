interface AvatarProps {
    src?: string | null
    name?: string | null
    size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl'
    className?: string
}

const sizes: Record<string, string> = {
    xs: 'w-7 h-7 text-[10px]',
    sm: 'w-9 h-9 text-[11px]',
    md: 'w-11 h-11 text-xs',
    lg: 'w-14 h-14 text-sm',
    xl: 'w-20 h-20 text-xl',
}

const gradients = [
    'from-primary-300 to-primary-500',
    'from-pink-300 to-rose-400',
    'from-amber-300 to-orange-400',
    'from-emerald-300 to-green-400',
    'from-sky-300 to-blue-400',
    'from-violet-300 to-purple-400',
]

export function Avatar({ src, name, size = 'md', className = '' }: AvatarProps) {
    const initials = name
        ?.split(' ')
        .map(n => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2) || '?'

    const idx = (name?.charCodeAt(0) || 0) % gradients.length

    if (src) {
        return (
            <img
                src={src}
                alt={name || 'Avatar'}
                className={`${sizes[size]} rounded-full object-cover shadow-clay-sm ${className}`}
            />
        )
    }

    return (
        <div className={`
      ${sizes[size]} rounded-full
      bg-gradient-to-br ${gradients[idx]}
      flex items-center justify-center
      font-bold text-white
      shadow-clay-sm
      ${className}
    `}>
            {initials}
        </div>
    )
}
