import { useState, useRef, useEffect } from 'react'
import { Heart, MessageCircle, Eye, MoreHorizontal, Trash2 } from 'lucide-react'
import { Link } from 'react-router-dom'
import { Avatar } from '../ui/Avatar'
import { ReactionBar } from './ReactionBar'
import { useAuth } from '../../context/AuthContext'
import type { Post } from '../../types'

interface PostCardProps {
    post: Post
    onDelete?: (id: string) => void
    showActions?: boolean
}

export function PostCard({ post, onDelete, showActions = false }: PostCardProps) {
    const { user } = useAuth()
    const isOwner = user?.id === post.user_id
    const reactionCount = post.reactions?.length || 0
    const timeAgo = getTimeAgo(post.created_at)

    const [showOptions, setShowOptions] = useState(false)
    const optionsRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (optionsRef.current && !optionsRef.current.contains(event.target as Node)) {
                setShowOptions(false)
            }
        }
        document.addEventListener('mousedown', handleClickOutside)
        return () => document.removeEventListener('mousedown', handleClickOutside)
    }, [])

    return (
        <div className="clay animate-fade-in-up">
            {/* Header */}
            <div className="flex items-center gap-3 p-4 pb-3 relative">
                <Link to={`/profile/${post.user_id}`} className="hover:opacity-80 transition-opacity">
                    <Avatar
                        src={post.profile?.avatar_url}
                        name={post.profile?.full_name}
                        size="md"
                    />
                </Link>
                <div className="flex-1 min-w-0">
                    <Link to={`/profile/${post.user_id}`} className="hover:underline decoration-surface-400/50 underline-offset-2">
                        <p className="text-sm font-bold text-surface-800">{post.profile?.full_name || 'Anonymous'}</p>
                    </Link>
                    <p className="text-[11px] text-surface-400">{timeAgo} · {post.category}</p>
                </div>
                {showActions && isOwner && onDelete && (
                    <div className="relative" ref={optionsRef}>
                        <button
                            onClick={() => setShowOptions(!showOptions)}
                            className="p-1.5 rounded-full hover:bg-surface-200/50 text-surface-400 cursor-pointer transition-colors"
                        >
                            <MoreHorizontal size={16} />
                        </button>

                        {showOptions && (
                            <div className="absolute right-0 top-full mt-1 w-36 clay bg-white rounded-[var(--radius-clay-sm)] shadow-lg z-10 overflow-hidden animate-fade-in">
                                <button
                                    onClick={() => {
                                        setShowOptions(false)
                                        onDelete(post.id)
                                    }}
                                    className="w-full flex items-center gap-2 px-4 py-2.5 text-xs font-semibold text-danger hover:bg-red-50 transition-colors cursor-pointer text-left"
                                >
                                    <Trash2 size={14} />
                                    Delete Post
                                </button>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Description */}
            {post.description && (
                <p className="px-4 pb-3 text-sm text-surface-700 leading-relaxed">{post.description}</p>
            )}

            {/* Media */}
            <div className="relative mx-3 mb-3 rounded-[var(--radius-clay-sm)] overflow-hidden">
                {post.media_type === 'image' ? (
                    <img
                        src={post.media_url}
                        alt={post.description}
                        className="w-full max-h-[400px] object-cover"
                        loading="lazy"
                    />
                ) : post.media_type === 'video' ? (
                    <video
                        src={post.media_url}
                        controls
                        className="w-full max-h-[400px]"
                    />
                ) : (
                    <div className="p-6 bg-gradient-to-br from-primary-100 to-primary-50">
                        <audio src={post.media_url} controls className="w-full" />
                    </div>
                )}
            </div>

            {/* Reactions */}
            <div className="px-4 pb-3">
                <ReactionBar postId={post.id} />
            </div>

            {/* Stats */}
            <div className="flex items-center gap-5 px-4 pb-4 text-surface-400">
                <button className="flex items-center gap-1.5 text-xs font-medium hover:text-accent-500 transition-colors cursor-pointer">
                    <Heart size={15} />
                    <span>{reactionCount}</span>
                </button>
                <button className="flex items-center gap-1.5 text-xs font-medium hover:text-primary-500 transition-colors cursor-pointer">
                    <MessageCircle size={15} />
                    <span>0</span>
                </button>
                <span className="flex items-center gap-1.5 text-xs font-medium ml-auto">
                    <Eye size={14} />
                    <span>{post.view_count || 0}</span>
                </span>
            </div>
        </div>
    )
}

function getTimeAgo(dateStr: string): string {
    const diff = Date.now() - new Date(dateStr).getTime()
    const mins = Math.floor(diff / 60000)
    if (mins < 1) return 'Just now'
    if (mins < 60) return `${mins}m ago`
    const hours = Math.floor(mins / 60)
    if (hours < 24) return `${hours}h ago`
    const days = Math.floor(hours / 24)
    if (days < 7) return `${days}d ago`
    return new Date(dateStr).toLocaleDateString()
}
