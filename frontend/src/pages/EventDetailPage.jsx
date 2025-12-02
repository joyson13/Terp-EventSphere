import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { eventService, registrationService } from '../services/api'
import RegistrationButton from '../components/RegistrationButton'
import FeedbackForm from '../components/FeedbackForm'
import EventFeedbackDisplay from '../components/EventFeedbackDisplay'
import Spinner from '../components/Spinner'
import toast from 'react-hot-toast'
import { FiCalendar, FiMapPin, FiUsers, FiUser, FiArrowLeft, FiX } from 'react-icons/fi'
import { formatDateESTLong } from '../utils/timezone'

const EventDetailPage = () => {
  const { id } = useParams()
  const { user } = useAuth()
  const [event, setEvent] = useState(null)
  const [loading, setLoading] = useState(true)
  const [registrations, setRegistrations] = useState([])
  const [userRegistration, setUserRegistration] = useState(null)

  useEffect(() => {
    fetchEventDetails()
    fetchRegistrations()
    if (user?.userID) {
      fetchUserRegistration()
    }
  }, [id, user])

  const fetchEventDetails = async () => {
    setLoading(true)
    try {
      const response = await eventService.getEventById(id)
      setEvent(response.data)
    } catch (error) {
      toast.error('Failed to load event details')
      console.error('Error fetching event:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchRegistrations = async () => {
    try {
      const response = await eventService.getEventRegistrations(id)
      setRegistrations(response.data)
    } catch (error) {
      console.error('Error fetching registrations:', error)
    }
  }

  const fetchUserRegistration = async () => {
    try {
      const response = await registrationService.getParticipantRegistrations(user.userID)
      const registration = response.data.find(
        (reg) => reg.event_id === id && reg.status !== 'cancelled_by_user' && reg.status !== 'cancelled'
      )
      setUserRegistration(registration || null)
    } catch (error) {
      console.error('Error fetching user registration:', error)
    }
  }

  const handleCancelRegistration = async () => {
    if (!userRegistration) return
    
    if (!window.confirm(`Are you sure you want to cancel your registration for "${event?.title}"?`)) {
      return
    }

    try {
      await registrationService.cancelRegistration(userRegistration.registration_id)
      toast.success('Registration cancelled successfully')
      setUserRegistration(null)
      fetchRegistrations()
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to cancel registration')
    }
  }

  const getGoogleMapsLink = (location) => {
    const encodedLocation = encodeURIComponent(`${location}, University of Maryland, College Park, MD`)
    return `https://www.google.com/maps/search/?api=1&query=${encodedLocation}`
  }

  const getConfirmedCount = () => {
    return registrations.filter((reg) => reg.status === 'confirmed').length
  }

  const remainingCapacity = event ? event.capacity - getConfirmedCount() : 0

  if (loading) {
    return <Spinner />
  }

  if (!event) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-maryland-red mb-4">Event Not Found</h1>
          <Link to="/" className="text-maryland-red hover:text-red-700">
            ← Back to Events
          </Link>
        </div>
      </div>
    )
  }

  // Only show status to organizers and admins
  const showStatus = user?.role === 'event_organizer' || user?.role === 'administrator'

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <Link
          to="/"
          className="inline-flex items-center text-maryland-red hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 mb-6"
        >
          <FiArrowLeft className="mr-2" />
          Back to Events
        </Link>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden">
          <div className="p-8">
            <div className="mb-6">
              <div className="flex items-start justify-between">
                <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">{event.title}</h1>
                {userRegistration && (
                  <button
                    onClick={handleCancelRegistration}
                    className="flex items-center px-4 py-2 text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300 border border-red-600 dark:border-red-400 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition"
                    title="Cancel Registration"
                  >
                    <FiX className="mr-2" />
                    Cancel Registration
                  </button>
                )}
              </div>
              {showStatus && (
                <span
                  className={`inline-block px-3 py-1 text-sm font-medium rounded-full ${
                    event.status === 'published'
                      ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                      : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200'
                  }`}
                >
                  {event.status}
                </span>
              )}
            </div>

            {event.description && (
              <div className="mb-6">
                <p className="text-gray-700 dark:text-gray-300 text-lg leading-relaxed">{event.description}</p>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              <div className="flex items-start">
                <FiCalendar className="text-maryland-red mr-3 mt-1 flex-shrink-0" />
                <div>
                  <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Date & Time</p>
                  <p className="text-gray-900 dark:text-white">{formatDateESTLong(event.start_time)}</p>
                </div>
              </div>

              <div className="flex items-start">
                <FiMapPin className="text-maryland-red mr-3 mt-1 flex-shrink-0" />
                <div>
                  <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Location</p>
                  <a
                    href={getGoogleMapsLink(event.location)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-maryland-red hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 hover:underline"
                  >
                    {event.location}
                  </a>
                </div>
              </div>

              <div className="flex items-start">
                <FiUsers className="text-maryland-red mr-3 mt-1 flex-shrink-0" />
                <div>
                  <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Capacity</p>
                  <p className="text-gray-900 dark:text-white">
                    {getConfirmedCount()} / {event.capacity} registered
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {remainingCapacity} spots remaining
                  </p>
                </div>
              </div>

              <div className="flex items-start">
                <FiUser className="text-maryland-red mr-3 mt-1 flex-shrink-0" />
                <div>
                  <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Organizer</p>
                  <p className="text-gray-900 dark:text-white">{event.organizer_name}</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">{event.organizer_email}</p>
                </div>
              </div>
            </div>

            <div className="border-t dark:border-gray-700 pt-6">
              <RegistrationButton event={event} onRegistrationChange={fetchUserRegistration} />
            </div>

            {/* Feedback Form - Only show for registered participants */}
            {user?.role === 'participant' && userRegistration && (
              <div className="border-t dark:border-gray-700 pt-6 mt-6">
                <FeedbackForm eventId={id} />
              </div>
            )}

            {/* Feedback Display - Only show for organizers */}
            {(user?.role === 'event_organizer' || user?.role === 'administrator') && 
             event.organizer_id === user?.userID && (
              <div className="border-t dark:border-gray-700 pt-6 mt-6">
                <EventFeedbackDisplay eventId={id} />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default EventDetailPage


