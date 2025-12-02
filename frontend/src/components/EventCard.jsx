import { Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { FiCalendar, FiMapPin, FiUsers } from 'react-icons/fi'
import { formatDateEST } from '../utils/timezone'

const EventCard = ({ event }) => {
  const { user } = useAuth()
  // Only show status to organizers and admins
  const showStatus = user?.role === 'event_organizer' || user?.role === 'administrator'

  const getStatusColor = (status) => {
    switch (status) {
      case 'published':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
      case 'draft':
        return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200'
      case 'cancelled':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
      case 'completed':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200'
    }
  }

  return (
    <Link to={`/event/${event.event_id}`}>
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md hover:shadow-lg transition-shadow duration-300 overflow-hidden border border-gray-200 dark:border-gray-700">
        <div className="p-6">
          <div className="flex items-start justify-between mb-3">
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white line-clamp-2">
              {event.title}
            </h3>
            {showStatus && (
              <span
                className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(
                  event.status
                )}`}
              >
                {event.status}
              </span>
            )}
          </div>

          {event.description && (
            <p className="text-gray-600 dark:text-gray-300 text-sm mb-4 line-clamp-2">{event.description}</p>
          )}

          <div className="space-y-2">
            <div className="flex items-center text-gray-600 dark:text-gray-300 text-sm">
              <FiCalendar className="mr-2 text-maryland-red" />
              <span>{formatDateEST(event.start_time)}</span>
            </div>

            <div className="flex items-center text-gray-600 dark:text-gray-300 text-sm">
              <FiMapPin className="mr-2 text-maryland-red" />
              <span>{event.location}</span>
            </div>

            <div className="flex items-center text-gray-600 dark:text-gray-300 text-sm">
              <FiUsers className="mr-2 text-maryland-red" />
              <span>
                Capacity: {event.capacity} | Organizer: {event.organizer_name}
              </span>
            </div>
          </div>
        </div>
      </div>
    </Link>
  )
}

export default EventCard

