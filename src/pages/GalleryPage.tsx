import { useState, useEffect } from 'react'
import { PostCard } from '../components/feed/PostCard'
import { getGalleryPosts } from '../lib/api'
import type { Post } from '../types'
import { Loader2, Image as ImageIcon } from 'lucide-react'

export function GalleryPage() {
    const [posts, setPosts] = useState<Post[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        loadPosts()
    }, [])

    const loadPosts = async () => {
        setLoading(true)
        try {
            const data = await getGalleryPosts()
            // Filter posts that have at least one reaction
            const reactedPosts = data.filter(post => post.reactions && post.reactions.length > 0)
            setPosts(reactedPosts)
        } catch (error) {
            console.error('Failed to load gallery posts:', error)
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="space-y-6 animate-fade-in">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold text-surface-800">Gallery</h1>
                <p className="text-sm text-surface-400 mt-1">Explore creative works from the community</p>
            </div>

            {/* Gallery Grid */}
            {loading ? (
                <div className="flex items-center justify-center py-20">
                    <Loader2 className="animate-spin text-primary-500" size={32} />
                </div>
            ) : posts.length === 0 ? (
                <div className="clay text-center py-20">
                    <div className="w-16 h-16 mx-auto rounded-full bg-surface-200 flex items-center justify-center mb-4">
                        <ImageIcon className="text-surface-400" size={32} />
                    </div>
                    <p className="font-bold text-surface-700 text-lg">No media posts yet</p>
                    <p className="text-sm text-surface-400 mt-1">Upload images or videos to see them here!</p>
                </div>
            ) : (
                <div className="columns-1 md:columns-2 lg:columns-3 gap-5">
                    {posts.map((post, i) => (
                        <div key={post.id} className="break-inside-avoid mb-5 block" style={{ animationDelay: `${i * 100}ms` }}>
                            <PostCard post={post} />
                        </div>
                    ))}
                </div>
            )}
        </div>
    )
}
