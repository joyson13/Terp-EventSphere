import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { AuthProvider } from './contexts/AuthContext'
import { NotificationProvider } from './contexts/NotificationContext'
import Layout from './components/Layout'
import ErrorBoundary from './components/ErrorBoundary'
import HomePage from './pages/HomePage'
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import EventDetailPage from './pages/EventDetailPage'
import ProfilePage from './pages/ProfilePage'
import DashboardPage from './pages/DashboardPage'
import AdminPage from './pages/AdminPage'
import CheckInPage from './pages/CheckInPage'
import CalendarPage from './pages/CalendarPage'
import ProtectedRoute from './components/ProtectedRoute'

function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <NotificationProvider>
          <BrowserRouter>
            <Layout>
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />
              <Route path="/event/:id" element={<EventDetailPage />} />
              <Route
                path="/profile"
                element={
                  <ProtectedRoute>
                    <ProfilePage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/calendar"
                element={
                  <ProtectedRoute>
                    <CalendarPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/dashboard"
                element={
                  <ProtectedRoute requiredRole="event_organizer">
                    <DashboardPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin"
                element={
                  <ProtectedRoute requiredRole="administrator">
                    <AdminPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/event/:id/checkin"
                element={
                  <ProtectedRoute requiredRole="event_organizer">
                    <CheckInPage />
                  </ProtectedRoute>
                }
              />
            </Routes>
          </Layout>
          <Toaster position="top-right" />
        </BrowserRouter>
        </NotificationProvider>
      </AuthProvider>
    </ErrorBoundary>
  )
}

export default App

