import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { Button } from '../components/ui/Button'
import { Sparkles, ArrowLeft, Lock, Check, AlertTriangle, Eye, EyeOff } from 'lucide-react'
import { usePageTitle } from '../hooks/usePageTitle'

export function ResetPasswordPage() {
    usePageTitle('Set New Password')
    const navigate = useNavigate()
    const [password, setPassword] = useState('')
    const [confirmPassword, setConfirmPassword] = useState('')
    const [showPassword, setShowPassword] = useState(false)
    const [showConfirmPassword, setShowConfirmPassword] = useState(false)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')
    const [success, setSuccess] = useState(false)
    const [isValidSession, setIsValidSession] = useState(false)
    const [checking, setChecking] = useState(true)

    useEffect(() => {
        // Listen for the PASSWORD_RECOVERY event fired by Supabase
        // when the user clicks the reset link in their email
        const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
            if (event === 'PASSWORD_RECOVERY') {
                setIsValidSession(true)
                setChecking(false)
            } else if (session) {
                // User already has a valid session (e.g., navigated here after the event already fired)
                setIsValidSession(true)
                setChecking(false)
            }
        })

        // Also check if there's already a session (the event may have fired before this component mounted)
        supabase.auth.getSession().then(({ data: { session } }) => {
            if (session) {
                setIsValidSession(true)
            }
            setChecking(false)
        })

        return () => subscription.unsubscribe()
    }, [])

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setError('')

        if (password.length < 6) {
            setError('Password must be at least 6 characters long')
            return
        }

        if (password !== confirmPassword) {
            setError('Passwords do not match')
            return
        }

        setLoading(true)
        try {
            const { error } = await supabase.auth.updateUser({ password })
            if (error) throw error
            setSuccess(true)
            // Sign out after password change so user logs in with new password
            await supabase.auth.signOut()
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to update password')
        }
        setLoading(false)
    }

    if (checking) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-10 h-10 rounded-full border-3 border-primary-200 border-t-primary-600 animate-spin" />
                    <p className="text-sm text-surface-500 font-medium">Verifying reset link...</p>
                </div>
            </div>
        )
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
                    <h1 className="text-2xl font-bold text-surface-800">Set New Password</h1>
                    <p className="text-sm text-surface-400 mt-1">
                        {success ? 'You\'re all set!' : 'Enter your new password below'}
                    </p>
                </div>

                {success ? (
                    <div className="text-center space-y-4">
                        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-100 mx-auto">
                            <Check size={28} className="text-green-600" />
                        </div>
                        <p className="text-sm text-surface-700 font-medium">
                            Your password has been updated successfully!
                        </p>
                        <p className="text-xs text-surface-400">
                            You can now sign in with your new password.
                        </p>
                        <Link
                            to="/login"
                            className="inline-flex items-center gap-2 text-primary-500 font-semibold text-sm hover:text-primary-600"
                        >
                            <ArrowLeft size={14} />
                            Go to Sign In
                        </Link>
                    </div>
                ) : !isValidSession ? (
                    <div className="text-center space-y-4">
                        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-amber-100 mx-auto">
                            <AlertTriangle size={28} className="text-amber-600" />
                        </div>
                        <p className="text-sm text-surface-700 font-medium">
                            Invalid or expired reset link
                        </p>
                        <p className="text-xs text-surface-400">
                            This link may have expired or already been used. Please request a new password reset.
                        </p>
                        <Link
                            to="/forgot-password"
                            className="inline-flex items-center gap-2 text-primary-500 font-semibold text-sm hover:text-primary-600"
                        >
                            <ArrowLeft size={14} />
                            Request New Reset Link
                        </Link>
                    </div>
                ) : (
                    <form onSubmit={handleSubmit} className="space-y-5">
                        <div>
                            <label className="text-xs font-semibold text-surface-600 uppercase tracking-wider mb-2 block">
                                New Password
                            </label>
                            <div className="relative">
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    value={password}
                                    onChange={e => setPassword(e.target.value)}
                                    className="w-full px-4 py-3 pl-10 pr-10 clay-input text-sm text-surface-800 placeholder:text-surface-400"
                                    placeholder="Min. 6 characters"
                                    required
                                    minLength={6}
                                />
                                <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-surface-400" />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-surface-400 hover:text-surface-600"
                                >
                                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                                </button>
                            </div>
                        </div>

                        <div>
                            <label className="text-xs font-semibold text-surface-600 uppercase tracking-wider mb-2 block">
                                Confirm Password
                            </label>
                            <div className="relative">
                                <input
                                    type={showConfirmPassword ? 'text' : 'password'}
                                    value={confirmPassword}
                                    onChange={e => setConfirmPassword(e.target.value)}
                                    className="w-full px-4 py-3 pl-10 pr-10 clay-input text-sm text-surface-800 placeholder:text-surface-400"
                                    placeholder="Re-enter your password"
                                    required
                                    minLength={6}
                                />
                                <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-surface-400" />
                                <button
                                    type="button"
                                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-surface-400 hover:text-surface-600"
                                >
                                    {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                                </button>
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
                            Update Password
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
