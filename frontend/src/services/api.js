import axios from 'axios'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001',
  headers: {
    'Content-Type': 'application/json',
  },
})

// Add token to requests if available
const token = localStorage.getItem('token')
if (token) {
  api.defaults.headers.common['Authorization'] = `Bearer ${token}`
}

// Request interceptor to add token to all requests
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Service base URLs from environment variables
const USER_SERVICE_URL = import.meta.env.VITE_USER_SERVICE_URL || 'http://localhost:3001'
const EVENT_SERVICE_URL = import.meta.env.VITE_EVENT_SERVICE_URL || 'http://localhost:3002'
const REGISTRATION_SERVICE_URL = import.meta.env.VITE_REGISTRATION_SERVICE_URL || 'http://localhost:3003'
const NOTIFICATION_SERVICE_URL = import.meta.env.VITE_NOTIFICATION_SERVICE_URL || 'http://localhost:3004'

// Event Service API
export const eventService = {
  getAllEvents: () => api.get(`${EVENT_SERVICE_URL}/api/events`),
  getEventById: (id) => api.get(`${EVENT_SERVICE_URL}/api/events/${id}`),
  registerForEvent: (id) => api.post(`${EVENT_SERVICE_URL}/api/events/${id}/register`),
  createEvent: (data) => api.post(`${EVENT_SERVICE_URL}/api/events`, data),
  updateEvent: (id, data) => api.put(`${EVENT_SERVICE_URL}/api/events/${id}`, data),
  publishEvent: (id) => api.put(`${EVENT_SERVICE_URL}/api/events/${id}/publish`),
  cancelEvent: (id) => api.delete(`${EVENT_SERVICE_URL}/api/events/${id}`),
  getEventRegistrations: (id) => api.get(`${EVENT_SERVICE_URL}/api/events/${id}/registrations`),
  createFeedback: (eventId, data) => api.post(`${EVENT_SERVICE_URL}/api/events/${eventId}/feedback`, data),
  getParticipantFeedback: (eventId) => api.get(`${EVENT_SERVICE_URL}/api/events/${eventId}/feedback`),
  getEventFeedback: (eventId) => api.get(`${EVENT_SERVICE_URL}/api/events/${eventId}/feedback/organizer`),
  updateFeedback: (id, data) => api.put(`${EVENT_SERVICE_URL}/api/events/feedback/${id}`, data),
}

// User Service API
export const userService = {
  login: (credentials) => api.post(`${USER_SERVICE_URL}/api/users/login`, credentials),
  register: (userData) => api.post(`${USER_SERVICE_URL}/api/users/register`, userData),
  getProfile: () => api.get(`${USER_SERVICE_URL}/api/users/profile`),
  updateProfile: (data) => api.put(`${USER_SERVICE_URL}/api/users/profile`, data),
  getAllUsers: () => api.get(`${USER_SERVICE_URL}/api/users/admin/users`),
  deleteUser: (id) => api.delete(`${USER_SERVICE_URL}/api/users/admin/users/${id}`),
}

// Registration Service API
export const registrationService = {
  getQRCode: (regId) => api.get(`${REGISTRATION_SERVICE_URL}/api/registrations/${regId}/qr`),
  cancelRegistration: (id) => api.delete(`${REGISTRATION_SERVICE_URL}/api/registrations/${id}/cancel`),
  getParticipantRegistrations: (participantId) => 
    api.get(`${REGISTRATION_SERVICE_URL}/api/registrations/participant/${participantId}`),
  checkIn: (qrCodeData) => api.post(`${REGISTRATION_SERVICE_URL}/api/checkin`, { qrCodeData }),
}

// Passport Service API
export const passportService = {
  getPassport: () => api.get(`${REGISTRATION_SERVICE_URL}/api/passport`),
}

// Notification Service API
export const notificationService = {
  getNotifications: (params) => api.get(`${NOTIFICATION_SERVICE_URL}/api/notifications`, { params }),
  getUnreadCount: () => api.get(`${NOTIFICATION_SERVICE_URL}/api/notifications/unread-count`),
  markAsRead: (id) => api.put(`${NOTIFICATION_SERVICE_URL}/api/notifications/${id}/read`),
  markAllAsRead: () => api.put(`${NOTIFICATION_SERVICE_URL}/api/notifications/read-all`),
  deleteNotification: (id) => api.delete(`${NOTIFICATION_SERVICE_URL}/api/notifications/${id}`),
}

export default api

