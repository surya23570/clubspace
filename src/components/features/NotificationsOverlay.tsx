import { useEffect, useState } from 'react'
import { X, Bell, Heart, UserPlus, MessageCircle } from 'lucide-react'
import { Link } from 'react-router-dom'
import { getNotifications, markAllNotificationsRead, markNotificationRead } from '../../lib/api'
import { useAuth } from '../../context/AuthContext'
import { Avatar } from '../ui/Avatar'
import type { Notification } from '../../types'

interface NotificationsOverlayProps {
    isOpen: boolean
    onClose: () => void
}

export function NotificationsOverlay({ isOpen, onClose }: NotificationsOverlayProps) {
    const { user } = useAuth()
    const [notifications, setNotifications] = useState<Notification[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        if (isOpen && user) load()
    }, [isOpen, user])

    const load = async () => {
        if (!user) return
        setLoading(true)
        try {
            const data = await getNotifications(user.id)
            setNotifications(data)
            await markAllNotificationsRead(user.id)
        } catch (err) {
            console.error(err)
        }
        setLoading(false)
    }

    const getIcon = (type: Notification['type']) => {
        switch (type) {
            case 'like': return <Heart size={16} className="text-red-500 fill-red-500" />
            case 'follow': return <UserPlus size={16} className="text-blue-500" />
            case 'comment': return <MessageCircle size={16} className="text-green-500" />
            default: return <Bell size={16} className="text-amber-500" />
        }
    }

    if (!isOpen) return null


    return (
        <div className="fixed inset-0 z-[60] bg-black/50 backdrop-blur-sm flex items-start justify-center pt-20 lg:pt-24 px-4 animate-fade-in">
            <div className="bg-[#f0ebe3] w-full max-w-md rounded-2xl shadow-clay-lg overflow-hidden flex flex-col max-h-[70vh]">
                {/* Header */}
                <div className="p-4 border-b border-surface-200 flex items-center justify-between">
                    <h3 className="font-bold text-surface-800">Notifications</h3>
                    <button onClick={onClose} className="p-1 rounded-full hover:bg-surface-200 text-surface-500 transition-colors">
                        <X size={20} />
                    </button>
                </div>

                {/* List */}
                <div className="overflow-y-auto flex-1 p-2">
                    {loading ? (
                        <div className="p-8 text-center text-surface-400 text-sm">Loading...</div>
                    ) : notifications.length > 0 ? (
                        <div className="space-y-1">
                            {notifications.map(n => {
                                const linkTo = n.type === 'follow' ? `/profile/${n.actor_id}` : `/profile/${user?.id}` // Default fallback

                                return (
                                    <Link
                                        key={n.id}
                                        to={linkTo}
                                        onClick={() => {
                                            if (!n.is_read) markNotificationRead(n.id)
                                            onClose()
                                        }}
                                        className={`flex gap-3 p-3 rounded-[var(--radius-clay-sm)] transition-colors ${!n.is_read ? 'bg-primary-50' : 'hover:bg-white/50'}`}
                                    >
                                        <div className="relative">
                                            <Avatar src={n.actor?.avatar_url} name={n.actor?.full_name} size="md" />
                                            <div className="absolute -bottom-1 -right-1 p-0.5 bg-[#f0ebe3] rounded-full">
                                                {getIcon(n.type)}
                                            </div>
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm text-surface-800">
                                                <span className="font-bold">{n.actor?.full_name}</span> {n.message}
                                            </p>
                                            <p className="text-xs text-surface-400 mt-0.5">
                                                {new Date(n.created_at).toLocaleDateString()}
                                            </p>
                                        </div>
                                    </Link>
                                )
                            })}
                        </div>
                    ) : (
                        <div className="p-8 text-center text-surface-400 text-sm flex flex-col items-center gap-2">
                            <Bell size={24} className="text-surface-300" />
                            <p>No notifications yet</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
