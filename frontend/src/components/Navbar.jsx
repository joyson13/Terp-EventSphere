import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { useState, useEffect } from 'react'
import { FiLogOut, FiUser, FiLayout, FiShield, FiSun, FiMoon, FiCalendar } from 'react-icons/fi'
import NotificationDropdown from './NotificationDropdown'

const Navbar = () => {
  const { isAuthenticated, user, logout } = useAuth()
  const navigate = useNavigate()
  const [darkMode, setDarkMode] = useState(false)

  useEffect(() => {
    // Check localStorage for saved theme preference
    const savedTheme = localStorage.getItem('theme')
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
    
    if (savedTheme === 'dark' || (!savedTheme && prefersDark)) {
      setDarkMode(true)
      document.documentElement.classList.add('dark')
    } else {
      setDarkMode(false)
      document.documentElement.classList.remove('dark')
    }
  }, [])

  const toggleDarkMode = () => {
    const newDarkMode = !darkMode
    setDarkMode(newDarkMode)
    
    if (newDarkMode) {
      document.documentElement.classList.add('dark')
      localStorage.setItem('theme', 'dark')
    } else {
      document.documentElement.classList.remove('dark')
      localStorage.setItem('theme', 'light')
    }
  }

  const handleLogout = () => {
    logout()
    navigate('/')
  }

  return (
    <nav className="bg-white dark:bg-gray-800 shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <Link to="/" className="flex items-center space-x-2">
            <span className="text-2xl font-bold text-maryland-red">Terp EventSphere</span>
          </Link>

          <div className="flex items-center space-x-4">
            <button
              onClick={toggleDarkMode}
              className="p-2 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition"
              title={darkMode ? 'Switch to light mode' : 'Switch to dark mode'}
            >
              {darkMode ? <FiSun className="w-5 h-5" /> : <FiMoon className="w-5 h-5" />}
            </button>
            {isAuthenticated && <NotificationDropdown />}
            {!isAuthenticated ? (
              <>
                <Link
                  to="/login"
                  className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:text-maryland-red dark:hover:text-red-400 transition rounded-lg"
                >
                  Login
                </Link>
                <Link
                  to="/register"
                  className="px-4 py-2 bg-maryland-red text-white rounded-lg hover:bg-red-700 transition"
                >
                  Register
                </Link>
              </>
            ) : (
              <>
                <Link
                  to="/profile"
                  className="flex items-center space-x-1 px-4 py-2 text-gray-700 dark:text-gray-300 hover:text-maryland-red dark:hover:text-red-400 transition rounded-lg"
                >
                  <FiUser />
                  <span>Profile</span>
                </Link>
                {user?.role === 'participant' && (
                  <Link
                    to="/calendar"
                    className="flex items-center space-x-1 px-4 py-2 text-gray-700 dark:text-gray-300 hover:text-maryland-red dark:hover:text-red-400 transition rounded-lg"
                  >
                    <FiCalendar />
                    <span>Calendar</span>
                  </Link>
                )}
                {user?.role === 'event_organizer' && (
                  <Link
                    to="/dashboard"
                    className="flex items-center space-x-1 px-4 py-2 text-gray-700 dark:text-gray-300 hover:text-maryland-red dark:hover:text-red-400 transition rounded-lg"
                  >
                    <FiLayout />
                    <span>Dashboard</span>
                  </Link>
                )}
                {user?.role === 'administrator' && (
                  <Link
                    to="/admin"
                    className="flex items-center space-x-1 px-4 py-2 text-gray-700 dark:text-gray-300 hover:text-maryland-red dark:hover:text-red-400 transition rounded-lg"
                  >
                    <FiShield />
                    <span>Admin</span>
                  </Link>
                )}
                <button
                  onClick={handleLogout}
                  className="flex items-center space-x-1 px-4 py-2 text-gray-700 dark:text-gray-300 hover:text-maryland-red dark:hover:text-red-400 transition rounded-lg"
                >
                  <FiLogOut />
                  <span>Logout</span>
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  )
}

export default Navbar

