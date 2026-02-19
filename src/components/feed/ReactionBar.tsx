import { useState, useEffect } from 'react'
import { useAuth } from '../../context/AuthContext'
import { getReactions, addReaction, removeReaction } from '../../lib/api'
import type { ReactionType } from '../../types'

interface ReactionBarProps {
    postId: string
}

const REACTIONS: { type: ReactionType; emoji: string; label: string }[] = [
    { type: 'creative_idea', emoji: '💡', label: 'Creative' },
    { type: 'strong_composition', emoji: '🎯', label: 'Composition' },
    { type: 'editing_quality', emoji: '✨', label: 'Editing' },
    { type: 'emotional_impact', emoji: '💖', label: 'Impact' },
    { type: 'needs_improvement', emoji: '📝', label: 'Feedback' },
]

export function ReactionBar({ postId }: ReactionBarProps) {
    const { user } = useAuth()
    const [counts, setCounts] = useState<Record<string, number>>({})
    const [userReaction, setUserReaction] = useState<ReactionType | null>(null)

    useEffect(() => {
        loadReactions()
    }, [postId])

    const loadReactions = async () => {
        try {
            const data = await getReactions(postId)
            const newCounts: Record<string, number> = {}
            let myReaction: ReactionType | null = null
            data.forEach((r: any) => {
                newCounts[r.reaction_type] = (newCounts[r.reaction_type] || 0) + 1
                if (r.user_id === user?.id) myReaction = r.reaction_type
            })
            setCounts(newCounts)
            setUserReaction(myReaction)
        } catch { /* silent */ }
    }

    const handleReaction = async (type: ReactionType) => {
        if (!user) return
        try {
            if (userReaction === type) {
                setUserReaction(null)
                setCounts(prev => ({ ...prev, [type]: Math.max((prev[type] || 1) - 1, 0) }))
                await removeReaction(postId, user.id)
            } else {
                if (userReaction) {
                    setCounts(prev => ({
                        ...prev,
                        [userReaction!]: Math.max((prev[userReaction!] || 1) - 1, 0),
                        [type]: (prev[type] || 0) + 1,
                    }))
                    await removeReaction(postId, user.id)
                } else {
                    setCounts(prev => ({ ...prev, [type]: (prev[type] || 0) + 1 }))
                }
                setUserReaction(type)
                await addReaction(postId, user.id, type)
            }
        } catch {
            loadReactions()
        }
    }

    return (
        <div className="flex items-center gap-1.5 flex-wrap">
            {REACTIONS.map(({ type, emoji, label }) => {
                const count = counts[type] || 0
                const isActive = userReaction === type
                return (
                    <button
                        key={type}
                        onClick={() => handleReaction(type)}
                        className={`
              flex items-center gap-1 px-3 py-1.5 text-[11px] font-medium transition-all duration-200 cursor-pointer
              rounded-[var(--radius-pill)]
              ${isActive
                                ? 'bg-primary-100 text-primary-600 shadow-clay-pressed scale-[0.97]'
                                : 'clay-sm text-surface-500 hover:text-surface-700 hover:-translate-y-0.5'
                            }
            `}
                        title={label}
                    >
                        <span className="text-sm">{emoji}</span>
                        {count > 0 && <span>{count}</span>}
                    </button>
                )
            })}
        </div>
    )
}
