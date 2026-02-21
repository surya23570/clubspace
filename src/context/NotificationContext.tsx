import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from './AuthContext'
import { LocalNotifications } from '@capacitor/local-notifications'
import { Capacitor } from '@capacitor/core'

interface NotificationContextType {
    unreadCount: number
    refreshNotifications: () => Promise<void>
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined)

export function NotificationProvider({ children }: { children: ReactNode }) {
    const { user } = useAuth()
    const [unreadCount, setUnreadCount] = useState(0)

    const requestPermissions = async () => {
        if (Capacitor.isNativePlatform()) {
            const result = await LocalNotifications.requestPermissions()
            if (result.display !== 'granted') {
                console.warn('Notification permissions not granted')
            }
        }
    }

    const fetchUnreadCount = async () => {
        if (!user) return
        const { count } = await supabase
            .from('notifications')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', user.id)
            .eq('is_read', false)
        setUnreadCount(count || 0)
    }

    const sendLocalNotification = async (title: string, body: string, id: number) => {
        if (!Capacitor.isNativePlatform()) {
            // Web Notification Fallback
            if (Notification.permission === 'granted') {
                new Notification(title, { body })
            } else if (Notification.permission !== 'denied') {
                Notification.requestPermission().then(permission => {
                    if (permission === 'granted') {
                        new Notification(title, { body })
                    }
                })
            }
            return
        }

        await LocalNotifications.schedule({
            notifications: [
                {
                    title,
                    body,
                    id,
                    schedule: { at: new Date(Date.now() + 100) },
                    sound: undefined,
                    attachments: undefined,
                    actionTypeId: '',
                    extra: null
                }
            ]
        })
    }

    useEffect(() => {
        if (user) {
            requestPermissions()
            fetchUnreadCount()

            // 1. Listen for new general notifications (Likes, Follows)
            const notificationChannel = supabase
                .channel('public-notifications')
                .on(
                    'postgres_changes',
                    {
                        event: 'INSERT',
                        schema: 'public',
                        table: 'notifications',
                        filter: `user_id=eq.${user.id}`
                    },
                    (payload) => {
                        const newNotif = payload.new as any
                        setUnreadCount(prev => prev + 1)
                        sendLocalNotification(newNotif.title || 'New Notification', newNotif.message, Math.floor(Math.random() * 100000))
                    }
                )
                .subscribe()

            // 2. Listen for new messages
            // Note: complex filter 'conversation_id' is hard without knowing all IDs.
            // Simplified: Listen for all messages where receiver is me (if we had receiver_id)
            // Or: Listen to all messages and filter logic.
            // Since we don't have receiver_id in messages table easily accessible for filter without RLS,
            // we rely on RLS. If RLS policies allow me to select the row, I receive the event.
            // BUT: standard Realtime with Postgres Changes respects RLS only if 'Enable RLS' is set on publication/channel, which is complex.
            // Alternative: The quick fix is listening to messages and filtering by sender != me and participating conversations.
            // For now, let's try listening to global messages (filtered by RLS on server if enabled, otherwise we filter client side).
            // Actually, best practice for chat is a separate table or ensuring 'receiver_id' exists.
            // Our Schema: Messages(conversation_id, sender_id). Conversations(p1, p2).
            // We can listen to `messages`. 

            const messageChannel = supabase
                .channel('public-messages')
                .on(
                    'postgres_changes',
                    {
                        event: 'INSERT',
                        schema: 'public',
                        table: 'messages',
                    },
                    async (payload) => {
                        const msg = payload.new as any
                        if (msg.sender_id === user.id) return // Ignore own messages

                        // Check if I am part of this conversation
                        try {
                            const { data: conversation } = await supabase
                                .from('conversations')
                                .select('participant_1, participant_2')
                                .eq('id', msg.conversation_id)
                                .single()

                            if (conversation && (conversation.participant_1 === user.id || conversation.participant_2 === user.id)) {
                                sendLocalNotification('New Message', msg.content || 'Sent an attachment', Math.floor(Math.random() * 100000))
                            }
                        } catch (e) {
                            console.error('Error checking conversation participation', e)
                        }
                    }
                )
                .subscribe()

            return () => {
                supabase.removeChannel(notificationChannel)
                supabase.removeChannel(messageChannel)
            }
        }
    }, [user])

    return (
        <NotificationContext.Provider value={{ unreadCount, refreshNotifications: fetchUnreadCount }}>
            {children}
        </NotificationContext.Provider>
    )
}

export function useNotifications() {
    const context = useContext(NotificationContext)
    if (!context) {
        throw new Error('useNotifications must be used within a NotificationProvider')
    }
    return context
}
