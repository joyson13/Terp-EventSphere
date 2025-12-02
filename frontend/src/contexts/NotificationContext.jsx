import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { useAuth } from './AuthContext'
import { io } from 'socket.io-client'
import { notificationService } from '../services/api'

const NotificationContext = createContext(null)

export const useNotifications = () => {
  const context = useContext(NotificationContext)
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider')
  }
  return context
}

export const NotificationProvider = ({ children }) => {
  const { isAuthenticated, token } = useAuth()
  const [notifications, setNotifications] = useState([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [socket, setSocket] = useState(null)

  // Fetch notifications from API
  const fetchNotifications = useCallback(async () => {
    if (!isAuthenticated) return

    try {
      const [notificationsRes, countRes] = await Promise.all([
        notificationService.getNotifications(),
        notificationService.getUnreadCount()
      ])
      setNotifications(notificationsRes.data)
      setUnreadCount(countRes.data.count)
    } catch (error) {
      console.error('Error fetching notifications:', error)
    } finally {
      setLoading(false)
    }
  }, [isAuthenticated])

  // Initialize WebSocket connection
  useEffect(() => {
    if (!isAuthenticated || !token) {
      setLoading(false)
      return
    }

    const NOTIFICATION_SERVICE_URL = import.meta.env.VITE_NOTIFICATION_SERVICE_URL || 'http://localhost:3004'
    const newSocket = io(NOTIFICATION_SERVICE_URL, {
      auth: { token },
      transports: ['websocket', 'polling']
    })

    newSocket.on('connect', () => {
      console.log('Connected to notification service')
    })

    newSocket.on('disconnect', () => {
      console.log('Disconnected from notification service')
    })

    newSocket.on('notification', (notification) => {
      // Add new notification to the list
      setNotifications((prev) => [notification, ...prev])
      // Increment unread count
      setUnreadCount((prev) => prev + 1)
    })

    setSocket(newSocket)

    // Fetch initial notifications
    fetchNotifications()

    return () => {
      newSocket.close()
    }
  }, [isAuthenticated, token, fetchNotifications])

  // Mark notification as read
  const markAsRead = useCallback(async (notificationId) => {
    try {
      await notificationService.markAsRead(notificationId)
      setNotifications((prev) =>
        prev.map((n) =>
          n.notification_id === notificationId ? { ...n, read: true } : n
        )
      )
      setUnreadCount((prev) => Math.max(0, prev - 1))
    } catch (error) {
      console.error('Error marking notification as read:', error)
    }
  }, [])

  // Mark all notifications as read
  const markAllAsRead = useCallback(async () => {
    try {
      await notificationService.markAllAsRead()
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })))
      setUnreadCount(0)
    } catch (error) {
      console.error('Error marking all notifications as read:', error)
    }
  }, [])

  // Delete notification
  const deleteNotification = useCallback(async (notificationId) => {
    try {
      await notificationService.deleteNotification(notificationId)
      setNotifications((prev) => prev.filter((n) => n.notification_id !== notificationId))
      // Decrement unread count if notification was unread
      const notification = notifications.find((n) => n.notification_id === notificationId)
      if (notification && !notification.read) {
        setUnreadCount((prev) => Math.max(0, prev - 1))
      }
    } catch (error) {
      console.error('Error deleting notification:', error)
    }
  }, [notifications])

  // Refresh notifications
  const refreshNotifications = useCallback(() => {
    fetchNotifications()
  }, [fetchNotifications])

  const value = {
    notifications,
    unreadCount,
    loading,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    refreshNotifications
  }

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  )
}

