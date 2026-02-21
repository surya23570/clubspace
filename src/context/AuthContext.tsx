import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import { supabase } from '../lib/supabase'
import type { Profile } from '../types'
import type { User, Session } from '@supabase/supabase-js'

interface AuthContextType {
    user: User | null
    profile: Profile | null
    session: Session | null
    loading: boolean
    signUp: (email: string, password: string, fullName: string, department: string) => Promise<{ confirmEmail: boolean }>
    signIn: (email: string, password: string) => Promise<void>
    signOut: () => Promise<void>
    refreshProfile: () => Promise<void>
    isAdmin: boolean
    isMentor: boolean
    isStudent: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User | null>(null)
    const [profile, setProfile] = useState<Profile | null>(null)
    const [session, setSession] = useState<Session | null>(null)
    const [loading, setLoading] = useState(true)

    const fetchProfile = async (userId: string) => {
        const { data } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', userId)
            .single()
        setProfile(data)
    }

    useEffect(() => {
        // Check URL hash for email confirmation redirect (type=signup)
        const hashParams = new URLSearchParams(window.location.hash.substring(1))
        if (hashParams.get('type') === 'signup' && window.location.pathname !== '/email-confirmed') {
            window.location.href = '/email-confirmed' + window.location.hash
            return
        }

        // Get initial session
        supabase.auth.getSession().then(({ data: { session: s } }) => {
            setSession(s)
            setUser(s?.user ?? null)
            if (s?.user) {
                fetchProfile(s.user.id)
            }
            setLoading(false)
        })

        // Listen for auth changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange((event, s) => {
            // If this is a password recovery event, redirect to the reset password page
            if (event === 'PASSWORD_RECOVERY') {
                // Use window.location since we're outside the Router
                if (window.location.pathname !== '/reset-password') {
                    window.location.href = '/reset-password'
                    return
                }
            }

            setSession(s)
            setUser(s?.user ?? null)
            if (s?.user) {
                fetchProfile(s.user.id)
            } else {
                setProfile(null)
            }
            setLoading(false)
        })

        return () => subscription.unsubscribe()
    }, [])

    const signUp = async (email: string, password: string, fullName: string, department: string) => {
        const { data, error } = await supabase.auth.signUp({
            email,
            password,
            options: {
                data: { full_name: fullName, department },
                emailRedirectTo: `${window.location.origin}/email-confirmed`,
            },
        })
        if (error) throw error

        // If email confirmation is required, identities will be empty
        const needsConfirmation = !data.session

        // Profile is auto-created by the database trigger (handle_new_user)
        if (data.user && data.session) {
            // Small delay to let the trigger finish
            await new Promise(r => setTimeout(r, 500))
            await fetchProfile(data.user.id)
        }

        return { confirmEmail: needsConfirmation }
    }

    const signIn = async (email: string, password: string) => {
        const { error } = await supabase.auth.signInWithPassword({ email, password })
        if (error) throw error
    }

    const signOut = async () => {
        const { error } = await supabase.auth.signOut()
        if (error) throw error
        setProfile(null)
    }

    const refreshProfile = async () => {
        if (user) await fetchProfile(user.id)
    }

    const role = profile?.role
    const isAdmin = role === 'admin'
    const isMentor = role === 'mentor'
    const isStudent = role === 'student'

    return (
        <AuthContext.Provider value={{
            user, profile, session, loading,
            signUp, signIn, signOut, refreshProfile,
            isAdmin, isMentor, isStudent,
        }}>
            {children}
        </AuthContext.Provider>
    )
}

export function useAuth() {
    const context = useContext(AuthContext)
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider')
    }
    return context
}
