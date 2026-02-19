import { useState, useRef, useCallback } from 'react'
import { Upload, X, Image, Video, Music } from 'lucide-react'
import { Modal } from '../ui/Modal'
import { Button } from '../ui/Button'
import { useAuth } from '../../context/AuthContext'
import { uploadToCloudinary } from '../../lib/cloudinary'
import { createPost } from '../../lib/api'
import type { PostCategory, PostPurpose, UploadProgress } from '../../types'

const CATEGORIES: { value: PostCategory; label: string }[] = [
    { value: 'photography', label: '📸 Photography' },
    { value: 'design', label: '🎨 Design' },
    { value: 'music', label: '🎵 Music' },
    { value: 'video', label: '🎬 Video' },
    { value: 'writing', label: '✍️ Writing' },
    { value: 'other', label: '📦 Other' },
]

const PURPOSES: { value: PostPurpose; label: string }[] = [
    { value: 'showcase', label: 'Showcase' },
    { value: 'assignment', label: 'Assignment' },
    { value: 'competition', label: 'Competition' },
    { value: 'personal', label: 'Personal' },
]

interface UploadModalProps {
    isOpen: boolean
    onClose: () => void
    onSuccess: () => void
}

export function UploadModal({ isOpen, onClose, onSuccess }: UploadModalProps) {
    const { user } = useAuth()
    const fileInputRef = useRef<HTMLInputElement>(null)
    const [file, setFile] = useState<File | null>(null)
    const [preview, setPreview] = useState<string | null>(null)
    const [description, setDescription] = useState('')
    const [category, setCategory] = useState<PostCategory>('photography')
    const [purpose, setPurpose] = useState<PostPurpose>('showcase')
    const [progress, setProgress] = useState<UploadProgress>({ status: 'idle', progress: 0 })
    const [error, setError] = useState<string | null>(null)
    const [dragOver, setDragOver] = useState(false)

    const handleFile = useCallback((f: File) => {
        setFile(f)
        setError(null)
        if (f.type.startsWith('image/')) {
            const url = URL.createObjectURL(f)
            setPreview(url)
        } else if (f.type.startsWith('video/')) {
            const url = URL.createObjectURL(f)
            setPreview(url)
        } else {
            setPreview(null)
        }
    }, [])

    const handleDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault()
        setDragOver(false)
        const f = e.dataTransfer.files[0]
        if (f) handleFile(f)
    }, [handleFile])

    const handleSubmit = async () => {
        if (!file || !user) return
        setError(null)
        try {
            const result = await uploadToCloudinary(file, setProgress)
            await createPost({
                user_id: user.id,
                media_url: result.secure_url,
                media_public_id: result.public_id,
                media_type: result.media_type,
                category,
                purpose,
                description,
            })
            // Reset
            setFile(null)
            setPreview(null)
            setDescription('')
            setProgress({ status: 'idle', progress: 0 })
            onSuccess()
            onClose()
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Upload failed')
            setProgress({ status: 'error', progress: 0 })
        }
    }

    const reset = () => {
        setFile(null)
        setPreview(null)
        setDescription('')
        setError(null)
        setProgress({ status: 'idle', progress: 0 })
    }

    return (
        <Modal isOpen={isOpen} onClose={() => { reset(); onClose() }} title="Create Post" size="lg">
            <div className="space-y-5">
                {/* Drop Zone */}
                {!file ? (
                    <div
                        className={`
              relative border-2 border-dashed rounded-2xl p-10 text-center transition-all duration-200
              ${dragOver
                                ? 'border-primary-400 bg-primary-50'
                                : 'border-surface-300 hover:border-primary-300 hover:bg-surface-50'
                            }
            `}
                        onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
                        onDragLeave={() => setDragOver(false)}
                        onDrop={handleDrop}
                    >
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/*,video/*,audio/*"
                            className="hidden"
                            onChange={e => {
                                const f = e.target.files?.[0]
                                if (f) handleFile(f)
                            }}
                        />
                        <div className="flex flex-col items-center gap-3">
                            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary-100 to-accent-100 flex items-center justify-center">
                                <Upload size={28} className="text-primary-500" />
                            </div>
                            <div>
                                <p className="font-semibold text-surface-700">Drop your file here or</p>
                                <button
                                    onClick={() => fileInputRef.current?.click()}
                                    className="text-primary-600 font-semibold hover:underline cursor-pointer"
                                >
                                    browse to upload
                                </button>
                            </div>
                            <div className="flex items-center gap-4 text-xs text-surface-400 mt-1">
                                <span className="flex items-center gap-1"><Image size={12} /> Images</span>
                                <span className="flex items-center gap-1"><Video size={12} /> Videos</span>
                                <span className="flex items-center gap-1"><Music size={12} /> Audio</span>
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="relative rounded-xl overflow-hidden bg-surface-100">
                        {preview && file.type.startsWith('image/') && (
                            <img src={preview} alt="Preview" className="w-full max-h-64 object-cover" />
                        )}
                        {preview && file.type.startsWith('video/') && (
                            <video src={preview} controls className="w-full max-h-64" />
                        )}
                        {file.type.startsWith('audio/') && (
                            <div className="p-6 bg-gradient-to-br from-primary-50 to-accent-50">
                                <audio src={URL.createObjectURL(file)} controls className="w-full" />
                            </div>
                        )}
                        <button
                            onClick={() => { setFile(null); setPreview(null) }}
                            className="absolute top-2 right-2 p-1.5 rounded-full bg-black/50 text-white hover:bg-black/70 transition-colors cursor-pointer"
                        >
                            <X size={14} />
                        </button>
                        <div className="absolute bottom-2 left-2 bg-black/60 text-white text-xs px-2 py-1 rounded-lg">
                            {(file.size / (1024 * 1024)).toFixed(1)} MB
                        </div>
                    </div>
                )}

                {/* Description */}
                <textarea
                    value={description}
                    onChange={e => setDescription(e.target.value)}
                    placeholder="What's the story behind this piece?"
                    rows={3}
                    className="w-full rounded-xl border border-surface-300 bg-white/80 px-4 py-3 text-sm text-surface-800 placeholder:text-surface-400 focus:outline-none focus:ring-2 focus:ring-primary-300 focus:border-primary-400 transition-all duration-200 resize-none"
                />

                {/* Category & Purpose */}
                <div className="grid grid-cols-2 gap-4">
                    <div className="flex flex-col gap-1.5">
                        <label className="text-sm font-medium text-surface-700">Category</label>
                        <select
                            value={category}
                            onChange={e => setCategory(e.target.value as PostCategory)}
                            className="rounded-xl border border-surface-300 bg-white/80 px-3 py-2.5 text-sm cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary-300"
                        >
                            {CATEGORIES.map(c => (
                                <option key={c.value} value={c.value}>{c.label}</option>
                            ))}
                        </select>
                    </div>
                    <div className="flex flex-col gap-1.5">
                        <label className="text-sm font-medium text-surface-700">Purpose</label>
                        <select
                            value={purpose}
                            onChange={e => setPurpose(e.target.value as PostPurpose)}
                            className="rounded-xl border border-surface-300 bg-white/80 px-3 py-2.5 text-sm cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary-300"
                        >
                            {PURPOSES.map(p => (
                                <option key={p.value} value={p.value}>{p.label}</option>
                            ))}
                        </select>
                    </div>
                </div>

                {/* Progress */}
                {progress.status === 'uploading' && (
                    <div className="space-y-2">
                        <div className="flex justify-between text-xs text-surface-600">
                            <span>Uploading...</span>
                            <span>{progress.progress}%</span>
                        </div>
                        <div className="w-full h-2 rounded-full bg-surface-200 overflow-hidden">
                            <div
                                className="h-full bg-gradient-to-r from-primary-500 to-accent-500 rounded-full transition-all duration-300"
                                style={{ width: `${progress.progress}%` }}
                            />
                        </div>
                    </div>
                )}

                {/* Error */}
                {error && (
                    <p className="text-sm text-danger bg-red-50 px-4 py-2.5 rounded-xl">{error}</p>
                )}

                {/* Submit */}
                <div className="flex justify-end gap-3">
                    <Button variant="secondary" onClick={() => { reset(); onClose() }}>Cancel</Button>
                    <Button
                        variant="primary"
                        onClick={handleSubmit}
                        disabled={!file}
                        loading={progress.status === 'uploading'}
                        icon={<Upload size={16} />}
                    >
                        Publish
                    </Button>
                </div>
            </div>
        </Modal>
    )
}
