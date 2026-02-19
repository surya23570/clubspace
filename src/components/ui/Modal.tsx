import { useEffect, type ReactNode } from 'react'
import { X } from 'lucide-react'

interface ModalProps {
    isOpen: boolean
    onClose: () => void
    title?: string
    children: ReactNode
    size?: 'sm' | 'md' | 'lg'
}

const sizes: Record<string, string> = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
}

export function Modal({ isOpen, onClose, title, children, size = 'md' }: ModalProps) {
    useEffect(() => {
        const handleEsc = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
        if (isOpen) {
            document.addEventListener('keydown', handleEsc)
            document.body.style.overflow = 'hidden'
        }
        return () => {
            document.removeEventListener('keydown', handleEsc)
            document.body.style.overflow = ''
        }
    }, [isOpen, onClose])

    if (!isOpen) return null

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fade-in">
            <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={onClose} />
            <div className={`relative ${sizes[size]} w-full clay-lg shadow-modal animate-scale-in`}>
                {title && (
                    <div className="flex items-center justify-between px-6 pt-6 pb-3">
                        <h2 className="text-lg font-bold text-surface-800">{title}</h2>
                        <button
                            onClick={onClose}
                            className="p-2 rounded-full hover:bg-surface-200 text-surface-400 hover:text-surface-600 transition-colors cursor-pointer"
                        >
                            <X size={18} />
                        </button>
                    </div>
                )}
                <div className="px-6 pb-6">{children}</div>
            </div>
        </div>
    )
}
