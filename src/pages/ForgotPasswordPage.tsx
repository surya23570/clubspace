import { useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { Button } from '../components/ui/Button'
import { Sparkles, ArrowLeft, Mail, Check } from 'lucide-react'
import { usePageTitle } from '../hooks/usePageTitle'

export function ForgotPasswordPage() {
    usePageTitle('Reset Password')
    const [email, setEmail] = useState('')
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')
    const [sent, setSent] = useState(false)

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setError('')

        if (!email.endsWith('@klu.ac.in')) {
            setError('Email must belong to @klu.ac.in domain')
            return
        }

        setLoading(true)
        try {
            const { error } = await supabase.auth.resetPasswordForEmail(email, {
                redirectTo: `${window.location.origin}/reset-password`,
            })
            if (error) throw error
            setSent(true)
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to send reset email')
        }
        setLoading(false)
    }

    return (
        <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden">
            {/* Background Blobs */}
            <div className="absolute top-20 -left-20 w-72 h-72 bg-primary-200/40 rounded-full blur-3xl animate-blob" />
            <div className="absolute bottom-20 -right-20 w-80 h-80 bg-accent-400/30 rounded-full blur-3xl animate-blob" style={{ animationDelay: '2s' }} />
            <div className="absolute top-1/2 left-1/3 w-64 h-64 bg-amber-200/30 rounded-full blur-3xl animate-blob" style={{ animationDelay: '4s' }} />

            <div className="w-full max-w-md clay-lg p-8 sm:p-10 animate-scale-in relative z-10">
                {/* Logo */}
                <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-[var(--radius-clay)] bg-primary-500 shadow-clay-button mb-4">
                        <Sparkles size={28} className="text-white" />
                    </div>
                    <h1 className="text-2xl font-bold text-surface-800">Reset Password</h1>
                    <p className="text-sm text-surface-400 mt-1">We'll send you a reset link</p>
                </div>

                {sent ? (
                    <div className="text-center space-y-4">
                        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-100 mx-auto">
                            <Check size={28} className="text-green-600" />
                        </div>
                        <p className="text-sm text-surface-700 font-medium">
                            Check your email! We've sent a password reset link to{' '}
                            <strong className="text-surface-800">{email}</strong>
                        </p>
                        <p className="text-xs text-surface-400">
                            Didn't receive it? Check your spam folder or try again.
                        </p>
                        <Link
                            to="/login"
                            className="inline-flex items-center gap-2 text-primary-500 font-semibold text-sm hover:text-primary-600"
                        >
                            <ArrowLeft size={14} />
                            Back to Sign In
                        </Link>
                    </div>
                ) : (
                    <form onSubmit={handleSubmit} className="space-y-5">
                        <div>
                            <label className="text-xs font-semibold text-surface-600 uppercase tracking-wider mb-2 block">Email</label>
                            <div className="relative">
                                <input
                                    type="email"
                                    value={email}
                                    onChange={e => setEmail(e.target.value)}
                                    className="w-full px-4 py-3 pl-10 clay-input text-sm text-surface-800 placeholder:text-surface-400"
                                    placeholder="you@klu.ac.in"
                                    required
                                />
                                <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-surface-400" />
                            </div>
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
                            Send Reset Link
                        </Button>
                    </form>
                )}

                <p className="text-center text-sm text-surface-400 mt-6">
                    <Link to="/login" className="text-primary-500 font-semibold hover:text-primary-600 inline-flex items-center gap-1">
                        <ArrowLeft size={12} />
                        Back to Sign In
                    </Link>
                </p>
            </div>
        </div>
    )
}
