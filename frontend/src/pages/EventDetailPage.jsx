import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { eventService } from '../services/api'
import RegistrationButton from '../components/RegistrationButton'
import Spinner from '../components/Spinner'
import toast from 'react-hot-toast'
import { FiCalendar, FiMapPin, FiUsers, FiUser, FiArrowLeft } from 'react-icons/fi'

const EventDetailPage = () => {
  const { id } = useParams()
  const [event, setEvent] = useState(null)
  const [loading, setLoading] = useState(true)
  const [registrations, setRegistrations] = useState([])

  useEffect(() => {
    fetchEventDetails()
    fetchRegistrations()
  }, [id])

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

  const formatDate = (dateString) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
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

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <Link
          to="/"
          className="inline-flex items-center text-maryland-red hover:text-red-700 mb-6"
        >
          <FiArrowLeft className="mr-2" />
          Back to Events
        </Link>

        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="p-8">
            <div className="mb-6">
              <h1 className="text-4xl font-bold text-gray-900 mb-4">{event.title}</h1>
              <span
                className={`inline-block px-3 py-1 text-sm font-medium rounded-full ${
                  event.status === 'published'
                    ? 'bg-green-100 text-green-800'
                    : 'bg-gray-100 text-gray-800'
                }`}
              >
                {event.status}
              </span>
            </div>

            {event.description && (
              <div className="mb-6">
                <p className="text-gray-700 text-lg leading-relaxed">{event.description}</p>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              <div className="flex items-start">
                <FiCalendar className="text-maryland-red mr-3 mt-1 flex-shrink-0" />
                <div>
                  <p className="text-sm font-medium text-gray-500">Date & Time</p>
                  <p className="text-gray-900">{formatDate(event.start_time)}</p>
                </div>
              </div>

              <div className="flex items-start">
                <FiMapPin className="text-maryland-red mr-3 mt-1 flex-shrink-0" />
                <div>
                  <p className="text-sm font-medium text-gray-500">Location</p>
                  <a
                    href={getGoogleMapsLink(event.location)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-maryland-red hover:text-red-700 hover:underline"
                  >
                    {event.location}
                  </a>
                </div>
              </div>

              <div className="flex items-start">
                <FiUsers className="text-maryland-red mr-3 mt-1 flex-shrink-0" />
                <div>
                  <p className="text-sm font-medium text-gray-500">Capacity</p>
                  <p className="text-gray-900">
                    {getConfirmedCount()} / {event.capacity} registered
                  </p>
                  <p className="text-sm text-gray-600">
                    {remainingCapacity} spots remaining
                  </p>
                </div>
              </div>

              <div className="flex items-start">
                <FiUser className="text-maryland-red mr-3 mt-1 flex-shrink-0" />
                <div>
                  <p className="text-sm font-medium text-gray-500">Organizer</p>
                  <p className="text-gray-900">{event.organizer_name}</p>
                  <p className="text-sm text-gray-600">{event.organizer_email}</p>
                </div>
              </div>
            </div>

            <div className="border-t pt-6">
              <RegistrationButton event={event} />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default EventDetailPage

