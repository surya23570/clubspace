import { Check, X as XIcon } from 'lucide-react'
import { Modal } from '../ui/Modal'
import { Avatar } from '../ui/Avatar'
import { Button } from '../ui/Button'
import type { Profile } from '../../types'
import { useNavigate } from 'react-router-dom'

interface UserListModalProps {
    isOpen: boolean
    onClose: () => void
    title: string
    users: Profile[]
    type: 'followers' | 'following' | 'requests'
    onAction?: (userId: string, action: 'follow' | 'unfollow' | 'accept' | 'reject' | 'remove') => void
    currentUserId: string
    isOwnProfile?: boolean
    submittingActionIds?: Set<string>
}

export function UserListModal({ isOpen, onClose, title, users, type, onAction, currentUserId, isOwnProfile, submittingActionIds }: UserListModalProps) {
    const navigate = useNavigate()

    const handleUserClick = (userId: string) => {
        navigate(`/profile/${userId}`)
        onClose()
    }

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={`${title} (${users.length})`} size="md">
            <div className="max-h-[60vh] overflow-y-auto -mx-6 px-6 space-y-4">
                {users.length === 0 ? (
                    <div className="text-center py-8 text-surface-500">
                        No users found
                    </div>
                ) : (
                    users.map(user => (
                        <div key={user.id} className="flex items-center justify-between group">
                            <div
                                className="flex items-center gap-3 cursor-pointer"
                                onClick={() => handleUserClick(user.id)}
                            >
                                <Avatar src={user.avatar_url} name={user.full_name} size="md" />
                                <div>
                                    <p className="text-sm font-semibold text-surface-800 group-hover:text-primary-600 transition-colors">
                                        {user.full_name}
                                    </p>
                                    <p className="text-xs text-surface-500">
                                        @{user.full_name.toLowerCase().replace(/\s+/g, '')}
                                    </p>
                                </div>
                            </div>

                            <div className="flex gap-2">
                                {type === 'requests' && onAction && (
                                    <>
                                        <Button
                                            size="sm"
                                            variant="primary"
                                            onClick={() => onAction(user.id, 'accept')}
                                            icon={<Check size={14} />}
                                            loading={submittingActionIds?.has(user.id)}
                                            disabled={submittingActionIds?.has(user.id)}
                                        >
                                            Accept
                                        </Button>
                                        <Button
                                            size="sm"
                                            variant="secondary"
                                            onClick={() => onAction(user.id, 'reject')}
                                            icon={<XIcon size={14} />}
                                            disabled={submittingActionIds?.has(user.id)}
                                        >
                                            Reject
                                        </Button>
                                    </>
                                )}

                                {type === 'following' && onAction && user.id !== currentUserId && isOwnProfile && (
                                    <Button
                                        size="sm"
                                        variant="ghost"
                                        className="text-surface-400 hover:text-red-500 text-xs px-2 h-7"
                                        onClick={() => onAction(user.id, 'unfollow')}
                                        loading={submittingActionIds?.has(user.id)}
                                        disabled={submittingActionIds?.has(user.id)}
                                    >
                                        Unfollow
                                    </Button>
                                )}

                                {type === 'followers' && onAction && currentUserId && isOwnProfile && (
                                    <Button
                                        size="sm"
                                        variant="ghost"
                                        className="text-surface-400 hover:text-red-500 text-xs px-2 h-7"
                                        onClick={() => onAction(user.id, 'remove')}
                                        loading={submittingActionIds?.has(user.id)}
                                        disabled={submittingActionIds?.has(user.id)}
                                    >
                                        Remove
                                    </Button>
                                )}
                            </div>
                        </div>
                    ))
                )}
            </div>
        </Modal>
    )
}
