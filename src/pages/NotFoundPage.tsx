import { Link } from 'react-router-dom'
import { Home, SearchX } from 'lucide-react'
import { usePageTitle } from '../hooks/usePageTitle'

export function NotFoundPage() {
    usePageTitle('Page Not Found')

    return (
        <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden">
            {/* Background Blobs */}
            <div className="absolute top-20 -left-20 w-72 h-72 bg-primary-200/40 rounded-full blur-3xl animate-blob" />
            <div className="absolute bottom-20 -right-20 w-80 h-80 bg-accent-400/30 rounded-full blur-3xl animate-blob" style={{ animationDelay: '2s' }} />

            <div className="w-full max-w-md clay-lg p-10 text-center animate-scale-in relative z-10">
                <div className="inline-flex items-center justify-center w-20 h-20 rounded-[var(--radius-clay)] bg-surface-200 mb-6">
                    <SearchX size={36} className="text-surface-400" />
                </div>
                <h1 className="text-6xl font-bold text-surface-800 mb-2">404</h1>
                <p className="text-lg font-semibold text-surface-600 mb-1">Page not found</p>
                <p className="text-sm text-surface-400 mb-8">
                    The page you're looking for doesn't exist or has been moved.
                </p>
                <Link
                    to="/"
                    className="inline-flex items-center gap-2 bg-primary-500 text-white px-6 py-3 rounded-[var(--radius-pill)] shadow-clay-button hover:-translate-y-0.5 transition-all font-semibold text-sm"
                >
                    <Home size={16} />
                    Go Home
                </Link>
            </div>
        </div>
    )
}
