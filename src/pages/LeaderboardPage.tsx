import { useState, useEffect } from 'react'
import { getLeaderboard } from '../lib/api'
import { Card } from '../components/ui/Card'
import { Avatar } from '../components/ui/Avatar'
import type { LeaderboardEntry } from '../types'
import { Trophy, Crown, ChevronLeft, ChevronRight } from 'lucide-react'

export function LeaderboardPage() {
    const [entries, setEntries] = useState<LeaderboardEntry[]>([])
    const [loading, setLoading] = useState(true)
    const [month, setMonth] = useState(() => {
        const now = new Date()
        return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
    })

    useEffect(() => { loadLeaderboard() }, [month])

    const loadLeaderboard = async () => {
        setLoading(true)
        try {
            const [year, m] = month.split('-').map(Number)
            const data = await getLeaderboard(year, m)
            setEntries(data)
        } catch { /* silent */ }
        setLoading(false)
    }

    const changeMonth = (delta: number) => {
        const [y, m] = month.split('-').map(Number)
        const d = new Date(y, m - 1 + delta, 1)
        setMonth(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`)
    }

    const monthLabel = new Date(Number(month.split('-')[0]), Number(month.split('-')[1]) - 1)
        .toLocaleDateString('en-US', { month: 'long', year: 'numeric' })

    const podium = entries.slice(0, 3)
    const showPodium = entries.length >= 3
    const listEntries = showPodium ? entries.slice(3) : entries

    return (
        <div className="space-y-5 animate-fade-in">
            {/* Header */}
            <div className="flex items-center justify-between flex-wrap gap-3">
                <div>
                    <h1 className="text-2xl font-bold text-surface-800">Leaderboard</h1>
                    <p className="text-sm text-surface-400 mt-0.5">Monthly top creators</p>
                </div>
                <div className="clay-sm flex items-center gap-1 px-2 py-1">
                    <button onClick={() => changeMonth(-1)} className="p-1.5 rounded-full hover:bg-surface-200 transition-colors cursor-pointer">
                        <ChevronLeft size={16} className="text-surface-500" />
                    </button>
                    <span className="text-xs font-bold text-surface-700 min-w-[110px] text-center">{monthLabel}</span>
                    <button onClick={() => changeMonth(1)} className="p-1.5 rounded-full hover:bg-surface-200 transition-colors cursor-pointer">
                        <ChevronRight size={16} className="text-surface-500" />
                    </button>
                </div>
            </div>

            {loading ? (
                <div className="space-y-3">
                    {[1, 2, 3, 4].map(i => <div key={i} className="h-16 skeleton" />)}
                </div>
            ) : entries.length === 0 ? (
                <div className="clay text-center py-16">
                    <div className="w-16 h-16 mx-auto rounded-full bg-surface-200 flex items-center justify-center mb-3">
                        <Trophy size={24} className="text-surface-400" />
                    </div>
                    <p className="font-bold text-surface-700">No entries for {monthLabel}</p>
                    <p className="text-sm text-surface-400 mt-1">Upload and get reactions to climb the ranks!</p>
                </div>
            ) : (
                <>
                    {/* Podium - Only if 3+ users */}
                    {showPodium && (
                        <div className="grid grid-cols-3 gap-3 items-end">
                            {/* 2nd */}
                            <div className="clay p-4 text-center">
                                <p className="text-lg font-bold text-surface-300 mb-2">2</p>
                                <Avatar name={podium[1]?.full_name} size="lg" className="mx-auto" />
                                <p className="text-xs font-bold text-surface-700 truncate mt-2">{podium[1]?.full_name}</p>
                                <p className="text-[10px] text-primary-500 font-bold">{podium[1]?.total_score} pts</p>
                            </div>

                            {/* 1st */}
                            <div className="clay-lg p-5 text-center -mt-4 relative">
                                <Crown size={20} className="text-amber-500 mx-auto mb-1" />
                                <Avatar name={podium[0]?.full_name} size="xl" className="mx-auto border-3 border-amber-300" />
                                <p className="text-sm font-bold text-surface-800 truncate mt-2">{podium[0]?.full_name}</p>
                                <p className="text-xs text-amber-600 font-bold">{podium[0]?.total_score} pts</p>
                            </div>

                            {/* 3rd */}
                            <div className="clay p-4 text-center">
                                <p className="text-lg font-bold text-surface-300 mb-2">3</p>
                                <Avatar name={podium[2]?.full_name} size="lg" className="mx-auto" />
                                <p className="text-xs font-bold text-surface-700 truncate mt-2">{podium[2]?.full_name}</p>
                                <p className="text-[10px] text-primary-500 font-bold">{podium[2]?.total_score} pts</p>
                            </div>
                        </div>
                    )}

                    {/* List */}
                    <div className="space-y-2">
                        {listEntries.map((entry, i) => (
                            <Card key={entry.user_id} hover className="flex items-center gap-4 !p-4">
                                <span className="text-sm font-bold text-surface-300 w-6 text-right">
                                    {showPodium ? i + 4 : i + 1}
                                </span>
                                <Avatar name={entry.full_name} size="sm" />
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-bold text-surface-700 truncate">{entry.full_name}</p>
                                    <p className="text-[11px] text-surface-400">{entry.upload_count} uploads · {entry.reaction_count} reactions</p>
                                </div>
                                <div className="text-right">
                                    <p className="text-sm font-bold text-primary-500">{entry.total_score}</p>
                                    <p className="text-[10px] text-surface-400">pts</p>
                                </div>
                            </Card>
                        ))}
                    </div>
                </>
            )}
        </div>
    )
}
