import { useState, useEffect, useRef } from 'react'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabase'
import {
    getConversations, getOrCreateConversation,
    getMessages, sendMessage, markMessagesRead,
    getAllProfiles, acceptMessageRequest, deleteConversation, blockUser,
    uploadMessageMedia, getProfile
} from '../lib/api'
import { Link, useSearchParams } from 'react-router-dom'
import { Avatar } from '../components/ui/Avatar'
import { Button } from '../components/ui/Button'
import { Modal } from '../components/ui/Modal'
import type { Conversation, Message, Profile } from '../types'
import { Send, Search, ArrowLeft, Plus, MessageCircle, Check, CheckCheck, Image as ImageIcon, Shield, Trash2 } from 'lucide-react'

export function MessagesPage() {
    const { user } = useAuth()
    const [activeTab, setActiveTab] = useState<'active' | 'request'>('active')
    const [conversations, setConversations] = useState<Conversation[]>([])
    const [activeConvo, setActiveConvo] = useState<Conversation | null>(null)
    const [messages, setMessages] = useState<Message[]>([])
    const [msgInput, setMsgInput] = useState('')
    const [loading, setLoading] = useState(true)
    const [sending, setSending] = useState(false)
    const [isUploading, setIsUploading] = useState(false)
    const [showNewChat, setShowNewChat] = useState(false)
    const [allUsers, setAllUsers] = useState<Profile[]>([])
    const [searchQuery, setSearchQuery] = useState('')
    const [searchConvo, setSearchConvo] = useState('')
    const [sendError, setSendError] = useState<string | null>(null)
    const [showDiagnostics, setShowDiagnostics] = useState(false)
    const messagesEndRef = useRef<HTMLDivElement>(null)
    const fileInputRef = useRef<HTMLInputElement>(null)

    const [searchParams, setSearchParams] = useSearchParams()

    useEffect(() => {
        if (user) loadConversations()
    }, [user, activeTab])

    // Handle deep linking from Profile
    useEffect(() => {
        const initChat = async () => {
            const targetId = searchParams.get('userId')
            if (!targetId || !user) return

            // Check if we already have this conversation loaded
            const existing = conversations.find(c =>
                c.participant_1 === targetId || c.participant_2 === targetId
            )

            if (existing) {
                openConversation(existing)
                setSearchParams({}) // Clear param
            } else {
                // Fetch profile and start new chat
                try {
                    const profile = await getProfile(targetId)
                    if (profile) {
                        await startNewChat(profile)
                        setSearchParams({})
                    }
                } catch (err) {
                    console.error("Failed to load profile for chat", err)
                }
            }
        }

        if (user && conversations.length > 0) {
            initChat()
        } else if (user && !loading && conversations.length === 0) {
            // Try anyway if no conversations yet
            initChat()
        }
    }, [searchParams, user, conversations.length, loading])

    // ... (rest of useEffects)

    // ... (loadConversations, openConversation)

    const handleSend = async () => {
        if ((!msgInput.trim() && !fileInputRef.current?.files?.length) || !activeConvo || !user || sending) return

        setSending(true)
        setSendError(null)
        try {
            // Check for file
            if (fileInputRef.current?.files?.length) {
                setIsUploading(true)
                const file = fileInputRef.current.files[0]
                const publicUrl = await uploadMessageMedia(file)
                const type = file.type.startsWith('image/') ? 'image' : file.type.startsWith('video/') ? 'video' : 'text'

                const sentMsg = await sendMessage(activeConvo.id, user.id, msgInput || (type === 'image' ? 'Sent an image' : 'Sent a video'), type, publicUrl)

                fileInputRef.current.value = '' // Reset
                setIsUploading(false)

                // Immediate update
                setMessages(prev => {
                    if (prev.find(m => m.id === sentMsg.id)) return prev
                    return [...prev, sentMsg]
                })
            } else {
                const sentMsg = await sendMessage(activeConvo.id, user.id, msgInput.trim(), 'text')

                // Immediate update
                setMessages(prev => {
                    if (prev.find(m => m.id === sentMsg.id)) return prev
                    return [...prev, sentMsg]
                })
            }

            setMsgInput('')

            // Update last message locally
            setConversations(prev => prev.map(c =>
                c.id === activeConvo.id
                    ? { ...c, last_message: msgInput || 'Sent a file', last_message_at: new Date().toISOString() }
                    : c
            ))
        } catch (err: any) {
            console.error("Failed to send message:", err)
            setSendError(err.message || "Failed to send")
        }
        setSending(false)
        setIsUploading(false)
    }

    const handleFileSelect = () => {
        fileInputRef.current?.click()
    }

    // Real-time subscription for new messages
    useEffect(() => {
        if (!activeConvo) return

        const channel = supabase
            .channel(`messages:${activeConvo.id}`)
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'messages',
                    filter: `conversation_id=eq.${activeConvo.id}`,
                },
                (payload) => {
                    const newMsg = payload.new as Message
                    setMessages(prev => {
                        if (prev.find(m => m.id === newMsg.id)) return prev
                        return [...prev, newMsg]
                    })
                    scrollToBottom()
                    // Mark as read if it's not from us
                    if (newMsg.sender_id !== user?.id) {
                        markMessagesRead(activeConvo.id, user!.id)
                    }
                }
            )
            .subscribe()

        return () => {
            supabase.removeChannel(channel)
        }
    }, [activeConvo?.id])

    const loadConversations = async () => {
        if (!user) return
        setLoading(true)
        try {
            const data = await getConversations(user.id, activeTab)
            setConversations(data)
        } catch { /* silent */ }
        setLoading(false)
    }

    const openConversation = async (convo: Conversation) => {
        setActiveConvo(convo)
        try {
            const msgs = await getMessages(convo.id)
            setMessages(msgs)
            if (user) await markMessagesRead(convo.id, user.id)
            // Update unread count locally
            setConversations(prev => prev.map(c =>
                c.id === convo.id ? { ...c, unread_count: 0 } : c
            ))
            setTimeout(scrollToBottom, 100)
        } catch { /* silent */ }
    }



    // Handle Request Actions
    const handleAccept = async () => {
        if (!activeConvo) return
        try {
            await acceptMessageRequest(activeConvo.id)
            setActiveTab('active') // Switch to active tab
            loadConversations() // Reload to move convo
        } catch (err) { console.error(err) }
    }

    const handleDelete = async () => {
        if (!activeConvo || !user) return
        if (!confirm('Delete this conversation? It will be removed from your inbox.')) return
        try {
            await deleteConversation(activeConvo.id, user.id)
            setActiveConvo(null)
            loadConversations()
        } catch (err) { console.error(err) }
    }

    const handleBlock = async () => {
        if (!activeConvo || !user || !activeConvo.other_profile) return
        if (!confirm('Block this user?')) return
        try {
            await blockUser(user.id, activeConvo.other_profile.id)
            setActiveConvo(null)
            loadConversations()
        } catch (err) { console.error(err) }
    }


    const startNewChat = async (otherUser: Profile) => {
        if (!user) return
        try {
            const convo = await getOrCreateConversation(user.id, otherUser.id)
            convo.other_profile = otherUser
            setShowNewChat(false)
            setActiveTab(convo.status) // Switch tab if it's a request
            await loadConversations()
            openConversation(convo)
        } catch (err) {
            console.error("Failed to start new chat:", err)
        }
    }

    const openNewChatModal = async () => {
        setShowNewChat(true)
        try {
            const users = await getAllProfiles()
            setAllUsers(users.filter(u => u.id !== user?.id))
        } catch { /* silent */ }
    }

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }

    const formatTime = (dateStr: string) => {
        const d = new Date(dateStr)
        const now = new Date()
        const diff = now.getTime() - d.getTime()
        if (diff < 60000) return 'now'
        if (diff < 3600000) return `${Math.floor(diff / 60000)}m`
        if (diff < 86400000) return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        if (diff < 604800000) return d.toLocaleDateString([], { weekday: 'short' })
        return d.toLocaleDateString([], { month: 'short', day: 'numeric' })
    }

    const filteredConversations = conversations.filter(c => {
        if (!searchConvo) return true
        return c.other_profile?.full_name?.toLowerCase().includes(searchConvo.toLowerCase())
    })

    const filteredUsers = allUsers.filter(u => {
        if (!searchQuery) return true
        return u.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            u.email.toLowerCase().includes(searchQuery.toLowerCase())
    })

    // Render Message Content
    const renderMessageContent = (msg: Message) => {
        switch (msg.type) {
            case 'image':
                return <img src={msg.media_url} alt="Shared image" className="rounded-[var(--radius-clay-sm)] max-w-full max-h-[300px] object-cover" />
            case 'video':
                return (
                    <video controls className="rounded-[var(--radius-clay-sm)] max-w-full max-h-[300px]">
                        <source src={msg.media_url} />
                    </video>
                )
            default:
                return msg.content
        }
    }

    return (
        <div className="animate-fade-in -mx-4 lg:-mx-6 -my-5 lg:-my-6">
            <div className="flex h-[calc(100vh-80px)] lg:h-[calc(100vh-48px)]">
                {/* Conversation List */}
                <div className={`
          ${activeConvo ? 'hidden md:flex' : 'flex'}
          flex-col w-full md:w-[320px] border-r border-surface-200/50
        `}>
                    {/* List Header */}
                    <div className="p-4 flex items-center justify-between">
                        <h1 className="text-xl font-bold text-surface-800">Messages</h1>
                        <button
                            onClick={openNewChatModal}
                            className="p-2.5 rounded-[var(--radius-clay-sm)] shadow-clay-sm bg-[#f7f4f0] text-primary-500 hover:-translate-y-0.5 transition-all cursor-pointer"
                        >
                            <Plus size={18} />
                        </button>
                    </div>

                    {/* Tabs */}
                    <div className="px-4 pb-2 flex gap-4 text-sm font-semibold border-b border-surface-200/50 mx-4 mb-2">
                        <button
                            className={`pb-2 transition-colors ${activeTab === 'active' ? 'text-primary-600 border-b-2 border-primary-500' : 'text-surface-400 hover:text-surface-600'}`}
                            onClick={() => { setActiveTab('active'); setActiveConvo(null); }}
                        >
                            Primary
                        </button>
                        <button
                            className={`pb-2 transition-colors ${activeTab === 'request' ? 'text-primary-600 border-b-2 border-primary-500' : 'text-surface-400 hover:text-surface-600'}`}
                            onClick={() => { setActiveTab('request'); setActiveConvo(null); }}
                        >
                            Requests
                        </button>
                    </div>

                    {/* Search */}
                    <div className="px-4 pb-3">
                        <div className="clay-inset flex items-center gap-2 px-3 py-2.5">
                            <Search size={14} className="text-surface-400 shrink-0" />
                            <input
                                value={searchConvo}
                                onChange={e => setSearchConvo(e.target.value)}
                                placeholder="Search conversations…"
                                className="flex-1 bg-transparent text-sm text-surface-800 placeholder:text-surface-400 focus:outline-none"
                            />
                        </div>
                    </div>

                    {/* Conversations */}
                    <div className="flex-1 overflow-y-auto">
                        {loading ? (
                            <div className="space-y-2 px-3">
                                {[1, 2, 3, 4].map(i => (
                                    <div key={i} className="flex items-center gap-3 p-3">
                                        <div className="w-11 h-11 skeleton rounded-full" />
                                        <div className="flex-1 space-y-2">
                                            <div className="h-3 w-24 skeleton" />
                                            <div className="h-2.5 w-40 skeleton" />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : filteredConversations.length === 0 ? (
                            <div className="text-center px-6 py-16">
                                <div className="w-16 h-16 mx-auto rounded-full bg-surface-200 flex items-center justify-center mb-3">
                                    <MessageCircle size={24} className="text-surface-400" />
                                </div>
                                <p className="font-semibold text-surface-600 text-sm">
                                    {activeTab === 'active' ? 'No messages yet' : 'No message requests'}
                                </p>
                                <p className="text-xs text-surface-400 mt-1">
                                    {activeTab === 'active' ? 'Start a conversation!' : 'Requests from non-followers appear here.'}
                                </p>
                                {activeTab === 'active' && (
                                    <Button
                                        variant="primary"
                                        size="sm"
                                        className="mt-4"
                                        onClick={openNewChatModal}
                                        icon={<Plus size={14} />}
                                    >
                                        New Chat
                                    </Button>
                                )}
                            </div>
                        ) : (
                            filteredConversations.map(convo => (
                                <button
                                    key={convo.id}
                                    onClick={() => openConversation(convo)}
                                    className={`
                    w-full flex items-center gap-3 px-4 py-3 text-left transition-all cursor-pointer
                    ${activeConvo?.id === convo.id ? 'bg-primary-50' : 'hover:bg-surface-100/50'}
                  `}
                                >
                                    <div className="relative">
                                        <Avatar src={convo.other_profile?.avatar_url} name={convo.other_profile?.full_name} size="md" />
                                        {(convo.unread_count || 0) > 0 && (
                                            <span className="absolute -top-1 -right-1 w-5 h-5 bg-primary-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                                                {convo.unread_count}
                                            </span>
                                        )}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center justify-between">
                                            <p className={`text-sm truncate ${(convo.unread_count || 0) > 0 ? 'font-bold text-surface-800' : 'font-medium text-surface-700'}`}>
                                                {convo.other_profile?.full_name || 'User'}
                                            </p>
                                            <span className="text-[10px] text-surface-400 shrink-0 ml-2">
                                                {formatTime(convo.last_message_at)}
                                            </span>
                                        </div>
                                        <p className={`text-xs truncate mt-0.5 ${(convo.unread_count || 0) > 0 ? 'text-surface-600 font-medium' : 'text-surface-400'}`}>
                                            {convo.last_message || 'No messages yet'}
                                        </p>
                                    </div>
                                </button>
                            ))
                        )}
                    </div>
                </div>

                {/* Chat View */}
                <div className={`
          ${activeConvo ? 'flex' : 'hidden md:flex'}
          flex-col flex-1 relative
        `}>
                    {activeConvo ? (
                        <>
                            {/* Chat Header */}
                            <div className="flex items-center gap-3 p-4 border-b border-surface-200/50">
                                <button
                                    onClick={() => setActiveConvo(null)}
                                    className="md:hidden p-1.5 rounded-full hover:bg-surface-200 text-surface-500 cursor-pointer"
                                >
                                    <ArrowLeft size={18} />
                                </button>
                                <Link to={`/profile/${activeConvo.other_profile?.id}`} className="hover:opacity-80 transition-opacity">
                                    <Avatar
                                        src={activeConvo.other_profile?.avatar_url}
                                        name={activeConvo.other_profile?.full_name}
                                        size="sm"
                                    />
                                </Link>
                                <div className="flex-1 min-w-0">
                                    <Link to={`/profile/${activeConvo.other_profile?.id}`} className="hover:underline decoration-surface-400/50 underline-offset-2">
                                        <p className="text-sm font-bold text-surface-800">{activeConvo.other_profile?.full_name || 'User'}</p>
                                    </Link>
                                    <p className="text-[10px] text-surface-400">
                                        {activeTab === 'request' ? 'Request' : 'Active'}
                                    </p>
                                </div>
                                <div className="flex gap-2">
                                    <button
                                        className="p-2 text-surface-400 hover:text-red-500 transition-colors"
                                        onClick={handleBlock}
                                        title="Block"
                                    >
                                        <Shield size={18} />
                                    </button>
                                    <button
                                        className="p-2 text-surface-400 hover:text-red-500 transition-colors"
                                        onClick={handleDelete}
                                        title="Delete Chat"
                                    >
                                        <Trash2 size={18} />
                                    </button>
                                </div>
                            </div>

                            {/* Request Banner */}
                            {activeTab === 'request' && (
                                <div className="bg-surface-100 p-4 border-b border-surface-200 text-center">
                                    <p className="text-sm text-surface-600 mb-3">
                                        {activeConvo.other_profile?.full_name} wants to send you a message.
                                        <br />
                                        They won't know you've seen this until you accept.
                                    </p>
                                    <div className="flex justify-center gap-3">
                                        <Button variant="secondary" size="sm" onClick={handleDelete}>Delete</Button>
                                        <Button variant="primary" size="sm" onClick={handleAccept}>Accept</Button>
                                    </div>
                                </div>
                            )}

                            {/* Messages */}
                            <div className="flex-1 overflow-y-auto px-4 py-4 space-y-2">
                                {messages.length === 0 ? (
                                    <div className="text-center py-16">
                                        <p className="text-sm text-surface-400">Start the conversation! 👋</p>
                                    </div>
                                ) : (
                                    messages.map((msg, i) => {
                                        const isMe = msg.sender_id === user?.id
                                        const showAvatar = !isMe && (i === 0 || messages[i - 1].sender_id !== msg.sender_id)
                                        return (
                                            <div
                                                key={msg.id}
                                                className={`flex items-end gap-2 ${isMe ? 'justify-end' : 'justify-start'}`}
                                            >
                                                {!isMe && (
                                                    <div className="w-7 shrink-0">
                                                        {showAvatar && (
                                                            <Avatar
                                                                src={activeConvo.other_profile?.avatar_url}
                                                                name={activeConvo.other_profile?.full_name}
                                                                size="xs"
                                                            />
                                                        )}
                                                    </div>
                                                )}
                                                <div className={`
                          max-w-[75%] px-4 py-2.5 text-sm leading-relaxed
                          ${isMe
                                                        ? 'bg-primary-500 text-white rounded-[18px] rounded-br-[6px]'
                                                        : 'clay-sm rounded-[18px] rounded-bl-[6px] text-surface-800'
                                                    }
                        `}>
                                                    {renderMessageContent(msg)}
                                                    <div className={`flex items-center gap-1 mt-1 ${isMe ? 'justify-end' : ''}`}>
                                                        <span className={`text-[9px] ${isMe ? 'text-white/60' : 'text-surface-400'}`}>
                                                            {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                        </span>
                                                        {isMe && (
                                                            msg.is_read
                                                                ? <CheckCheck size={10} className="text-white/60" />
                                                                : <Check size={10} className="text-white/60" />
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        )
                                    })
                                )}
                                <div ref={messagesEndRef} />
                            </div>

                            {/* Input - Only show if active tab or user is sender? */}
                            {/* Actually, Instagram allows reply to request which accepts it? No, usually blocked. */}
                            {/* We will hide input if request tab, unless accepted. */}
                            {activeTab === 'active' && (
                                <div className="p-4 border-t border-surface-200/50">
                                    {sendError && (
                                        <div className="mb-2 px-3 py-2 bg-red-50 text-red-600 text-xs rounded-lg flex items-center justify-between">
                                            <span>{sendError}</span>
                                            <button type="button" onClick={() => setSendError(null)} className="font-bold hover:underline">Dismiss</button>
                                        </div>
                                    )}
                                    <form
                                        onSubmit={(e) => { e.preventDefault(); handleSend() }}
                                        className="clay flex items-center gap-2 px-4 py-2"
                                    >
                                        <button
                                            type="button"
                                            className="text-surface-400 hover:text-primary-500 p-1 mr-1"
                                            onClick={() => setShowDiagnostics(true)}
                                            title="Troubleshoot"
                                        >
                                            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                                        </button>
                                        <button
                                            type="button"
                                            className="text-primary-400 hover:text-primary-600 p-1"
                                            onClick={handleFileSelect}
                                        >
                                            <ImageIcon size={20} />
                                        </button>
                                        <input
                                            type="file"
                                            ref={fileInputRef}
                                            className="hidden"
                                            accept="image/*,video/*"
                                            onChange={() => handleSend()} // Auto send on select? Or just select?
                                        />
                                        <input
                                            value={msgInput}
                                            onChange={e => setMsgInput(e.target.value)}
                                            placeholder="Type a message…"
                                            className="flex-1 bg-transparent text-sm text-surface-800 placeholder:text-surface-400 focus:outline-none py-1.5"
                                            autoFocus
                                        />
                                        <button
                                            type="submit"
                                            disabled={(!msgInput.trim() && !fileInputRef.current?.files?.length) || sending || isUploading}
                                            className="p-2.5 rounded-full bg-primary-500 text-white shadow-clay-button hover:-translate-y-0.5 transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                                        >
                                            <Send size={14} />
                                        </button>
                                    </form>
                                </div>
                            )}
                        </>
                    ) : (
                        <div className="flex-1 flex items-center justify-center">
                            <div className="text-center">
                                <div className="w-20 h-20 mx-auto rounded-full bg-surface-200 flex items-center justify-center mb-4">
                                    <MessageCircle size={32} className="text-surface-400" />
                                </div>
                                <p className="font-bold text-surface-700 text-lg">Select a conversation</p>
                                <p className="text-sm text-surface-400 mt-1">or start a new one</p>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* New Chat Modal */}
            <Modal isOpen={showNewChat} onClose={() => setShowNewChat(false)} title="New Conversation" size="md">
                <div className="space-y-4">
                    <div className="clay-inset flex items-center gap-2 px-3 py-2.5">
                        <Search size={14} className="text-surface-400" />
                        <input
                            value={searchQuery}
                            onChange={e => setSearchQuery(e.target.value)}
                            placeholder="Search by name or email…"
                            className="flex-1 bg-transparent text-sm text-surface-800 placeholder:text-surface-400 focus:outline-none"
                            autoFocus
                        />
                    </div>

                    <div className="max-h-[300px] overflow-y-auto space-y-1">
                        {filteredUsers.length === 0 ? (
                            <p className="text-sm text-surface-400 text-center py-8">No users found</p>
                        ) : (
                            filteredUsers.map(u => (
                                <button
                                    key={u.id}
                                    onClick={() => startNewChat(u)}
                                    className="w-full flex items-center gap-3 p-3 rounded-[var(--radius-clay-sm)] hover:bg-surface-100 transition-colors cursor-pointer text-left"
                                >
                                    <Avatar src={u.avatar_url} name={u.full_name} size="sm" />
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-semibold text-surface-700">{u.full_name}</p>
                                        <p className="text-xs text-surface-400 truncate">{u.email}</p>
                                    </div>
                                    <span className="text-[10px] text-surface-300 font-medium">{u.department || ''}</span>
                                </button>
                            ))
                        )}
                    </div>
                </div>
            </Modal>

            <Modal isOpen={showDiagnostics} onClose={() => setShowDiagnostics(false)} title="Messaging Diagnostics" size="md">
                <MessageDiagnostics user={user} activeConvo={activeConvo} />
            </Modal>
        </div>
    )
}

function MessageDiagnostics({ user, activeConvo }: { user: any, activeConvo: Conversation | null }) {
    const [status, setStatus] = useState<string>('Idle')
    const [logs, setLogs] = useState<string[]>([])

    const addLog = (msg: string) => setLogs(prev => [...prev, `${new Date().toLocaleTimeString()}: ${msg}`])

    const runTests = async () => {
        setLogs([])
        setStatus('Running...')
        addLog('Starting diagnostics...')

        if (!user) {
            addLog('❌ No authenticated user found.')
            setStatus('Failed')
            return
        }
        addLog(`✅ User ID: ${user.id}`)

        if (!activeConvo) {
            addLog('⚠️ No active conversation selected. Skipping specific tests.')
        } else {
            addLog(`✅ Active Conversation ID: ${activeConvo.id}`)
            addLog(`ℹ️ Participants: ${activeConvo.participant_1}, ${activeConvo.participant_2}`)
        }

        // Test 1: Check Connection
        try {
            const { error } = await supabase.from('profiles').select('count', { count: 'exact', head: true }).limit(1)
            if (error) throw error
            addLog('✅ Database Connection: OK')
        } catch (err: any) {
            addLog(`❌ Database Connection Failed: ${err.message}`)
        }

        // Test 2: Check Realtime
        const channels = supabase.getChannels()
        addLog(`ℹ️ Active Realtime Channels: ${channels.length}`)
        channels.forEach(ch => addLog(`   - ${ch.topic}: ${ch.state}`))

        // Test 3: Insert Test (if active convo)
        if (activeConvo) {
            try {
                // Check if we can SELECT messages
                const { error: msgError } = await getMessages(activeConvo.id)
                if (msgError) addLog(`❌ Fetch Messages Error: ${msgError.message}`)
                else addLog('✅ Read Messages Permission: OK')
            } catch (err: any) {
                addLog(`❌ Permission Check Failed: ${err.message}`)
            }
        }

        setStatus('Complete')
    }

    return (
        <div className="space-y-4">
            <div className="bg-surface-100 p-3 rounded-lg text-xs font-mono max-h-[200px] overflow-y-auto text-surface-800">
                {logs.length === 0 ? 'Ready to run diagnostics...' : logs.map((l, i) => <div key={i}>{l}</div>)}
            </div>
            <div className="flex justify-end gap-2">
                <Button variant="secondary" size="sm" onClick={() => navigator.clipboard.writeText(logs.join('\n'))}>Copy Logs</Button>
                <Button variant="primary" size="sm" onClick={runTests}>{status === 'Running...' ? 'Running...' : 'Run Tests'}</Button>
            </div>
        </div>
    )
}
