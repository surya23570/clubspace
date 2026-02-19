import { supabase } from './supabase'
import { uploadToCloudinary } from './cloudinary'
import type {
    Post,
    Profile,
    Reaction,
    ReactionType,
    PostCategory,
    PostPurpose,
    MediaType,
    AdminStats,
    LeaderboardEntry,
    Conversation,
    Message,
    MessageType,
    Notification,
} from '../types'

// ─── Profile ────────────────────────────────────────────────────────────────

export async function getProfile(userId: string): Promise<Profile | null> {
    const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single()
    if (error) throw error
    return data
}

export async function updateProfile(
    userId: string,
    updates: Partial<Pick<Profile, 'full_name' | 'bio' | 'avatar_url' | 'department' | 'is_private'>>
): Promise<Profile> {
    const { data, error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', userId)
        .select()
        .single()
    if (error) throw error
    return data
}

// ─── Posts ───────────────────────────────────────────────────────────────────

export async function createPost(post: {
    user_id: string
    media_url: string
    media_public_id: string
    media_type: MediaType
    category: PostCategory
    purpose: PostPurpose
    description: string
}): Promise<Post> {
    const { data, error } = await supabase
        .from('posts')
        .insert(post)
        .select('*, profile:profiles(*)')
        .single()
    if (error) throw error
    return data
}

export async function getMonthlyPosts(
    year: number,
    month: number,
    sort: 'recents' | 'popular' = 'recents',
    category?: PostCategory
): Promise<Post[]> {
    const startDate = new Date(year, month - 1, 1).toISOString()
    const endDate = new Date(year, month, 0, 23, 59, 59).toISOString()

    let query = supabase
        .from('posts')
        .select('*, profile:profiles(*), reactions(*)')
        .gte('created_at', startDate)
        .lte('created_at', endDate)

    if (category) {
        query = query.eq('category', category)
    }

    if (sort === 'popular') {
        query = query.order('created_at', { ascending: false })
    } else {
        query = query.order('created_at', { ascending: false })
    }

    const { data, error } = await query
    if (error) throw error

    const posts = (data as Post[]) || []

    if (sort === 'popular') {
        posts.sort((a, b) => (b.reactions?.length || 0) - (a.reactions?.length || 0))
    }

    return posts
}

export async function getUserPosts(userId: string): Promise<Post[]> {
    const { data, error } = await supabase
        .from('posts')
        .select('*, profile:profiles(*), reactions(*)')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
    if (error) throw error
    return data || []
}

export async function deletePost(postId: string): Promise<void> {
    const { error } = await supabase.from('posts').delete().eq('id', postId)
    if (error) throw error
}

export async function getGalleryPosts(): Promise<Post[]> {
    const { data, error } = await supabase
        .from('posts')
        .select('*, profile:profiles(*), reactions(*)')
        .in('media_type', ['image', 'video'])
        .order('created_at', { ascending: false })
    if (error) throw error
    return data || []
}

// ─── Reactions ──────────────────────────────────────────────────────────────

export async function getReactions(postId: string): Promise<Reaction[]> {
    const { data, error } = await supabase
        .from('reactions')
        .select('*')
        .eq('post_id', postId)
        .eq('post_id', postId)
    if (error) throw error
    return data || []
}

export async function addReaction(
    postId: string,
    userId: string,
    reactionType: ReactionType
): Promise<Reaction> {
    // Remove existing reaction first (one per user per post)
    await supabase
        .from('reactions')
        .delete()
        .eq('post_id', postId)
        .eq('user_id', userId)

    const { data, error } = await supabase
        .from('reactions')
        .insert({ post_id: postId, user_id: userId, reaction_type: reactionType })
        .select()
        .single()
    if (error) throw error
    return data
}

export async function removeReaction(postId: string, userId: string): Promise<void> {
    const { error } = await supabase
        .from('reactions')
        .delete()
        .eq('post_id', postId)
        .eq('user_id', userId)
    if (error) throw error
}

export async function getUserReaction(
    postId: string,
    userId: string
): Promise<Reaction | null> {
    const { data, error } = await supabase
        .from('reactions')
        .select('*')
        .eq('post_id', postId)
        .eq('user_id', userId)
        .maybeSingle()
    if (error) throw error
    return data
}

// ─── Leaderboard ────────────────────────────────────────────────────────────

export async function getLeaderboard(
    year: number,
    month: number
): Promise<LeaderboardEntry[]> {
    const startDate = new Date(year, month - 1, 1).toISOString()
    const endDate = new Date(year, month, 0, 23, 59, 59).toISOString()

    // Get all posts this month with reactions
    const { data: posts, error: postsError } = await supabase
        .from('posts')
        .select('user_id, reactions(user_id)')
        .gte('created_at', startDate)
        .lte('created_at', endDate)
    if (postsError) throw postsError

    // Get all profiles
    const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('*')
    if (profilesError) throw profilesError

    // Compute scores
    const scoreMap = new Map<string, { uploads: number; reactions: number }>()

    for (const post of posts || []) {
        const userId = post.user_id
        if (!scoreMap.has(userId)) {
            scoreMap.set(userId, { uploads: 0, reactions: 0 })
        }
        const entry = scoreMap.get(userId)!
        entry.uploads += 1
        entry.reactions += (post.reactions as unknown[])?.length || 0
    }

    const leaderboard: LeaderboardEntry[] = []
    for (const [userId, scores] of scoreMap) {
        const profile = (profiles || []).find((p: Profile) => p.id === userId)
        if (!profile) continue
        const mentorBonus = profile.role === 'mentor' ? 5 : 0
        const totalScore = scores.uploads * 2 + scores.reactions + mentorBonus

        leaderboard.push({
            user_id: userId,
            full_name: profile.full_name,
            avatar_url: profile.avatar_url,
            department: profile.department,
            upload_count: scores.uploads,
            reaction_count: scores.reactions,
            mentor_bonus: mentorBonus,
            total_score: totalScore,
            rank: 0,
        })
    }

    leaderboard.sort((a, b) => b.total_score - a.total_score)
    leaderboard.forEach((entry, i) => { entry.rank = i + 1 })

    return leaderboard
}

// ─── Admin Stats ────────────────────────────────────────────────────────────

export async function getAdminStats(): Promise<AdminStats> {
    const { count: totalUploads } = await supabase
        .from('posts')
        .select('*', { count: 'exact', head: true })

    const { data: profiles } = await supabase
        .from('profiles')
        .select('id')

    const { data: posts } = await supabase
        .from('posts')
        .select('category, created_at')

    const categoryCounts: Record<string, number> = {}
    const monthlyMap = new Map<string, number>()

    for (const post of posts || []) {
        // Category counts
        const cat = post.category || 'other'
        categoryCounts[cat] = (categoryCounts[cat] || 0) + 1

        // Monthly counts
        const d = new Date(post.created_at)
        const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
        monthlyMap.set(key, (monthlyMap.get(key) || 0) + 1)
    }

    const monthlyUploads = Array.from(monthlyMap.entries())
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([month, count]) => ({ month, count }))

    return {
        totalUploads: totalUploads || 0,
        activeUsers: profiles?.length || 0,
        categoryCounts: categoryCounts as AdminStats['categoryCounts'],
        monthlyUploads,
    }
}

// ─── All Profiles (for suggestions) ────────────────────────────────────────

export async function getAllProfiles(): Promise<Profile[]> {
    const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('full_name')
    if (error) throw error
    return data || []
}

// ─── Conversations ──────────────────────────────────────────────────────────

export async function getConversations(userId: string, type: 'active' | 'request' = 'active'): Promise<Conversation[]> {
    const { data, error } = await supabase
        .from('conversations')
        .select('*, p1:profiles!conversations_participant_1_fkey(*), p2:profiles!conversations_participant_2_fkey(*)')
        .or(`participant_1.eq.${userId},participant_2.eq.${userId}`)
        .eq('status', type)
        .order('last_message_at', { ascending: false })
    if (error) throw error

    // Shape conversations and filter out deleted ones
    const conversations: Conversation[] = (data || [])
        .map((c: any) => {
            const other = c.participant_1 === userId ? c.p2 : c.p1
            return {
                id: c.id,
                participant_1: c.participant_1,
                participant_2: c.participant_2,
                last_message: c.last_message,
                last_message_at: c.last_message_at,
                created_at: c.created_at,
                status: c.status,
                deleted_for: c.deleted_for || [],
                other_profile: other,
            }
        })
        .filter(c => !c.deleted_for.includes(userId))

    // Count unread for each conversation
    for (const convo of conversations) {
        const { count } = await supabase
            .from('messages')
            .select('*', { count: 'exact', head: true })
            .eq('conversation_id', convo.id)
            .eq('is_read', false)
            .neq('sender_id', userId)
        convo.unread_count = count || 0
    }

    return conversations
}

export async function getOrCreateConversation(
    userId: string,
    otherUserId: string
): Promise<Conversation> {
    // Normalize order so we don't get duplicates
    const [p1, p2] = [userId, otherUserId].sort()

    // Check existing
    const { data: existing } = await supabase
        .from('conversations')
        .select('*')
        .eq('participant_1', p1)
        .eq('participant_2', p2)
        .maybeSingle()

    if (existing) {
        // If it was "deleted" for this user, restore it (remove from deleted_for)
        if (existing.deleted_for && existing.deleted_for.includes(userId)) {
            const newDeletedFor = existing.deleted_for.filter((id: string) => id !== userId)
            await supabase
                .from('conversations')
                .update({ deleted_for: newDeletedFor })
                .eq('id', existing.id)
            existing.deleted_for = newDeletedFor
        }
        return existing as Conversation
    }

    // Simplified logic: Always create as active for now to ensure visibility
    // In a future update, we can implement sophisticated 'Request' logic based on granular permissions
    const { data, error } = await supabase
        .from('conversations')
        .insert({
            participant_1: p1,
            participant_2: p2,
            status: 'active'
        })
        .select()
        .single()
    if (error) throw error
    return data as Conversation
}

export async function acceptMessageRequest(conversationId: string): Promise<void> {
    const { error } = await supabase
        .from('conversations')
        .update({ status: 'active' })
        .eq('id', conversationId)
    if (error) throw error
}

export async function deleteConversation(conversationId: string, userId: string): Promise<void> {
    // We don't delete the row, we just add userId to 'deleted_for' array
    const { data: convo } = await supabase
        .from('conversations')
        .select('deleted_for')
        .eq('id', conversationId)
        .single()

    if (!convo) return

    const currentDeleted = convo.deleted_for || []
    if (!currentDeleted.includes(userId)) {
        const { error } = await supabase
            .from('conversations')
            .update({ deleted_for: [...currentDeleted, userId] })
            .eq('id', conversationId)
        if (error) throw error
    }
}

// ─── Messages ───────────────────────────────────────────────────────────────

export async function getMessages(conversationId: string): Promise<Message[]> {
    const { data, error } = await supabase
        .from('messages')
        .select('*, reply_to:messages!reply_to_id(*)')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true })
    if (error) throw error
    return data || []
}

export async function sendMessage(
    conversationId: string,
    senderId: string,
    content: string,
    type: MessageType = 'text',
    mediaUrl?: string,
    replyToId?: string
): Promise<Message> {
    const { data, error } = await supabase
        .from('messages')
        .insert({
            conversation_id: conversationId,
            sender_id: senderId,
            content,
            type,
            media_url: mediaUrl,
            reply_to_id: replyToId
        })
        .select('*, reply_to:messages!reply_to_id(*)')
        .single()
    if (error) throw error

    // Update conversation's last message
    await supabase
        .from('conversations')
        .update({
            last_message: type === 'text' ? content : `Sent a ${type}`,
            last_message_at: new Date().toISOString(),
            // If it was deleted for someone, un-delete it on new message
            deleted_for: []
        })
        .eq('id', conversationId)

    return data as Message
}

export async function markMessagesRead(
    conversationId: string,
    userId: string
): Promise<void> {
    await supabase
        .from('messages')
        .update({ is_read: true })
        .eq('conversation_id', conversationId)
        .neq('sender_id', userId)
        .eq('is_read', false)
}

// ─── Settings ───────────────────────────────────────────────────────────────

export async function changePassword(newPassword: string): Promise<void> {
    const { error } = await supabase.auth.updateUser({ password: newPassword })
    if (error) throw error
}

export async function deleteAccount(userId: string): Promise<void> {
    // Delete profile (cascades to posts, reactions, messages via FK)
    const { error } = await supabase.from('profiles').delete().eq('id', userId)
    if (error) throw error
    // Sign out
    await supabase.auth.signOut()
}


// ─── Blocking ───────────────────────────────────────────────────────────────

export async function blockUser(blockerId: string, blockedId: string): Promise<void> {
    const { error } = await supabase
        .from('blocks')
        .insert({ blocker_id: blockerId, blocked_id: blockedId })
    if (error) throw error

    // Also remove any existing follow relationships
    await unfollowUser(blockerId, blockedId)
    await unfollowUser(blockedId, blockerId)
}

export async function unblockUser(blockerId: string, blockedId: string): Promise<void> {
    const { error } = await supabase
        .from('blocks')
        .delete()
        .eq('blocker_id', blockerId)
        .eq('blocked_id', blockedId)
    if (error) throw error
}

export async function getBlockedUsers(userId: string): Promise<string[]> {
    const { data, error } = await supabase
        .from('blocks')
        .select('blocked_id')
        .eq('blocker_id', userId)
    if (error) throw error
    return data?.map((d: any) => d.blocked_id) || []
}

// ─── Follows ────────────────────────────────────────────────────────────────

export async function followUser(followerId: string, followingId: string): Promise<void> {
    // Check if user is private
    const { data: targetUser } = await supabase
        .from('profiles')
        .select('is_private')
        .eq('id', followingId)
        .single()

    const status = targetUser?.is_private ? 'pending' : 'accepted'

    const { error } = await supabase
        .from('follows')
        .insert({ follower_id: followerId, following_id: followingId, status })
    if (error) throw error
}

export async function unfollowUser(followerId: string, followingId: string): Promise<void> {
    const { error } = await supabase
        .from('follows')
        .delete()
        .eq('follower_id', followerId)
        .eq('following_id', followingId)
    if (error) throw error
}

export async function removeFollower(userId: string, followerId: string): Promise<void> {
    const { error } = await supabase
        .from('follows')
        .delete()
        .eq('follower_id', followerId)
        .eq('following_id', userId)
    if (error) throw error
}

export async function getFollowStatus(followerId: string, followingId: string): Promise<'none' | 'pending' | 'accepted'> {
    const { data, error } = await supabase
        .from('follows')
        .select('status')
        .eq('follower_id', followerId)
        .eq('following_id', followingId)
        .maybeSingle()
    if (error) throw error
    if (!data) return 'none'
    return data.status as 'pending' | 'accepted'
}

export async function getFollowers(userId: string): Promise<Profile[]> {
    const { data, error } = await supabase
        .from('follows')
        .select('follower:profiles!follows_follower_id_fkey(*)')
        .eq('following_id', userId)
        .eq('status', 'accepted')
    if (error) throw error
    return data?.map((d: any) => d.follower) || []
}

export async function getFollowRequests(userId: string): Promise<Profile[]> {
    const { data, error } = await supabase
        .from('follows')
        .select('follower:profiles!follows_follower_id_fkey(*)')
        .eq('following_id', userId)
        .eq('status', 'pending')
    if (error) throw error
    return data?.map((d: any) => d.follower) || []
}

export async function acceptFollowRequest(followerId: string, followingId: string): Promise<void> {
    const { error } = await supabase
        .from('follows')
        .update({ status: 'accepted' })
        .eq('follower_id', followerId)
        .eq('following_id', followingId)
    if (error) throw error
}

export async function rejectFollowRequest(followerId: string, followingId: string): Promise<void> {
    const { error } = await supabase
        .from('follows')
        .delete()
        .eq('follower_id', followerId)
        .eq('following_id', followingId)
    if (error) throw error
}

export async function getFollowing(userId: string): Promise<Profile[]> {
    const { data, error } = await supabase
        .from('follows')
        .select('following:profiles!follows_following_id_fkey(*)')
        .eq('follower_id', userId)
        .eq('status', 'accepted')
    if (error) throw error
    return data?.map((d: any) => d.following) || []
}

// ─── Notifications ──────────────────────────────────────────────────────────

export async function getNotifications(userId: string): Promise<Notification[]> {
    const { data, error } = await supabase
        .from('notifications')
        .select('*, actor:profiles(*)')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(20)
    if (error) throw error
    return data || []
}

export async function markNotificationRead(notificationId: string): Promise<void> {
    const { error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('id', notificationId)
    if (error) throw error
}

export async function markAllNotificationsRead(userId: string): Promise<void> {
    const { error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('user_id', userId)
        .eq('is_read', false)
    if (error) throw error
}

// ─── Search ─────────────────────────────────────────────────────────────────

export async function searchUsers(query: string): Promise<Profile[]> {
    const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .ilike('full_name', `%${query}%`)
        .limit(10)
    if (error) throw error
    return data || []
}

export async function uploadMessageMedia(file: File): Promise<string> {
    const { secure_url } = await uploadToCloudinary(file)
    return secure_url
}
