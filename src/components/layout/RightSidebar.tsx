export function RightSidebar() {
    return (
        <aside className="hidden xl:flex flex-col w-[280px] min-h-screen p-5 gap-5 sticky top-0 h-screen overflow-y-auto">
            {/* Trending Tags */}
            <div className="clay p-4">
                <h3 className="text-sm font-bold text-surface-700 mb-3">Trending</h3>
                <div className="flex flex-wrap gap-2">
                    {['#photography', '#design', '#creative', '#art', '#music', '#video'].map(tag => (
                        <span
                            key={tag}
                            className="clay-sm text-[11px] font-medium text-surface-600 px-3 py-1.5 cursor-pointer hover:text-primary-500 transition-colors"
                        >
                            {tag}
                        </span>
                    ))}
                </div>
            </div>
        </aside>
    )
}
