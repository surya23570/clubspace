
import { Menu, Bell, Search } from 'lucide-react'
import { useNotifications } from '../../context/NotificationContext'

interface TopBarProps {
    onMenuClick: () => void
    onSearchClick: () => void
    onNotificationsClick: () => void
}

export function TopBar({ onMenuClick, onSearchClick, onNotificationsClick }: TopBarProps) {
    const { unreadCount } = useNotifications()

    return (
        <header className="lg:hidden sticky top-0 z-40 bg-[#f0ebe3]/90 backdrop-blur-lg pt-8">
            <div className="flex items-center justify-between px-4 pb-3 pt-2">
                <button
                    onClick={onMenuClick}
                    aria-label="Open menu"
                    className="p-2 rounded-[var(--radius-clay-sm)] shadow-clay-sm bg-[#f7f4f0] text-surface-600 cursor-pointer hover:text-primary-500 transition-colors"
                >
                    <Menu size={20} />
                </button>
                <h1 className="text-xl font-bold text-surface-800 tracking-tight">ClubSpace</h1>
                <div className="flex items-center gap-3">
                    <button
                        onClick={onSearchClick}
                        aria-label="Search"
                        className="p-2 rounded-[var(--radius-clay-sm)] shadow-clay-sm bg-[#f7f4f0] text-surface-600 cursor-pointer hover:text-primary-500 transition-colors"
                    >
                        <Search size={20} />
                    </button>
                    <button
                        onClick={onNotificationsClick}
                        aria-label="Notifications"
                        className="p-2 rounded-[var(--radius-clay-sm)] shadow-clay-sm bg-[#f7f4f0] text-surface-600 cursor-pointer relative hover:text-primary-500 transition-colors"
                    >
                        <Bell size={20} />
                        {unreadCount > 0 && (
                            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-accent-500 rounded-full border border-[#f0ebe3]" />
                        )}
                    </button>
                </div>
            </div>
        </header>
    )
}
