import { createContext, useContext, useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../services/api'

const AuthContext = createContext(null)

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [token, setToken] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Check for stored token on mount
    const storedToken = localStorage.getItem('token')
    const storedUser = localStorage.getItem('user')

    if (storedToken && storedUser) {
      setToken(storedToken)
      setUser(JSON.parse(storedUser))
      api.defaults.headers.common['Authorization'] = `Bearer ${storedToken}`
    }
    setLoading(false)
  }, [])

  const login = (userData, tokenData) => {
    setUser(userData)
    setToken(tokenData)
    localStorage.setItem('token', tokenData)
    localStorage.setItem('user', JSON.stringify(userData))
    api.defaults.headers.common['Authorization'] = `Bearer ${tokenData}`
  }

  const logout = () => {
    setUser(null)
    setToken(null)
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    delete api.defaults.headers.common['Authorization']
  }

  const isAuthenticated = !!user && !!token

  const value = {
    user,
    token,
    isAuthenticated,
    login,
    logout,
    loading,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

