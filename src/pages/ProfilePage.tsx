import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import {
    getProfile,
    getUserPosts,
    updateProfile,
    followUser,
    unfollowUser,
    getFollowStatus,
    getFollowers,
    getFollowing,
    getFollowRequests,
    acceptFollowRequest,
    rejectFollowRequest,
    removeFollower,
    blockUser
} from '../lib/api'
import { Card } from '../components/ui/Card'
import { Avatar } from '../components/ui/Avatar'
import { Button } from '../components/ui/Button'
import { Modal } from '../components/ui/Modal'
import { UserListModal } from '../components/features/UserListModal'
import type { Profile, Post } from '../types'

import {
    Camera, Edit3, Upload, Heart, MapPin, Calendar, Grid, List,
    UserPlus, UserCheck, Users, Lock, Clock, Shield, MessageCircle
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'

export function ProfilePage() {
    const { userId: paramUserId } = useParams()
    const navigate = useNavigate()
    const { user, refreshProfile } = useAuth()

    // Determine which profile to show
    const targetUserId = paramUserId || user?.id
    const isOwnProfile = user?.id === targetUserId

    const [profile, setProfile] = useState<Profile | null>(null)
    const [posts, setPosts] = useState<Post[]>([])
    const [loading, setLoading] = useState(true)

    // Follow State
    const [followStatus, setFollowStatus] = useState<'none' | 'pending' | 'accepted'>('none')
    const [incomingStatus, setIncomingStatus] = useState<'none' | 'pending' | 'accepted'>('none') // Status of them following us
    const [submittingFollow, setSubmittingFollow] = useState(false)
    const [followers, setFollowers] = useState<Profile[]>([])
    const [following, setFollowing] = useState<Profile[]>([])
    const [requests, setRequests] = useState<Profile[]>([])

    // List Modals
    const [listModalOpen, setListModalOpen] = useState(false)
    const [listModalType, setListModalType] = useState<'followers' | 'following' | 'requests'>('followers')

    // Edit State
    const [showEdit, setShowEdit] = useState(false)
    const [editForm, setEditForm] = useState({ full_name: '', bio: '', department: '', is_private: false })
    const [saving, setSaving] = useState(false)

    // UI State
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')

    useEffect(() => {
        if (targetUserId) load()
    }, [targetUserId, user?.id])

    const load = async () => {
        if (!targetUserId) return
        setLoading(true)
        try {
            const [p, userPosts, followersData, followingData] = await Promise.all([
                getProfile(targetUserId),
                getUserPosts(targetUserId),
                getFollowers(targetUserId),
                getFollowing(targetUserId)
            ])

            setProfile(p)
            setPosts(userPosts)
            setFollowers(followersData)
            setFollowing(followingData)

            if (p && isOwnProfile && user) {
                setEditForm({
                    full_name: p.full_name,
                    bio: p.bio || '',
                    department: p.department || '',
                    is_private: p.is_private || false
                })

                // Load requests if own profile
                const reqs = await getFollowRequests(user.id)
                setRequests(reqs)
            }

            // Check follow status if viewing someone else
            if (user && !isOwnProfile) {
                const [outStatus, inStatus] = await Promise.all([
                    getFollowStatus(user.id, targetUserId),
                    getFollowStatus(targetUserId, user.id)
                ])
                setFollowStatus(outStatus)
                setIncomingStatus(inStatus)
            }
        } catch (err) {
            console.error(err)
        }
        setLoading(false)
    }

    const handleFollowToggle = async () => {
        if (!user || !profile || submittingFollow) return
        setSubmittingFollow(true)
        try {
            if (followStatus === 'accepted' || followStatus === 'pending') {
                // Unfollow or Cancel Request
                await unfollowUser(user.id, profile.id)
                setFollowStatus('none')
                if (followStatus === 'accepted') {
                    setFollowers(prev => prev.filter(f => f.id !== user.id))
                }
            } else {
                // Follow
                await followUser(user.id, profile.id)
                // Re-fetch status to see if it was auto-accepted or pending
                const newStatus = await getFollowStatus(user.id, profile.id)
                setFollowStatus(newStatus)

                if (newStatus === 'accepted') {
                    const myProfile = await getProfile(user.id)
                    if (myProfile) setFollowers(prev => [...prev, myProfile])
                }
            }
        } catch (err) {
            console.error(err)
        }
        setSubmittingFollow(false)
    }

    const handleListAction = async (targetId: string, action: 'follow' | 'unfollow' | 'accept' | 'reject' | 'remove') => {
        if (!user) return
        try {
            if (action === 'accept') {
                await acceptFollowRequest(targetId, user.id)
                setRequests(prev => prev.filter(r => r.id !== targetId))
                // Move from requests to followers
                const newFollower = requests.find(r => r.id === targetId) || ((targetId === profile?.id) ? profile : null)
                if (newFollower) setFollowers(prev => [...prev, newFollower])

                // If we accepted the person we are currently viewing
                if (targetId === profile?.id) {
                    setIncomingStatus('accepted')
                }
            } else if (action === 'reject') {
                await rejectFollowRequest(targetId, user.id)
                setRequests(prev => prev.filter(r => r.id !== targetId))
                if (targetId === profile?.id) {
                    setIncomingStatus('none')
                }
            } else if (action === 'unfollow') {
                await unfollowUser(user.id, targetId)
                setFollowing(prev => prev.filter(f => f.id !== targetId))
            } else if (action === 'remove') {
                await removeFollower(user.id, targetId)
                setFollowers(prev => prev.filter(f => f.id !== targetId))
            }
        } catch (err) {
            console.error(err)
        }
    }

    const handleBlock = async () => {
        if (!user || !profile) return
        if (!confirm('Are you sure you want to block this user? They will not be able to find your profile, posts, or story.')) return
        try {
            await blockUser(user.id, profile.id)
            // Redirect home or show blocked state
            window.location.href = '/'
        } catch (err) {
            console.error(err)
        }
    }

    const openList = (type: 'followers' | 'following' | 'requests') => {
        setListModalType(type)
        setListModalOpen(true)
    }

    const handleSave = async () => {
        if (!user) return
        setSaving(true)
        try {
            await updateProfile(user.id, editForm)
            setShowEdit(false)
            refreshProfile()
            load()
        } catch { /* silent */ }
        setSaving(false)
    }

    if (loading) {
        return (
            <div className="space-y-5 animate-fade-in">
                <div className="clay p-6">
                    <div className="flex items-center gap-5">
                        <div className="w-20 h-20 skeleton rounded-full" />
                        <div className="flex-1 space-y-3">
                            <div className="h-4 w-40 skeleton" />
                            <div className="h-3 w-24 skeleton" />
                        </div>
                    </div>
                </div>
                <div className="grid grid-cols-3 gap-3">
                    {[1, 2, 3, 4, 5, 6].map(i => <div key={i} className="aspect-square skeleton rounded-[var(--radius-clay-sm)]" />)}
                </div>
            </div>
        )
    }

    if (!profile) return <div className="p-8 text-center text-surface-500">Profile not found</div>

    const stats = [
        { icon: Upload, label: 'Posts', value: posts.length, color: 'text-primary-500', onClick: undefined },
        { icon: Heart, label: 'Reactions', value: posts.reduce((sum, p) => sum + ((p as any).reactions?.length || 0), 0), color: 'text-accent-500', onClick: undefined },
        { icon: Users, label: 'Followers', value: followers.length, color: 'text-secondary-500', onClick: () => openList('followers') },
    ]

    return (
        <div className="space-y-5 animate-fade-in">
            {/* Profile Header */}
            <div className="clay overflow-hidden">
                {/* Cover */}
                <div className="h-28 bg-gradient-to-r from-primary-300 via-accent-400 to-amber-300 relative">
                    <div className="absolute inset-0 bg-black/5" />
                </div>

                {/* Info */}
                <div className="px-5 pb-5 relative">
                    <div className="-mt-10 flex flex-col sm:flex-row sm:items-end gap-4">
                        <div className="relative">
                            <Avatar src={profile.avatar_url} name={profile.full_name} size="xl" className="border-4 border-[#f7f4f0]" />
                            {profile.role === 'mentor' && (
                                <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-success rounded-full border-3 border-[#f7f4f0] flex items-center justify-center">
                                    <span className="text-[8px] text-white">✓</span>
                                </div>
                            )}
                        </div>
                        <div className="flex-1">
                            <h2 className="text-xl font-bold text-surface-800 flex items-center gap-2">
                                {profile.full_name}
                                {profile.is_private && <Lock size={14} className="text-surface-400" />}
                            </h2>
                            <p className="text-xs text-surface-400">@{profile.full_name.toLowerCase().replace(/\s+/g, '')}</p>
                            {profile.bio && <p className="text-sm text-surface-600 mt-1">{profile.bio}</p>}
                            <div className="flex items-center gap-4 mt-2 text-xs text-surface-400 flex-wrap">
                                {profile.department && (
                                    <span className="flex items-center gap-1"><MapPin size={11} /> {profile.department}</span>
                                )}
                                <span className="flex items-center gap-1">
                                    <Calendar size={11} /> Joined {new Date(profile.created_at).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
                                </span>
                                <span className="flex items-center gap-1 cursor-pointer hover:text-primary-600 transition-colors" onClick={() => openList('following')}>
                                    <Users size={11} /> {following.length} Following
                                </span>
                            </div>
                        </div>

                        {/* Actions */}
                        <div className="flex gap-2">
                            {isOwnProfile ? (
                                <>
                                    {requests.length > 0 && (
                                        <Button variant="primary" size="sm" onClick={() => openList('requests')}>
                                            Requests ({requests.length})
                                        </Button>
                                    )}
                                    <Button variant="secondary" size="sm" icon={<Edit3 size={13} />} onClick={() => setShowEdit(true)}>
                                        Edit
                                    </Button>
                                </>
                            ) : (
                                <>
                                    {incomingStatus === 'pending' && (
                                        <Button
                                            variant="primary"
                                            size="sm"
                                            icon={<UserCheck size={16} />}
                                            onClick={() => handleListAction(profile.id, 'accept')}
                                        >
                                            Accept Request
                                        </Button>
                                    )}
                                    <Button
                                        variant={followStatus === 'accepted' ? "secondary" : "primary"}
                                        size="sm"
                                        icon={
                                            followStatus === 'accepted' ? <UserCheck size={16} /> :
                                                followStatus === 'pending' ? <Clock size={16} /> :
                                                    <UserPlus size={16} />
                                        }
                                        onClick={handleFollowToggle}
                                        loading={submittingFollow}
                                    >
                                        {followStatus === 'accepted' ? 'Following' :
                                            followStatus === 'pending' ? 'Requested' :
                                                'Follow'}
                                    </Button>
                                    {followStatus === 'accepted' && (
                                        <Button
                                            variant="secondary"
                                            size="sm"
                                            icon={<MessageCircle size={16} />}
                                            onClick={() => navigate(`/messages?userId=${profile.id}`)}
                                        >
                                            Message
                                        </Button>
                                    )}
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        className="text-surface-400 hover:text-red-500"
                                        onClick={handleBlock}
                                        icon={<Shield size={16} />}
                                    >
                                    </Button>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-3">
                {stats.map(({ icon: Icon, label, value, color, onClick }) => (
                    <Card
                        key={label}
                        hover={!!onClick}
                        className={`text-center !p-4 ${onClick ? 'cursor-pointer' : ''}`}
                        onClick={onClick}
                    >
                        <Icon size={18} className={`${color} mx-auto mb-1.5`} />
                        <p className="text-xl font-bold text-surface-800">{value}</p>
                        <p className="text-[11px] font-medium text-surface-400 mt-0.5">{label}</p>
                    </Card>
                ))}
            </div>

            {/* Gallery (Only show if public or following or own profile) */}
            {(!profile.is_private || isOwnProfile || followStatus === 'accepted') ? (
                <div>
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="font-bold text-surface-800 text-[15px]">Work</h3>
                        <div className="flex gap-1">
                            <button
                                onClick={() => setViewMode('grid')}
                                className={`p-2 rounded-[var(--radius-clay-sm)] transition-all cursor-pointer ${viewMode === 'grid' ? 'clay-pressed text-primary-500' : 'clay-sm text-surface-400'}`}
                            >
                                <Grid size={14} />
                            </button>
                            <button
                                onClick={() => setViewMode('list')}
                                className={`p-2 rounded-[var(--radius-clay-sm)] transition-all cursor-pointer ${viewMode === 'list' ? 'clay-pressed text-primary-500' : 'clay-sm text-surface-400'}`}
                            >
                                <List size={14} />
                            </button>
                        </div>
                    </div>

                    {posts.length === 0 ? (
                        <div className="clay text-center py-12">
                            <div className="w-16 h-16 mx-auto rounded-full bg-surface-200 flex items-center justify-center mb-3">
                                <Camera size={24} className="text-surface-400" />
                            </div>
                            <p className="font-semibold text-surface-600">No posts yet</p>
                        </div>
                    ) : (
                        <div className={viewMode === 'grid' ? 'grid grid-cols-3 gap-2' : 'space-y-3'}>
                            {posts.map(post => (
                                viewMode === 'grid' ? (
                                    <div key={post.id} className="aspect-square rounded-[var(--radius-clay-sm)] overflow-hidden bg-surface-200 group cursor-pointer relative shadow-clay-sm">
                                        {post.media_type === 'image' ? (
                                            <img src={post.media_url} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary-100 to-primary-50">
                                                <span className="text-2xl">{post.media_type === 'video' ? '🎬' : '🎵'}</span>
                                            </div>
                                        )}
                                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all duration-300 flex items-center justify-center opacity-0 group-hover:opacity-100">
                                            <Heart size={20} className="text-white" />
                                        </div>
                                    </div>
                                ) : (
                                    <Card key={post.id} hover className="flex items-center gap-4">
                                        <div className="w-16 h-16 rounded-[var(--radius-clay-sm)] overflow-hidden bg-surface-200 flex-shrink-0">
                                            {post.media_type === 'image' ? (
                                                <img src={post.media_url} alt="" className="w-full h-full object-cover" />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary-100 to-primary-50">
                                                    <span className="text-lg">{post.media_type === 'video' ? '🎬' : '🎵'}</span>
                                                </div>
                                            )}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-semibold text-surface-700 truncate">{post.description || 'Untitled'}</p>
                                            <p className="text-xs text-surface-400 mt-0.5">{post.category} · {new Date(post.created_at).toLocaleDateString()}</p>
                                        </div>
                                    </Card>
                                )
                            ))}
                        </div>
                    )}
                </div>
            ) : (
                <div className="clay text-center py-12">
                    <div className="w-16 h-16 mx-auto rounded-full bg-surface-200 flex items-center justify-center mb-3">
                        <Lock size={24} className="text-surface-400" />
                    </div>
                    <p className="font-semibold text-surface-800">This account is private</p>
                    <p className="text-sm text-surface-500 mt-1">Follow to see their photos and videos.</p>
                </div>
            )}

            {/* User List Modal */}
            <UserListModal
                isOpen={listModalOpen}
                onClose={() => setListModalOpen(false)}
                title={listModalType === 'followers' ? 'Followers' : listModalType === 'following' ? 'Following' : 'Follow Requests'}
                users={listModalType === 'followers' ? followers : listModalType === 'following' ? following : requests}
                type={listModalType}
                currentUserId={user?.id || ''}
                onAction={handleListAction}
            />

            {/* Edit Modal (Only render if own profile) */}
            {isOwnProfile && (
                <Modal isOpen={showEdit} onClose={() => setShowEdit(false)} title="Edit Profile" size="md">
                    <div className="space-y-4">
                        <div>
                            <label className="text-xs font-semibold text-surface-600 uppercase tracking-wider mb-2 block">Full Name</label>
                            <input
                                value={editForm.full_name}
                                onChange={e => setEditForm({ ...editForm, full_name: e.target.value })}
                                className="w-full px-4 py-3 clay-input text-sm text-surface-800"
                            />
                        </div>
                        <div>
                            <label className="text-xs font-semibold text-surface-600 uppercase tracking-wider mb-2 block">Bio</label>
                            <textarea
                                value={editForm.bio}
                                onChange={e => setEditForm({ ...editForm, bio: e.target.value })}
                                rows={3}
                                className="w-full px-4 py-3 clay-input text-sm text-surface-800 resize-none"
                            />
                        </div>
                        <div>
                            <label className="text-xs font-semibold text-surface-600 uppercase tracking-wider mb-2 block">Interested Field</label>
                            <input
                                value={editForm.department}
                                onChange={e => setEditForm({ ...editForm, department: e.target.value })}
                                className="w-full px-4 py-3 clay-input text-sm text-surface-800"
                            />
                        </div>

                        <div className="flex items-center justify-between py-2">
                            <label className="text-sm font-medium text-surface-800">Private Account</label>
                            <button
                                onClick={() => setEditForm({ ...editForm, is_private: !editForm.is_private })}
                                className={`w-11 h-6 rounded-full transition-colors relative ${editForm.is_private ? 'bg-primary-500' : 'bg-surface-300'}`}
                            >
                                <div className={`absolute top-1 left-1 bg-white w-4 h-4 rounded-full transition-transform ${editForm.is_private ? 'translate-x-5' : ''}`} />
                            </button>
                        </div>
                        <p className="text-xs text-surface-500 -mt-2">When private, people must request to follow you.</p>

                        <div className="flex justify-end gap-3 pt-2">
                            <Button variant="secondary" onClick={() => setShowEdit(false)}>Cancel</Button>
                            <Button variant="primary" onClick={handleSave} loading={saving}>Save</Button>
                        </div>
                    </div>
                </Modal>
            )}
        </div>
    )
}
