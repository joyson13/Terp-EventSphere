import { Link } from 'react-router-dom'
import { FiCalendar, FiMapPin, FiUsers } from 'react-icons/fi'

const EventCard = ({ event }) => {
  const formatDate = (dateString) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'published':
        return 'bg-green-100 text-green-800'
      case 'draft':
        return 'bg-gray-100 text-gray-800'
      case 'cancelled':
        return 'bg-red-100 text-red-800'
      case 'completed':
        return 'bg-blue-100 text-blue-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <Link to={`/event/${event.event_id}`}>
      <div className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow duration-300 overflow-hidden border border-gray-200">
        <div className="p-6">
          <div className="flex items-start justify-between mb-3">
            <h3 className="text-xl font-semibold text-gray-900 line-clamp-2">
              {event.title}
            </h3>
            <span
              className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(
                event.status
              )}`}
            >
              {event.status}
            </span>
          </div>

          {event.description && (
            <p className="text-gray-600 text-sm mb-4 line-clamp-2">{event.description}</p>
          )}

          <div className="space-y-2">
            <div className="flex items-center text-gray-600 text-sm">
              <FiCalendar className="mr-2 text-maryland-red" />
              <span>{formatDate(event.start_time)}</span>
            </div>

            <div className="flex items-center text-gray-600 text-sm">
              <FiMapPin className="mr-2 text-maryland-red" />
              <span>{event.location}</span>
            </div>

            <div className="flex items-center text-gray-600 text-sm">
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

