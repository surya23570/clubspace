import { NavLink } from 'react-router-dom'
import { Home, TrendingUp, User, Shield, MessageCircle, Image, Settings } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'

export function MobileNav() {
    const { isAdmin } = useAuth()

    const items = [
        { path: '/', icon: Home, label: 'Feed' },
        { path: '/profile', icon: User, label: 'Profile' },
        { path: '/leaderboard', icon: TrendingUp, label: 'Explore' },
        { path: '/messages', icon: MessageCircle, label: 'Messages' },
        { path: '/gallery', icon: Image, label: 'Gallery' },
        { path: '/settings', icon: Settings, label: 'Settings' },
    ]

    if (isAdmin) {
        items.push({ path: '/admin', icon: Shield, label: 'Admin' })
    }

    return (
        <nav className="lg:hidden fixed bottom-4 left-4 right-4 z-40">
            <div className="clay-lg flex items-center justify-around px-3 py-2 relative">
                {items.map(({ path, icon: Icon, label }) => (
                    <NavLink
                        key={path}
                        to={path}
                        end={path === '/'}
                        aria-label={label}
                        className={({ isActive }) =>
                            `flex flex-col items-center gap-0.5 py-2 px-3 rounded-[var(--radius-clay-sm)] transition-all duration-200 ${isActive
                                ? 'text-primary-500'
                                : 'text-surface-400 hover:text-surface-600'
                            }`
                        }
                    >
                        <Icon size={20} />
                        <span className="text-[10px] font-semibold">{label}</span>
                    </NavLink>
                ))}
            </div>
        </nav>
    )
}
