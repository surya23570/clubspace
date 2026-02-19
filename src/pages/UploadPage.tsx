import { UploadModal } from '../components/upload/UploadModal'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

export function UploadPage() {
    const [isOpen, setIsOpen] = useState(true)
    const navigate = useNavigate()

    return (
        <UploadModal
            isOpen={isOpen}
            onClose={() => {
                setIsOpen(false)
                navigate('/')
            }}
            onSuccess={() => {
                navigate('/')
            }}
        />
    )
}
