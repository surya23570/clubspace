export type UserRole = 'student' | 'mentor' | 'admin'

export type MediaType = 'image' | 'video' | 'audio'

export type PostCategory = 'photography' | 'design' | 'music' | 'video' | 'writing' | 'other'

export type PostPurpose = 'assignment' | 'personal' | 'competition' | 'showcase'

export type ReactionType =
    | 'creative_idea'
    | 'strong_composition'
    | 'editing_quality'
    | 'emotional_impact'
    | 'needs_improvement'

export interface Profile {
    id: string
    email: string
    full_name: string
    avatar_url: string | null
    bio: string | null
    department: string | null
    role: UserRole
    created_at: string
    is_private?: boolean
}

export interface Post {
    id: string
    user_id: string
    media_url: string
    media_public_id: string
    media_type: MediaType
    category: PostCategory
    purpose: PostPurpose
    description: string
    created_at: string
    // Joined data
    profile?: Profile
    reactions?: Reaction[]
    reaction_counts?: ReactionCount[]
    view_count?: number
}

export interface Reaction {
    id: string
    post_id: string
    user_id: string
    reaction_type: ReactionType
    created_at: string
}

export interface ReactionCount {
    reaction_type: ReactionType
    count: number
}

export interface PostView {
    id: string
    post_id: string
    user_id: string
    created_at: string
}

export interface LeaderboardEntry {
    user_id: string
    full_name: string
    avatar_url: string | null
    department: string | null
    upload_count: number
    reaction_count: number
    mentor_bonus: number
    total_score: number
    rank: number
}

export interface MonthlyAward {
    title: string
    icon: string
    winner: Profile | null
}

export interface UploadProgress {
    status: 'idle' | 'uploading' | 'processing' | 'done' | 'error'
    progress: number
    error?: string
}

export interface FeedFilter {
    tab: 'recents' | 'popular'
    category?: PostCategory
}

export interface AdminStats {
    totalUploads: number
    activeUsers: number
    categoryCounts: Record<PostCategory, number>
    monthlyUploads: { month: string; count: number }[]
}

export interface Conversation {
    id: string
    participant_1: string
    participant_2: string
    last_message: string
    last_message_at: string
    created_at: string
    status: 'active' | 'request'
    deleted_for: string[]
    // Joined
    other_profile?: Profile
    unread_count?: number
}

export type MessageType = 'text' | 'image' | 'video' | 'audio' | 'post'

export interface Message {
    id: string
    conversation_id: string
    sender_id: string
    content: string
    type: MessageType
    media_url?: string
    reply_to_id?: string
    is_read: boolean
    created_at: string
    // Joined
    reply_to?: Message
}


export interface Follow {
    id: string
    follower_id: string
    following_id: string
    status: 'pending' | 'accepted'
    created_at: string
}

export interface Block {
    id: string
    blocker_id: string
    blocked_id: string
    created_at: string
}

export type NotificationType = 'follow' | 'like' | 'comment' | 'system'

export interface Notification {
    id: string
    user_id: string
    actor_id?: string
    type: NotificationType
    title?: string
    message: string
    resource_id?: string
    is_read: boolean
    created_at: string
    // Joined
    actor?: Profile
}
