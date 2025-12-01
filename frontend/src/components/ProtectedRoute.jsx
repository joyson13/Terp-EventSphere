import { Navigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import Spinner from './Spinner'

const ProtectedRoute = ({ children, requiredRole }) => {
  const { isAuthenticated, user, loading } = useAuth()

  if (loading) {
    return <Spinner />
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  if (requiredRole && user?.role !== requiredRole) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-maryland-red mb-4">Access Denied</h1>
          <p className="text-gray-600 dark:text-gray-400 mb-4">You do not have permission to access this page.</p>
          <p className="text-gray-500 dark:text-gray-500 text-sm">Required role: {requiredRole}</p>
        </div>
      </div>
    )
  }

  return children
}

export default ProtectedRoute

