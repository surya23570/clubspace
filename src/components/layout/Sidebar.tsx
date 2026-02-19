import { NavLink } from 'react-router-dom'
import {
    Home, MessageCircle, Users, Image, Settings,
    Shield, LogOut, Compass, X,
} from 'lucide-react'
import { Avatar } from '../ui/Avatar'
import { useAuth } from '../../context/AuthContext'

interface SidebarProps {
    mobileOpen?: boolean
    onNavClick?: () => void
}

export function Sidebar({ mobileOpen, onNavClick }: SidebarProps) {
    const { profile, signOut, isAdmin } = useAuth()

    const navItems = [
        { path: '/', icon: Home, label: 'Feed' },
        { path: '/messages', icon: MessageCircle, label: 'Messages' },
        { path: '/leaderboard', icon: Compass, label: 'Explore' },
        { path: '/profile', icon: Users, label: 'Profile' },
        { path: '/gallery', icon: Image, label: 'Gallery' },
        { path: '/settings', icon: Settings, label: 'Settings' },
    ]

    if (isAdmin) {
        navItems.push({ path: '/admin', icon: Shield, label: 'Admin' })
    }

    return (
        <aside className={`
            ${mobileOpen
                ? 'fixed inset-y-0 left-0 z-50 flex animate-fade-in-up'
                : 'hidden lg:flex'
            }
            flex-col w-[260px] min-h-screen p-5 gap-5 bg-[var(--bg-body)] lg:sticky top-0 h-screen overflow-y-auto
        `}>
            {/* Mobile close button */}
            {mobileOpen && (
                <button
                    onClick={onNavClick}
                    className="lg:hidden self-end p-2 rounded-[var(--radius-clay-sm)] shadow-clay-sm bg-[var(--bg-clay)] text-surface-600 cursor-pointer mb-1"
                >
                    <X size={16} />
                </button>
            )}

            {/* Profile Card */}
            <div className="clay p-5 text-center">
                <div className="relative inline-block mb-3">
                    <Avatar src={profile?.avatar_url} name={profile?.full_name} size="lg" />
                    <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 bg-success rounded-full border-2 border-[var(--bg-clay)]" />
                </div>
                <p className="font-bold text-surface-800 text-sm">{profile?.full_name || 'User'}</p>
                <p className="text-[11px] text-surface-400 mt-0.5">@{profile?.full_name?.toLowerCase().replace(/\s+/g, '') || 'user'}</p>
            </div>

            {/* Navigation */}
            <nav className="clay p-3 flex-1">
                <div className="space-y-1">
                    {navItems.map(({ path, icon: Icon, label }) => (
                        <NavLink
                            key={path}
                            to={path}
                            end={path === '/'}
                            onClick={onNavClick}
                            className={({ isActive }) =>
                                `flex items-center gap-3 px-4 py-2.5 rounded-[var(--radius-clay-sm)] text-sm font-medium transition-all duration-200 ${isActive
                                    ? 'clay-pressed bg-primary-500 text-white'
                                    : 'text-surface-600 hover:bg-surface-200/50'
                                }`
                            }
                        >
                            <Icon size={18} />
                            <span>{label}</span>
                        </NavLink>
                    ))}
                </div>
            </nav>

            {/* Sign Out */}
            <button
                onClick={() => { signOut(); onNavClick?.() }}
                className="flex items-center gap-3 px-4 py-2.5 text-sm font-medium text-surface-400 hover:text-danger transition-colors cursor-pointer"
            >
                <LogOut size={18} />
                <span>Sign Out</span>
            </button>
        </aside>
    )
}
