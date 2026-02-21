import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { AuthProvider } from './context/AuthContext'
import { NotificationProvider } from './context/NotificationContext'
import { AppLayout } from './components/layout/AppLayout'
import { ProtectedRoute } from './components/ProtectedRoute'
import { LoginPage } from './pages/LoginPage'
import { RegisterPage } from './pages/RegisterPage'
import { ForgotPasswordPage } from './pages/ForgotPasswordPage'
import { ResetPasswordPage } from './pages/ResetPasswordPage'
import { EmailConfirmedPage } from './pages/EmailConfirmedPage'
import { FeedPage } from './pages/FeedPage'
import { ProfilePage } from './pages/ProfilePage'
import { LeaderboardPage } from './pages/LeaderboardPage'
import { AdminPage } from './pages/AdminPage'
import { UploadPage } from './pages/UploadPage'
import { MessagesPage } from './pages/MessagesPage'
import { SettingsPage } from './pages/SettingsPage'
import { GalleryPage } from './pages/GalleryPage'
import { NotFoundPage } from './pages/NotFoundPage'

const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            staleTime: 1000 * 60 * 2, // 2 minutes
            retry: 1,
        },
    },
})

function App() {
    return (
        <QueryClientProvider client={queryClient}>
            <AuthProvider>
                <NotificationProvider>
                    <BrowserRouter>
                        <Routes>
                            {/* Public Routes */}
                            <Route path="/login" element={<LoginPage />} />
                            <Route path="/register" element={<RegisterPage />} />
                            <Route path="/forgot-password" element={<ForgotPasswordPage />} />
                            <Route path="/reset-password" element={<ResetPasswordPage />} />
                            <Route path="/email-confirmed" element={<EmailConfirmedPage />} />

                            {/* Protected Routes */}
                            <Route element={
                                <ProtectedRoute>
                                    <AppLayout />
                                </ProtectedRoute>
                            }>
                                <Route index element={<FeedPage />} />
                                <Route path="profile" element={<ProfilePage />} />
                                <Route path="profile/:userId" element={<ProfilePage />} />
                                <Route path="leaderboard" element={<LeaderboardPage />} />
                                <Route path="upload" element={<UploadPage />} />
                                <Route path="admin" element={
                                    <ProtectedRoute requiredRole="admin">
                                        <AdminPage />
                                    </ProtectedRoute>
                                } />
                                <Route path="messages" element={<MessagesPage />} />
                                <Route path="settings" element={<SettingsPage />} />
                                <Route path="gallery" element={<GalleryPage />} />
                                <Route path="*" element={<NotFoundPage />} />
                            </Route>

                            {/* Catch-all 404 for unauthenticated users */}
                            <Route path="*" element={<NotFoundPage />} />
                        </Routes>
                    </BrowserRouter>
                </NotificationProvider>
            </AuthProvider>
        </QueryClientProvider>
    )
}

export default App

