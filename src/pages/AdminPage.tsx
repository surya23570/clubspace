import { useState, useEffect } from 'react'
import { Upload, Users, BarChart3, Image } from 'lucide-react'
import { Card } from '../components/ui/Card'
import { getAdminStats } from '../lib/api'
import type { AdminStats, PostCategory } from '../types'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts'

const PIE_COLORS = ['#6c63ff', '#ff6b81', '#4ade80', '#fbbf24', '#8b5cf6', '#64748b']

const CATEGORY_LABELS: Record<PostCategory, string> = {
    photography: 'Photography',
    design: 'Design',
    music: 'Music',
    video: 'Video',
    writing: 'Writing',
    other: 'Other',
}

export function AdminPage() {
    const [stats, setStats] = useState<AdminStats | null>(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const fetch = async () => {
            try { setStats(await getAdminStats()) } catch { /* silent */ }
            setLoading(false)
        }
        fetch()
    }, [])

    if (loading) {
        return (
            <div className="space-y-5 animate-fade-in">
                <div className="grid grid-cols-2 gap-4">
                    {[1, 2, 3, 4].map(i => <div key={i} className="h-28 skeleton" />)}
                </div>
                <div className="h-64 skeleton" />
            </div>
        )
    }

    if (!stats) return null

    const statCards = [
        { icon: Upload, label: 'Total Uploads', value: stats.totalUploads, color: 'from-blue-400 to-cyan-400' },
        { icon: Users, label: 'Active Users', value: stats.activeUsers, color: 'from-purple-400 to-pink-400' },
        { icon: BarChart3, label: 'This Month', value: stats.monthlyUploads[stats.monthlyUploads.length - 1]?.count || 0, color: 'from-green-400 to-emerald-400' },
        { icon: Image, label: 'Categories', value: Object.keys(stats.categoryCounts).length, color: 'from-amber-400 to-orange-400' },
    ]

    const pieData = Object.entries(stats.categoryCounts).map(([key, value]) => ({
        name: CATEGORY_LABELS[key as PostCategory] || key,
        value,
    }))

    return (
        <div className="space-y-5 animate-fade-in">
            <div>
                <h1 className="text-2xl font-bold text-surface-800">Admin Dashboard</h1>
                <p className="text-sm text-surface-400 mt-0.5">Platform analytics</p>
            </div>

            {/* Stat Cards */}
            <div className="grid grid-cols-2 gap-4">
                {statCards.map((stat, i) => (
                    <Card key={stat.label} hover className="animate-fade-in-up" style={{ animationDelay: `${i * 80}ms` } as React.CSSProperties}>
                        <div className={`w-10 h-10 rounded-[var(--radius-clay-sm)] bg-gradient-to-br ${stat.color} flex items-center justify-center mb-3 shadow-sm`}>
                            <stat.icon size={18} className="text-white" />
                        </div>
                        <p className="text-2xl font-bold text-surface-800">{stat.value}</p>
                        <p className="text-xs text-surface-400 font-medium mt-0.5">{stat.label}</p>
                    </Card>
                ))}
            </div>

            {/* Monthly Chart */}
            <Card>
                <h3 className="font-bold text-surface-800 text-[15px] mb-4">Uploads Over Time</h3>
                <div className="h-56">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={stats.monthlyUploads}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#e8e4de" />
                            <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#a8a29e' }} />
                            <YAxis tick={{ fontSize: 11, fill: '#a8a29e' }} />
                            <Tooltip contentStyle={{ background: '#f7f4f0', border: 'none', borderRadius: '14px', boxShadow: '4px 4px 10px rgba(0,0,0,0.06)', fontSize: '12px' }} />
                            <Bar dataKey="count" fill="#6c63ff" radius={[8, 8, 0, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </Card>

            {/* Pie Chart */}
            <Card>
                <h3 className="font-bold text-surface-800 text-[15px] mb-4">Categories</h3>
                <div className="h-56 flex items-center justify-center">
                    {pieData.length > 0 ? (
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie data={pieData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={4} dataKey="value">
                                    {pieData.map((_entry, index) => <Cell key={index} fill={PIE_COLORS[index % PIE_COLORS.length]} />)}
                                </Pie>
                                <Tooltip contentStyle={{ background: '#f7f4f0', border: 'none', borderRadius: '14px', boxShadow: '4px 4px 10px rgba(0,0,0,0.06)', fontSize: '12px' }} />
                            </PieChart>
                        </ResponsiveContainer>
                    ) : (
                        <p className="text-sm text-surface-400">No data yet</p>
                    )}
                </div>
                <div className="flex flex-wrap gap-3 mt-3">
                    {pieData.map((entry, i) => (
                        <div key={entry.name} className="flex items-center gap-1.5">
                            <div className="w-3 h-3 rounded-full" style={{ background: PIE_COLORS[i % PIE_COLORS.length] }} />
                            <span className="text-xs text-surface-600 font-medium">{entry.name} ({entry.value})</span>
                        </div>
                    ))}
                </div>
            </Card>
        </div>
    )
}
