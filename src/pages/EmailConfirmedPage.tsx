import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { Button } from '../components/ui/Button'
import { Sparkles, ArrowRight, CheckCircle, Mail } from 'lucide-react'
import { usePageTitle } from '../hooks/usePageTitle'

export function EmailConfirmedPage() {
    usePageTitle('Email Confirmed')
    const [confirmed, setConfirmed] = useState(false)
    const [checking, setChecking] = useState(true)

    useEffect(() => {
        // Check URL hash for type=signup (Supabase appends this after email confirmation)
        const hashParams = new URLSearchParams(window.location.hash.substring(1))
        if (hashParams.get('type') === 'signup') {
            setConfirmed(true)
            setChecking(false)
            // Sign out so user logs in fresh with their confirmed account
            supabase.auth.signOut()
            return
        }

        // Listen for auth events
        const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
            if (event === 'SIGNED_IN') {
                setConfirmed(true)
                setChecking(false)
                supabase.auth.signOut()
            }
        })

        // Also check if there's an existing session (user arrived via redirect)
        supabase.auth.getSession().then(({ data: { session } }) => {
            if (session) {
                setConfirmed(true)
                supabase.auth.signOut()
            }
            setChecking(false)
        })

        return () => subscription.unsubscribe()
    }, [])

    if (checking) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-10 h-10 rounded-full border-3 border-primary-200 border-t-primary-600 animate-spin" />
                    <p className="text-sm text-surface-500 font-medium">Verifying your email...</p>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden">
            {/* Background Blobs */}
            <div className="absolute top-20 -left-20 w-72 h-72 bg-primary-200/40 rounded-full blur-3xl animate-blob" />
            <div className="absolute bottom-20 -right-20 w-80 h-80 bg-accent-400/30 rounded-full blur-3xl animate-blob" style={{ animationDelay: '2s' }} />
            <div className="absolute top-1/2 left-1/3 w-64 h-64 bg-green-200/30 rounded-full blur-3xl animate-blob" style={{ animationDelay: '4s' }} />

            <div className="w-full max-w-md clay-lg p-8 sm:p-10 animate-scale-in relative z-10">
                <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-[var(--radius-clay)] bg-primary-500 shadow-clay-button mb-4">
                        <Sparkles size={28} className="text-white" />
                    </div>
                    <h1 className="text-2xl font-bold text-surface-800">
                        {confirmed ? 'Email Confirmed!' : 'Confirmation Failed'}
                    </h1>
                </div>

                {confirmed ? (
                    <div className="text-center space-y-4">
                        <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-green-100 mx-auto">
                            <CheckCircle size={40} className="text-green-600" />
                        </div>
                        <p className="text-sm text-surface-700 font-medium">
                            Your email has been verified successfully!
                        </p>
                        <p className="text-xs text-surface-400">
                            Your account is now active. Sign in to start exploring.
                        </p>
                        <div className="pt-2">
                            <Link to="/login">
                                <Button variant="primary" size="lg" className="w-full">
                                    <span className="flex items-center gap-2">
                                        Sign In Now
                                        <ArrowRight size={16} />
                                    </span>
                                </Button>
                            </Link>
                        </div>
                    </div>
                ) : (
                    <div className="text-center space-y-4">
                        <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-amber-100 mx-auto">
                            <Mail size={40} className="text-amber-600" />
                        </div>
                        <p className="text-sm text-surface-700 font-medium">
                            This confirmation link is invalid or has expired.
                        </p>
                        <p className="text-xs text-surface-400">
                            Please try signing up again or contact support.
                        </p>
                        <div className="pt-2">
                            <Link to="/register">
                                <Button variant="primary" size="lg" className="w-full">
                                    Sign Up Again
                                </Button>
                            </Link>
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}
