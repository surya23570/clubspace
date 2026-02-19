import { useState, useEffect } from 'react'
import { PostCard } from '../components/feed/PostCard'
import { UploadModal } from '../components/upload/UploadModal'
import { getMonthlyPosts } from '../lib/api'
import type { Post, PostCategory } from '../types'
import { Plus, Image } from 'lucide-react'
import { Avatar } from '../components/ui/Avatar'
import { useAuth } from '../context/AuthContext'

const TABS = ['Recents', 'Friends', 'Popular'] as const
const CATEGORIES: { value: PostCategory | 'all'; label: string }[] = [
    { value: 'all', label: '🔥 All' },
    { value: 'photography', label: '📸 Photo' },
    { value: 'design', label: '🎨 Design' },
    { value: 'music', label: '🎵 Music' },
    { value: 'video', label: '🎬 Video' },
    { value: 'writing', label: '✍️ Writing' },
]

export function FeedPage() {
    const { profile } = useAuth()
    const [posts, setPosts] = useState<Post[]>([])
    const [loading, setLoading] = useState(true)
    const [tab, setTab] = useState<typeof TABS[number]>('Recents')
    const [category, setCategory] = useState<PostCategory | 'all'>('all')
    const [showUpload, setShowUpload] = useState(false)

    useEffect(() => { loadPosts() }, [tab, category])

    const loadPosts = async () => {
        setLoading(true)
        try {
            const now = new Date()
            const sort = tab === 'Popular' ? 'popular' : 'recents'
            const cat = category === 'all' ? undefined : category
            const data = await getMonthlyPosts(now.getFullYear(), now.getMonth() + 1, sort, cat)
            setPosts(data)
        } catch { /* silent */ }
        setLoading(false)
    }

    return (
        <div className="space-y-5 animate-fade-in">
            {/* Header */}
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold text-surface-800">Feeds</h1>
                <div className="clay-sm flex p-1 gap-0.5">
                    {TABS.map(t => (
                        <button
                            key={t}
                            onClick={() => setTab(t)}
                            className={`px-3 py-1.5 text-xs font-semibold rounded-[var(--radius-pill)] transition-all cursor-pointer ${tab === t
                                ? 'bg-primary-500 text-white shadow-clay-button'
                                : 'text-surface-500 hover:text-surface-700'
                                }`}
                        >
                            {t}
                        </button>
                    ))}
                </div>
            </div>

            {/* Category Filters */}
            <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
                {CATEGORIES.map(c => (
                    <button
                        key={c.value}
                        onClick={() => setCategory(c.value)}
                        className={`shrink-0 px-4 py-2 text-xs font-semibold rounded-[var(--radius-pill)] transition-all cursor-pointer ${category === c.value
                            ? 'bg-surface-800 text-white shadow-clay-button'
                            : 'clay-sm text-surface-600 hover:-translate-y-0.5'
                            }`}
                    >
                        {c.label}
                    </button>
                ))}
            </div>

            {/* Composer Card (Top) */}
            <div className="clay p-4 flex items-center gap-3 animate-fade-in">
                <Avatar src={profile?.avatar_url} name={profile?.full_name} size="md" />
                <button
                    onClick={() => setShowUpload(true)}
                    className="flex-1 text-left bg-surface-100 hover:bg-surface-200 transition-colors rounded-[var(--radius-pill)] px-4 py-2.5 text-surface-400 cursor-pointer"
                >
                    Share something…
                </button>
                <div className="flex items-center gap-1">
                    <button
                        onClick={() => setShowUpload(true)}
                        className="p-2 rounded-full text-surface-400 hover:text-primary-500 hover:bg-surface-100 transition-colors cursor-pointer"
                    >
                        <Image size={20} />
                    </button>
                </div>
            </div>

            {/* Posts */}
            {loading ? (
                <div className="space-y-5">
                    {[1, 2, 3].map(i => (
                        <div key={i} className="clay p-5 space-y-4 animate-fade-in" style={{ animationDelay: `${i * 100}ms` }}>
                            <div className="flex items-center gap-3">
                                <div className="w-11 h-11 skeleton rounded-full" />
                                <div className="space-y-2 flex-1">
                                    <div className="h-3 w-28 skeleton" />
                                    <div className="h-2.5 w-20 skeleton" />
                                </div>
                            </div>
                            <div className="h-48 skeleton rounded-[var(--radius-clay-sm)]" />
                        </div>
                    ))}
                </div>
            ) : posts.length === 0 ? (
                <div className="clay text-center py-16">
                    <div className="w-20 h-20 mx-auto rounded-full bg-surface-200 flex items-center justify-center mb-4">
                        <span className="text-3xl">📸</span>
                    </div>
                    <p className="font-bold text-surface-700 text-lg">No posts yet this month</p>
                    <p className="text-sm text-surface-400 mt-1 mb-4">Be the first to share your creative work!</p>
                    <button
                        onClick={() => setShowUpload(true)}
                        className="inline-flex items-center gap-2 bg-primary-500 text-white px-6 py-2.5 rounded-[var(--radius-pill)] shadow-clay-button hover:-translate-y-0.5 transition-all font-semibold text-sm cursor-pointer"
                    >
                        <Plus size={16} /> Create Post
                    </button>
                </div>
            ) : (
                <div className="space-y-5">
                    {posts.map((post, i) => (
                        <div key={post.id} style={{ animationDelay: `${i * 80}ms` }}>
                            <PostCard post={post} />
                        </div>
                    ))}
                </div>
            )}



            <UploadModal
                isOpen={showUpload}
                onClose={() => setShowUpload(false)}
                onSuccess={loadPosts}
            />
        </div>
    )
}
