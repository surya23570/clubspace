import { useState, useRef } from 'react'
import { useAuth } from '../context/AuthContext'
import { updateProfile, changePassword, deleteAccount } from '../lib/api'
import { uploadToCloudinary } from '../lib/cloudinary'
import { Card } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { Avatar } from '../components/ui/Avatar'
import { Modal } from '../components/ui/Modal'
import {
    User, Lock, Palette, LogOut, Trash2, Shield,
    Camera, Check, AlertTriangle, Sun, Moon,
} from 'lucide-react'

const SECTIONS = ['Profile', 'Account', 'Appearance', 'Danger Zone'] as const

export function SettingsPage() {
    const { user, profile, signOut, refreshProfile, isAdmin } = useAuth()
    const [activeSection, setActiveSection] = useState<typeof SECTIONS[number]>('Profile')

    // Profile form
    const [profileForm, setProfileForm] = useState({
        full_name: profile?.full_name || '',
        bio: profile?.bio || '',
        department: profile?.department || '',
        avatar_url: profile?.avatar_url || '',
    })
    const [profileSaving, setProfileSaving] = useState(false)
    const [profileSuccess, setProfileSuccess] = useState(false)

    // Password form
    const [passwordForm, setPasswordForm] = useState({ newPassword: '', confirmPassword: '' })
    const [passwordSaving, setPasswordSaving] = useState(false)
    const [passwordError, setPasswordError] = useState('')
    const [passwordSuccess, setPasswordSuccess] = useState(false)

    // Theme
    const [theme, setTheme] = useState<'light' | 'dark'>(() =>
        (localStorage.getItem('clubspace-theme') as 'light' | 'dark') || 'light'
    )

    // Delete
    const [showDeleteModal, setShowDeleteModal] = useState(false)
    const [deleteConfirm, setDeleteConfirm] = useState('')
    const [deleting, setDeleting] = useState(false)

    const [uploading, setUploading] = useState(false)
    const fileInputRef = useRef<HTMLInputElement>(null)

    const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return

        setUploading(true)
        try {
            const { secure_url } = await uploadToCloudinary(file)
            setProfileForm(prev => ({ ...prev, avatar_url: secure_url }))
        } catch (error) {
            console.error('Upload failed:', error)
        }
        setUploading(false)
    }

    const handleProfileSave = async () => {
        if (!user) return
        setProfileSaving(true)
        setProfileSuccess(false)
        try {
            await updateProfile(user.id, profileForm)
            await refreshProfile()
            setProfileSuccess(true)
            setTimeout(() => setProfileSuccess(false), 3000)
        } catch { /* silent */ }
        setProfileSaving(false)
    }

    const handlePasswordChange = async () => {
        setPasswordError('')
        setPasswordSuccess(false)
        if (passwordForm.newPassword.length < 6) {
            setPasswordError('Password must be at least 6 characters')
            return
        }
        if (passwordForm.newPassword !== passwordForm.confirmPassword) {
            setPasswordError('Passwords do not match')
            return
        }
        setPasswordSaving(true)
        try {
            await changePassword(passwordForm.newPassword)
            setPasswordSuccess(true)
            setPasswordForm({ newPassword: '', confirmPassword: '' })
            setTimeout(() => setPasswordSuccess(false), 3000)
        } catch (err) {
            setPasswordError(err instanceof Error ? err.message : 'Failed to change password')
        }
        setPasswordSaving(false)
    }

    const handleThemeChange = (newTheme: 'light' | 'dark') => {
        setTheme(newTheme)
        localStorage.setItem('clubspace-theme', newTheme)
        document.documentElement.classList.toggle('dark', newTheme === 'dark')
    }

    const handleDeleteAccount = async () => {
        if (!user || deleteConfirm !== 'DELETE') return
        setDeleting(true)
        try {
            await deleteAccount(user.id)
            window.location.href = '/login'
        } catch { /* silent */ }
        setDeleting(false)
    }

    const sectionIcons: Record<typeof SECTIONS[number], typeof User> = {
        'Profile': User,
        'Account': Lock,
        'Appearance': Palette,
        'Danger Zone': AlertTriangle,
    }



    return (
        <div className="space-y-5 animate-fade-in">
            <div>
                <h1 className="text-2xl font-bold text-surface-800">Settings</h1>
                <p className="text-sm text-surface-400 mt-0.5">Manage your account</p>
            </div>

            {/* Section Tabs */}
            <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
                {SECTIONS.map(section => {
                    const Icon = sectionIcons[section]
                    return (
                        <button
                            key={section}
                            onClick={() => setActiveSection(section)}
                            className={`shrink-0 flex items-center gap-2 px-4 py-2.5 text-xs font-semibold rounded-[var(--radius-pill)] transition-all cursor-pointer ${activeSection === section
                                ? section === 'Danger Zone'
                                    ? 'bg-red-500 text-white shadow-clay-button'
                                    : 'bg-surface-800 text-white shadow-clay-button'
                                : 'clay-sm text-surface-600 hover:-translate-y-0.5'
                                }`}
                        >
                            <Icon size={14} />
                            {section}
                        </button>
                    )
                })}
            </div>


            {/* Profile Section */}
            {activeSection === 'Profile' && (
                <Card className="space-y-5 animate-fade-in-up">
                    {/* Avatar */}
                    <div className="flex items-center gap-4">
                        <div className="relative group">
                            <Avatar src={profileForm.avatar_url || profile?.avatar_url} name={profile?.full_name} size="xl" />
                            <div
                                className="absolute inset-0 rounded-full bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer"
                                onClick={() => fileInputRef.current?.click()}
                            >
                                <Camera size={20} className="text-white" />
                            </div>
                            <input
                                type="file"
                                ref={fileInputRef}
                                className="hidden"
                                accept="image/*"
                                onChange={handleAvatarUpload}
                            />
                        </div>
                        <div>
                            <p className="font-bold text-surface-800">{profile?.full_name}</p>
                            <p className="text-xs text-surface-400">{profile?.email}</p>
                            <button
                                onClick={() => fileInputRef.current?.click()}
                                className="text-xs text-primary-600 font-semibold hover:underline mt-1 cursor-pointer"
                                disabled={uploading}
                            >
                                {uploading ? 'Uploading...' : 'Change Photo'}
                            </button>
                            {isAdmin && (
                                <span className="inline-flex items-center gap-1 mt-1 text-[10px] font-bold text-primary-500 bg-primary-50 px-2 py-0.5 rounded-full ml-2">
                                    <Shield size={10} /> Admin
                                </span>
                            )}
                        </div>
                    </div>

                    {/* Form */}
                    <div className="space-y-4">
                        <div>
                            <label className="text-xs font-semibold text-surface-600 uppercase tracking-wider mb-2 block">Full Name</label>
                            <input
                                value={profileForm.full_name}
                                onChange={e => setProfileForm({ ...profileForm, full_name: e.target.value })}
                                className="w-full px-4 py-3 clay-input text-sm text-surface-800"
                            />
                        </div>
                        <div>
                            <label className="text-xs font-semibold text-surface-600 uppercase tracking-wider mb-2 block">Bio</label>
                            <textarea
                                value={profileForm.bio}
                                onChange={e => setProfileForm({ ...profileForm, bio: e.target.value })}
                                rows={3}
                                className="w-full px-4 py-3 clay-input text-sm text-surface-800 resize-none"
                                placeholder="Tell us about yourself…"
                            />
                        </div>
                        <div>
                            <label className="text-xs font-semibold text-surface-600 uppercase tracking-wider mb-2 block">Interested Field</label>
                            <input
                                value={profileForm.department}
                                onChange={e => setProfileForm({ ...profileForm, department: e.target.value })}
                                className="w-full px-4 py-3 clay-input text-sm text-surface-800"
                                placeholder="e.g. Photography, Design, AI..."
                            />
                        </div>
                    </div>

                    <div className="flex items-center justify-between pt-2">
                        {profileSuccess && (
                            <span className="flex items-center gap-1.5 text-sm font-medium text-success">
                                <Check size={14} /> Saved!
                            </span>
                        )}
                        <div className="ml-auto">
                            <Button variant="primary" onClick={handleProfileSave} loading={profileSaving}>
                                Save Changes
                            </Button>
                        </div>
                    </div>
                </Card>
            )}

            {/* Account Section */}
            {activeSection === 'Account' && (
                <div className="space-y-5 animate-fade-in-up">
                    <Card className="space-y-4">
                        <h3 className="font-bold text-surface-800 flex items-center gap-2">
                            <Lock size={16} /> Change Password
                        </h3>
                        <div>
                            <label className="text-xs font-semibold text-surface-600 uppercase tracking-wider mb-2 block">New Password</label>
                            <input
                                type="password"
                                value={passwordForm.newPassword}
                                onChange={e => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                                className="w-full px-4 py-3 clay-input text-sm text-surface-800"
                                placeholder="Min 6 characters"
                            />
                        </div>
                        <div>
                            <label className="text-xs font-semibold text-surface-600 uppercase tracking-wider mb-2 block">Confirm Password</label>
                            <input
                                type="password"
                                value={passwordForm.confirmPassword}
                                onChange={e => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                                className="w-full px-4 py-3 clay-input text-sm text-surface-800"
                                placeholder="Re-enter password"
                            />
                        </div>

                        {passwordError && (
                            <p className="text-sm text-danger clay-inset px-4 py-2.5">{passwordError}</p>
                        )}
                        {passwordSuccess && (
                            <p className="text-sm text-success clay-inset px-4 py-2.5 flex items-center gap-1.5">
                                <Check size={14} /> Password changed successfully
                            </p>
                        )}

                        <div className="flex justify-end">
                            <Button variant="primary" onClick={handlePasswordChange} loading={passwordSaving}>
                                Update Password
                            </Button>
                        </div>
                    </Card>

                    <Card className="flex items-center justify-between">
                        <div>
                            <h3 className="font-bold text-surface-800 flex items-center gap-2">
                                <LogOut size={16} /> Sign Out
                            </h3>
                            <p className="text-xs text-surface-400 mt-0.5">Sign out of your account on this device</p>
                        </div>
                        <Button variant="secondary" onClick={signOut} icon={<LogOut size={14} />}>
                            Sign Out
                        </Button>
                    </Card>
                </div>
            )}

            {/* Appearance Section */}
            {activeSection === 'Appearance' && (
                <Card className="space-y-4 animate-fade-in-up">
                    <h3 className="font-bold text-surface-800 flex items-center gap-2">
                        <Palette size={16} /> Theme
                    </h3>
                    <p className="text-xs text-surface-400">Choose your preferred appearance</p>

                    <div className="grid grid-cols-2 gap-3">
                        <button
                            onClick={() => handleThemeChange('light')}
                            className={`p-4 rounded-[var(--radius-clay)] text-center transition-all cursor-pointer ${theme === 'light'
                                ? 'clay-pressed border-2 border-primary-300'
                                : 'clay hover:-translate-y-0.5'
                                }`}
                        >
                            <Sun size={24} className="mx-auto mb-2 text-amber-500" />
                            <p className="text-sm font-bold text-surface-700">Light</p>
                            <p className="text-[10px] text-surface-400 mt-0.5">Warm & clean</p>
                        </button>
                        <button
                            onClick={() => handleThemeChange('dark')}
                            className={`p-4 rounded-[var(--radius-clay)] text-center transition-all cursor-pointer ${theme === 'dark'
                                ? 'clay-pressed border-2 border-primary-300'
                                : 'clay hover:-translate-y-0.5'
                                }`}
                        >
                            <Moon size={24} className="mx-auto mb-2 text-indigo-500" />
                            <p className="text-sm font-bold text-surface-700">Dark</p>
                            <p className="text-[10px] text-surface-400 mt-0.5">Easy on the eyes</p>
                        </button>
                    </div>

                    <p className="text-[11px] text-surface-400 italic">* Dark mode coming soon. Your preference is saved.</p>
                </Card>
            )}

            {/* Danger Zone */}
            {activeSection === 'Danger Zone' && (
                <Card className="space-y-4 animate-fade-in-up border-2 border-red-200">
                    <h3 className="font-bold text-danger flex items-center gap-2">
                        <AlertTriangle size={16} /> Danger Zone
                    </h3>
                    <p className="text-xs text-surface-500">
                        Permanently delete your account and all associated data. This action cannot be undone.
                    </p>
                    <Button
                        variant="danger"
                        onClick={() => setShowDeleteModal(true)}
                        icon={<Trash2 size={14} />}
                    >
                        Delete Account
                    </Button>
                </Card>
            )}

            {/* Delete Confirmation Modal */}
            <Modal isOpen={showDeleteModal} onClose={() => { setShowDeleteModal(false); setDeleteConfirm('') }} title="Delete Account" size="sm">
                <div className="space-y-4">
                    <div className="clay-inset p-4">
                        <p className="text-sm text-surface-700">
                            This will permanently delete your profile, all posts, reactions, and messages.
                            <strong className="text-danger"> This cannot be undone.</strong>
                        </p>
                    </div>
                    <div>
                        <label className="text-xs font-semibold text-surface-600 mb-2 block">
                            Type <strong className="text-danger">DELETE</strong> to confirm
                        </label>
                        <input
                            value={deleteConfirm}
                            onChange={e => setDeleteConfirm(e.target.value)}
                            className="w-full px-4 py-3 clay-input text-sm text-surface-800"
                            placeholder="DELETE"
                        />
                    </div>
                    <div className="flex justify-end gap-3">
                        <Button variant="secondary" onClick={() => { setShowDeleteModal(false); setDeleteConfirm('') }}>Cancel</Button>
                        <Button
                            variant="danger"
                            onClick={handleDeleteAccount}
                            loading={deleting}
                            disabled={deleteConfirm !== 'DELETE'}
                        >
                            Delete Forever
                        </Button>
                    </div>
                </div>
            </Modal>
        </div>
    )
}
