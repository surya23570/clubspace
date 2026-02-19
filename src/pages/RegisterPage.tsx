import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { Button } from '../components/ui/Button'
import { Sparkles, Eye, EyeOff } from 'lucide-react'

export function RegisterPage() {
    const { signUp } = useAuth()
    const navigate = useNavigate()
    const [form, setForm] = useState({ fullName: '', email: '', password: '', department: '' })
    const [error, setError] = useState('')
    const [loading, setLoading] = useState(false)
    const [showPassword, setShowPassword] = useState(false)

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setError('')
        if (form.password.length < 6) {
            setError('Password must be at least 6 characters')
            return
        }
        setLoading(true)
        try {
            await signUp(form.email, form.password, form.fullName, form.department)
            navigate('/')
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Registration failed')
        }
        setLoading(false)
    }



    return (
        <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden">
            {/* Background Blobs */}
            <div className="absolute top-10 -right-20 w-72 h-72 bg-primary-200/40 rounded-full blur-3xl animate-blob" />
            <div className="absolute bottom-10 -left-20 w-80 h-80 bg-accent-400/30 rounded-full blur-3xl animate-blob" style={{ animationDelay: '3s' }} />

            <div className="w-full max-w-md clay-lg p-8 sm:p-10 animate-scale-in relative z-10">
                {/* Logo */}
                <div className="text-center mb-7">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-[var(--radius-clay)] bg-primary-500 shadow-clay-button mb-4">
                        <Sparkles size={28} className="text-white" />
                    </div>
                    <h1 className="text-2xl font-bold text-surface-800">Create Account</h1>
                    <p className="text-sm text-surface-400 mt-1">Join the creative community</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="text-xs font-semibold text-surface-600 uppercase tracking-wider mb-2 block">Full Name</label>
                        <input
                            type="text"
                            value={form.fullName}
                            onChange={e => setForm({ ...form, fullName: e.target.value })}
                            className="w-full px-4 py-3 clay-input text-sm text-surface-800 placeholder:text-surface-400"
                            placeholder="Your full name"
                            required
                        />
                    </div>

                    <div>
                        <label className="text-xs font-semibold text-surface-600 uppercase tracking-wider mb-2 block">Email</label>
                        <input
                            type="email"
                            value={form.email}
                            onChange={e => setForm({ ...form, email: e.target.value })}
                            className="w-full px-4 py-3 clay-input text-sm text-surface-800 placeholder:text-surface-400"
                            placeholder="you@example.com"
                            required
                        />
                    </div>

                    <div>
                        <label className="text-xs font-semibold text-surface-600 uppercase tracking-wider mb-2 block">Password</label>
                        <div className="relative">
                            <input
                                type={showPassword ? 'text' : 'password'}
                                value={form.password}
                                onChange={e => setForm({ ...form, password: e.target.value })}
                                className="w-full px-4 py-3 pr-12 clay-input text-sm text-surface-800 placeholder:text-surface-400"
                                placeholder="Min 6 characters"
                                required
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-surface-400 hover:text-surface-600 cursor-pointer"
                            >
                                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                            </button>
                        </div>
                    </div>

                    <div>
                        <label className="text-xs font-semibold text-surface-600 uppercase tracking-wider mb-2 block">Interested Field</label>
                        <input
                            type="text"
                            value={form.department}
                            onChange={e => setForm({ ...form, department: e.target.value })}
                            className="w-full px-4 py-3 clay-input text-sm text-surface-800 placeholder:text-surface-400"
                            placeholder="e.g. Photography, Design, AI..."
                            required
                        />
                    </div>

                    {error && (
                        <p className="text-sm text-danger clay-inset px-4 py-2.5">{error}</p>
                    )}

                    <Button
                        type="submit"
                        variant="primary"
                        size="lg"
                        loading={loading}
                        className="w-full"
                    >
                        Create Account
                    </Button>
                </form>

                <p className="text-center text-sm text-surface-400 mt-6">
                    Already have an account?{' '}
                    <Link to="/login" className="text-primary-500 font-semibold hover:text-primary-600">
                        Sign in
                    </Link>
                </p>
            </div>
        </div>
    )
}
