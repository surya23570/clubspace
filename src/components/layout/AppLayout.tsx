
import { useState } from 'react'
import { Outlet } from 'react-router-dom'
import { Sidebar } from './Sidebar'
import { RightSidebar } from './RightSidebar'
import { TopBar } from './TopBar'
import { SearchOverlay } from '../features/SearchOverlay'
import { NotificationsOverlay } from '../features/NotificationsOverlay'

export function AppLayout() {
    const [sidebarOpen, setSidebarOpen] = useState(false)
    const [searchOpen, setSearchOpen] = useState(false)
    const [notificationsOpen, setNotificationsOpen] = useState(false)

    // Close sidebar on route change
    const handleNavClick = () => setSidebarOpen(false)

    return (
        <div className="min-h-screen">
            {/* Mobile top bar */}
            <TopBar
                onMenuClick={() => setSidebarOpen(prev => !prev)}
                onSearchClick={() => setSearchOpen(true)}
                onNotificationsClick={() => setNotificationsOpen(true)}
            />

            {/* Overlays */}
            <SearchOverlay isOpen={searchOpen} onClose={() => setSearchOpen(false)} />
            <NotificationsOverlay isOpen={notificationsOpen} onClose={() => setNotificationsOpen(false)} />

            {/* Mobile sidebar overlay */}
            {sidebarOpen && (
                <div
                    className="lg:hidden fixed inset-0 bg-black/30 backdrop-blur-sm z-40"
                    onClick={() => setSidebarOpen(false)}
                />
            )}

            <div className="flex justify-center">
                <div className="flex w-full max-w-[1280px]">
                    {/* Left Sidebar — always visible on lg+, toggle on mobile */}
                    <Sidebar mobileOpen={sidebarOpen} onNavClick={handleNavClick} />

                    {/* Main Feed */}
                    <main className="flex-1 min-w-0 px-4 py-5 pb-6 lg:pb-6 lg:px-6">
                        <div className="max-w-[640px] mx-auto">
                            <Outlet />
                        </div>
                    </main>

                    {/* Right Sidebar — hidden on tablet and below */}
                    <RightSidebar />
                </div>
            </div>

        </div>
    )
}
