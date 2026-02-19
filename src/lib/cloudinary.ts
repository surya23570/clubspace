import type { MediaType, UploadProgress } from '../types'

const CLOUD_NAME = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME
const UPLOAD_PRESET = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET

const MAX_IMAGE_SIZE = 10 * 1024 * 1024   // 10 MB
const MAX_VIDEO_SIZE = 100 * 1024 * 1024   // 100 MB
const MAX_AUDIO_SIZE = 50 * 1024 * 1024    // 50 MB

export function detectMediaType(file: File): MediaType {
    if (file.type.startsWith('image/')) return 'image'
    if (file.type.startsWith('video/')) return 'video'
    if (file.type.startsWith('audio/')) return 'audio'
    throw new Error('Unsupported file type. Please upload an image, video, or audio file.')
}

export function validateFileSize(file: File, mediaType: MediaType): void {
    const limits: Record<MediaType, number> = {
        image: MAX_IMAGE_SIZE,
        video: MAX_VIDEO_SIZE,
        audio: MAX_AUDIO_SIZE,
    }
    const maxSize = limits[mediaType]
    if (file.size > maxSize) {
        const maxMB = Math.round(maxSize / (1024 * 1024))
        throw new Error(`File is too large. Maximum size for ${mediaType} is ${maxMB} MB.`)
    }
}

export async function uploadToCloudinary(
    file: File,
    onProgress?: (progress: UploadProgress) => void
): Promise<{ secure_url: string; public_id: string; media_type: MediaType }> {
    const mediaType = detectMediaType(file)
    validateFileSize(file, mediaType)

    if (!CLOUD_NAME || !UPLOAD_PRESET) {
        throw new Error('Cloudinary credentials not configured. Set VITE_CLOUDINARY_CLOUD_NAME and VITE_CLOUDINARY_UPLOAD_PRESET in .env')
    }

    const resourceType = mediaType === 'audio' ? 'video' : mediaType

    onProgress?.({ status: 'uploading', progress: 0 })

    const formData = new FormData()
    formData.append('file', file)
    formData.append('upload_preset', UPLOAD_PRESET)
    formData.append('folder', 'clubspace')

    return new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest()
        xhr.open('POST', `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/${resourceType}/upload`)

        xhr.upload.addEventListener('progress', (e) => {
            if (e.lengthComputable) {
                const progress = Math.round((e.loaded / e.total) * 100)
                onProgress?.({ status: 'uploading', progress })
            }
        })

        xhr.addEventListener('load', () => {
            if (xhr.status >= 200 && xhr.status < 300) {
                const data = JSON.parse(xhr.responseText)
                onProgress?.({ status: 'done', progress: 100 })
                resolve({
                    secure_url: data.secure_url,
                    public_id: data.public_id,
                    media_type: mediaType,
                })
            } else {
                const error = 'Upload failed. Please try again.'
                onProgress?.({ status: 'error', progress: 0, error })
                reject(new Error(error))
            }
        })

        xhr.addEventListener('error', () => {
            const error = 'Network error during upload. Please check your connection.'
            onProgress?.({ status: 'error', progress: 0, error })
            reject(new Error(error))
        })

        xhr.send(formData)
    })
}
