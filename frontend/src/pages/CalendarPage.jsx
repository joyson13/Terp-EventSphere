import { useState, useEffect } from 'react'
import { Calendar, momentLocalizer } from 'react-big-calendar'
import moment from 'moment'
import 'react-big-calendar/lib/css/react-big-calendar.css'
import { useAuth } from '../contexts/AuthContext'
import { registrationService, eventService } from '../services/api'
import Spinner from '../components/Spinner'
import toast from 'react-hot-toast'
import { useNavigate } from 'react-router-dom'
import { FiCalendar } from 'react-icons/fi'

const localizer = momentLocalizer(moment)

const CalendarPage = () => {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [events, setEvents] = useState([])
  const [loading, setLoading] = useState(true)
  const [view, setView] = useState('month')
  const [date, setDate] = useState(new Date())

  useEffect(() => {
    if (user?.userID) {
      fetchRegisteredEvents()
    }
  }, [user])

  const fetchRegisteredEvents = async () => {
    setLoading(true)
    try {
      // Get all registrations for the participant
      const registrationsResponse = await registrationService.getParticipantRegistrations(
        user.userID
      )

      // Filter only confirmed registrations and upcoming events
      const confirmedRegistrations = registrationsResponse.data.filter(
        (reg) =>
          reg.status === 'confirmed' &&
          new Date(reg.event_start_time) > new Date()
      )

      // Fetch event details for each registration
      const eventsWithDetails = await Promise.all(
        confirmedRegistrations.map(async (reg) => {
          try {
            const eventResponse = await eventService.getEventById(reg.event_id)
            const event = eventResponse.data
            return {
              id: reg.registration_id,
              title: event.title,
              start: new Date(event.start_time),
              end: new Date(new Date(event.start_time).getTime() + 2 * 60 * 60 * 1000), // 2 hours default
              resource: {
                eventId: event.event_id,
                location: event.location,
                registrationId: reg.registration_id
              }
            }
          } catch (error) {
            console.error(`Error fetching event ${reg.event_id}:`, error)
            return null
          }
        })
      )

      // Filter out null values
      setEvents(eventsWithDetails.filter((e) => e !== null))
    } catch (error) {
      toast.error('Failed to load events')
      console.error('Error fetching registered events:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSelectEvent = (event) => {
    navigate(`/event/${event.resource.eventId}`)
  }

  const eventStyleGetter = (event) => {
    return {
      style: {
        backgroundColor: '#E03A3E', // Maryland red
        borderColor: '#C02E32',
        color: 'white',
        borderRadius: '4px',
        border: 'none',
        padding: '2px 4px'
      }
    }
  }

  if (loading) {
    return <Spinner />
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
            My Calendar
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            View your registered events
          </p>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setView('month')}
                className={`px-4 py-2 rounded-lg transition ${
                  view === 'month'
                    ? 'bg-maryland-red text-white'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
              >
                <FiCalendar className="inline mr-2" />
                Month
              </button>
              <button
                onClick={() => setView('week')}
                className={`px-4 py-2 rounded-lg transition ${
                  view === 'week'
                    ? 'bg-maryland-red text-white'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
              >
                Week
              </button>
              <button
                onClick={() => setView('day')}
                className={`px-4 py-2 rounded-lg transition ${
                  view === 'day'
                    ? 'bg-maryland-red text-white'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
              >
                Day
              </button>
            </div>
          </div>

          {events.length === 0 ? (
            <div className="text-center py-12">
              <FiCalendar className="w-16 h-16 mx-auto text-gray-400 dark:text-gray-500 mb-4" />
              <p className="text-gray-600 dark:text-gray-400 text-lg">
                No upcoming registered events
              </p>
              <p className="text-gray-500 dark:text-gray-500 text-sm mt-2">
                Register for events to see them on your calendar
              </p>
            </div>
          ) : (
            <div style={{ height: '600px' }}>
              <Calendar
                localizer={localizer}
                events={events}
                startAccessor="start"
                endAccessor="end"
                view={view}
                onView={setView}
                date={date}
                onNavigate={setDate}
                onSelectEvent={handleSelectEvent}
                eventPropGetter={eventStyleGetter}
                popup
                className="dark:bg-gray-800"
              />
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default CalendarPage

