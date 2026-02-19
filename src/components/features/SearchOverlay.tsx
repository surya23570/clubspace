import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Search, X } from 'lucide-react'
import { searchUsers } from '../../lib/api'
import { Avatar } from '../ui/Avatar'
import type { Profile } from '../../types'

interface SearchOverlayProps {
    isOpen: boolean
    onClose: () => void
}

export function SearchOverlay({ isOpen, onClose }: SearchOverlayProps) {
    const [query, setQuery] = useState('')
    const [results, setResults] = useState<Profile[]>([])
    const [loading, setLoading] = useState(false)

    useEffect(() => {
        const timer = setTimeout(() => {
            if (query.trim()) handleSearch()
            else setResults([])
        }, 500)
        return () => clearTimeout(timer)
    }, [query])

    const handleSearch = async () => {
        setLoading(true)
        try {
            const users = await searchUsers(query)
            setResults(users)
        } catch (error) {
            console.error('Search failed', error)
        }
        setLoading(false)
    }

    if (!isOpen) return null

    return (
        <div className="fixed inset-0 z-[60] bg-black/50 backdrop-blur-sm flex items-start justify-center pt-20 lg:pt-24 px-4 animate-fade-in">
            <div className="bg-[#f0ebe3] w-full max-w-md rounded-2xl shadow-clay-lg overflow-hidden flex flex-col max-h-[70vh]">
                {/* Header */}
                <div className="p-4 border-b border-surface-200 flex items-center gap-3">
                    <Search size={20} className="text-surface-400" />
                    <input
                        autoFocus
                        placeholder="Search users..."
                        className="flex-1 bg-transparent border-none outline-none text-surface-800 placeholder:text-surface-400"
                        value={query}
                        onChange={e => setQuery(e.target.value)}
                    />
                    <button onClick={onClose} className="p-1 rounded-full hover:bg-surface-200 text-surface-500 transition-colors">
                        <X size={20} />
                    </button>
                </div>

                {/* Results */}
                <div className="overflow-y-auto flex-1 p-2">
                    {loading ? (
                        <div className="p-4 text-center text-surface-400 text-sm">Searching...</div>
                    ) : results.length > 0 ? (
                        <div className="space-y-1">
                            {results.map(user => (
                                <Link
                                    key={user.id}
                                    to={`/profile/${user.id}`}
                                    onClick={onClose}
                                    className="flex items-center gap-3 p-3 rounded-[var(--radius-clay-sm)] hover:bg-white/50 transition-colors group"
                                >
                                    <Avatar src={user.avatar_url} name={user.full_name} size="md" />
                                    <div>
                                        <p className="text-sm font-bold text-surface-700 group-hover:text-primary-600 transition-colors">
                                            {user.full_name}
                                        </p>
                                        <p className="text-xs text-surface-400">
                                            @{user.full_name.toLowerCase().replace(/\s+/g, '')}
                                        </p>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    ) : query ? (
                        <div className="p-8 text-center text-surface-400 text-sm">No users found</div>
                    ) : (
                        <div className="p-8 text-center text-surface-400 text-sm">Type to search for people...</div>
                    )}
                </div>
            </div>
        </div>
    )
}
