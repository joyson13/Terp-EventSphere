import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { eventService, registrationService } from '../services/api'
import toast from 'react-hot-toast'
import { FiUserCheck, FiClock, FiXCircle } from 'react-icons/fi'

const RegistrationButton = ({ event, onRegistrationChange }) => {
  const { isAuthenticated, user } = useAuth()
  const [registrationStatus, setRegistrationStatus] = useState(null)
  const [loading, setLoading] = useState(false)
  const [checkingStatus, setCheckingStatus] = useState(true)

  useEffect(() => {
    if (isAuthenticated && event) {
      checkRegistrationStatus()
    } else {
      setCheckingStatus(false)
    }
  }, [isAuthenticated, event, user])

  const checkRegistrationStatus = async () => {
    if (!user?.userID) return

    try {
      // Get user's registrations for this event
      const response = await registrationService.getParticipantRegistrations(user.userID)
      // Filter out cancelled registrations
      const registration = response.data.find(
        (reg) => reg.event_id === event.event_id && reg.status !== 'cancelled_by_user' && reg.status !== 'cancelled'
      )

      if (registration) {
        setRegistrationStatus({
          type: 'registered',
          status: registration.status,
        })
      } else {
        // Check waitlist
        // Note: We'd need a waitlist endpoint, for now assume not on waitlist if not registered
        setRegistrationStatus({ type: 'none' })
      }
    } catch (error) {
      console.error('Error checking registration status:', error)
      setRegistrationStatus({ type: 'none' })
    } finally {
      setCheckingStatus(false)
    }
  }

  const handleRegister = async () => {
    if (!isAuthenticated) {
      return
    }

    setLoading(true)
    try {
      const response = await eventService.registerForEvent(event.event_id)

      if (response.data.status === 'confirmed') {
        toast.success('Registration confirmed!')
        setRegistrationStatus({ type: 'registered', status: 'confirmed' })
        if (onRegistrationChange) {
          onRegistrationChange()
        }
      } else if (response.data.status === 'waitlisted') {
        toast.success(`You are on the waitlist! Position: ${response.data.position}`)
        setRegistrationStatus({ type: 'waitlisted', position: response.data.position })
        if (onRegistrationChange) {
          onRegistrationChange()
        }
      }
    } catch (error) {
      if (error.response?.data?.error === 'Event is Full') {
        toast.error('Event is full')
      } else if (error.response?.data?.error?.includes('Already')) {
        toast.error(error.response.data.error)
      } else {
        toast.error(error.response?.data?.error || 'Registration failed')
      }
    } finally {
      setLoading(false)
    }
  }

  const getConfirmedCount = () => {
    // This would ideally come from the event data
    // For now, we'll estimate based on capacity
    return 0 // Placeholder
  }

  const isFull = getConfirmedCount() >= event.capacity

  if (checkingStatus) {
    return (
      <div className="flex justify-center">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-maryland-red"></div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return (
      <Link
        to="/login"
        className="w-full flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-maryland-red hover:bg-red-700 transition"
      >
        Login to Register
      </Link>
    )
  }

  if (registrationStatus?.type === 'registered') {
    return (
      <button
        disabled
        className="w-full flex items-center justify-center px-6 py-3 border border-gray-300 text-base font-medium rounded-md text-gray-700 bg-gray-100 cursor-not-allowed"
      >
        <FiUserCheck className="mr-2" />
        Already Registered ({registrationStatus.status})
      </button>
    )
  }

  if (registrationStatus?.type === 'waitlisted') {
    return (
      <button
        disabled
        className="w-full flex items-center justify-center px-6 py-3 border border-gray-300 text-base font-medium rounded-md text-gray-700 bg-gray-100 cursor-not-allowed"
      >
        <FiClock className="mr-2" />
        You are on the waitlist (Position: {registrationStatus.position})
      </button>
    )
  }

  if (isFull && event.waitlist_enabled) {
    return (
      <button
        onClick={handleRegister}
        disabled={loading}
        className="w-full flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-maryland-gold hover:bg-yellow-500 transition disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loading ? 'Processing...' : (
          <>
            <FiClock className="mr-2" />
            Join Waitlist
          </>
        )}
      </button>
    )
  }

  if (isFull && !event.waitlist_enabled) {
    return (
      <button
        disabled
        className="w-full flex items-center justify-center px-6 py-3 border border-gray-300 text-base font-medium rounded-md text-gray-700 bg-gray-100 cursor-not-allowed"
      >
        <FiXCircle className="mr-2" />
        Event is Full
      </button>
    )
  }

  return (
    <button
      onClick={handleRegister}
      disabled={loading}
      className="w-full flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-maryland-red hover:bg-red-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
    >
      {loading ? 'Registering...' : (
        <>
          <FiUserCheck className="mr-2" />
          Register
        </>
      )}
    </button>
  )
}

export default RegistrationButton

