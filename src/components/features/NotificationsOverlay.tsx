import { useEffect, useState } from 'react'
import { X, Bell, Heart, UserPlus, MessageCircle, Trash2 } from 'lucide-react'
import { Link } from 'react-router-dom'
import { motion, AnimatePresence, useMotionValue, useTransform } from 'framer-motion'
import { getNotifications, markAllNotificationsRead, markNotificationRead, deleteNotification, deleteAllNotifications } from '../../lib/api'
import { useAuth } from '../../context/AuthContext'
import { useNotifications } from '../../context/NotificationContext'
import { Avatar } from '../ui/Avatar'
import type { Notification } from '../../types'

interface NotificationsOverlayProps {
    isOpen: boolean
    onClose: () => void
}

function NotificationItem({ n, user, onClose, onDelete }: { n: Notification, user: any, onClose: () => void, onDelete: (id: string) => void }) {
    const linkTo = n.type === 'follow' ? `/profile/${n.actor_id}` : `/profile/${user?.id}`

    const getIcon = (type: Notification['type']) => {
        switch (type) {
            case 'like': return <Heart size={16} className="text-red-500 fill-red-500" />
            case 'follow': return <UserPlus size={16} className="text-blue-500" />
            case 'comment': return <MessageCircle size={16} className="text-green-500" />
            default: return <Bell size={16} className="text-amber-500" />
        }
    }

    const x = useMotionValue(0)
    const opacity = useTransform(x, [-100, -50, 0], [0, 1, 1])
    const background = useTransform(x, [-100, 0], ["rgba(239, 68, 68, 0.2)", "rgba(255, 255, 255, 0)"])

    return (
        <motion.div
            layout
            initial={{ opacity: 0, height: 0, marginBottom: 0 }}
            animate={{ opacity: 1, height: 'auto', marginBottom: 8 }}
            exit={{ opacity: 0, height: 0, marginBottom: 0 }}
            transition={{ duration: 0.2 }}
            style={{ x, opacity, background }}
            drag="x"
            dragConstraints={{ left: 0, right: 0 }}
            dragElastic={0.1}
            onDragEnd={(_, info) => {
                if (info.offset.x < -100) {
                    onDelete(n.id)
                }
            }}
            className="relative touch-pan-y"
        >
            {/* Background Delete Icon (visible when swiping) */}
            <div className="absolute inset-y-0 right-0 w-20 flex items-center justify-center text-red-500 pointer-events-none opacity-50">
                <Trash2 size={24} />
            </div>

            <Link
                to={linkTo}
                onClick={() => {
                    if (!n.is_read) markNotificationRead(n.id)
                    onClose()
                }}
                className={`flex gap-3 p-3 rounded-[var(--radius-clay-sm)] transition-colors relative z-10 bg-[#f0ebe3] ${!n.is_read ? 'bg-primary-50/50' : 'hover:bg-white/50'}`}
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
        </motion.div>
    )
}

export function NotificationsOverlay({ isOpen, onClose }: NotificationsOverlayProps) {
    const { user } = useAuth()
    const { refreshNotifications } = useNotifications()
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
            refreshNotifications()
        } catch (err) {
            console.error(err)
        }
        setLoading(false)
    }

    const handleDelete = async (id: string) => {
        // Optimistic update
        setNotifications(prev => prev.filter(n => n.id !== id))
        try {
            await deleteNotification(id)
            refreshNotifications()
        } catch (err) {
            console.error('Failed to delete notification', err)
        }
    }

    const handleClearAll = async () => {
        if (!user) return
        // Optimistic clear
        setNotifications([])
        try {
            await deleteAllNotifications(user.id)
            refreshNotifications()
        } catch (err) {
            console.error('Failed to clear notifications', err)
            load() // Revert on error
        }
    }

    if (!isOpen) return null

    return (
        <div className="fixed inset-0 z-[60] bg-black/50 backdrop-blur-sm flex items-start justify-center pt-20 lg:pt-24 px-4 animate-fade-in">
            <div className="bg-[#f0ebe3] w-full max-w-md rounded-2xl shadow-clay-lg overflow-hidden flex flex-col max-h-[70vh]">
                {/* Header */}
                <div className="p-4 border-b border-surface-200 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <h3 className="font-bold text-surface-800">Notifications</h3>
                        {notifications.length > 0 && (
                            <button
                                onClick={handleClearAll}
                                className="text-xs text-red-500 hover:text-red-700 font-medium px-2 py-1 rounded-full hover:bg-red-50 transition-colors"
                            >
                                Clear All
                            </button>
                        )}
                    </div>
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
                            <AnimatePresence mode='popLayout'>
                                {notifications.map(n => (
                                    <NotificationItem
                                        key={n.id}
                                        n={n}
                                        user={user}
                                        onClose={onClose}
                                        onDelete={handleDelete}
                                    />
                                ))}
                            </AnimatePresence>
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
