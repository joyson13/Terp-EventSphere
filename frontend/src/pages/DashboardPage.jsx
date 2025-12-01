import { useState, useEffect } from 'react'
import { useForm, Controller } from 'react-hook-form'
import { useAuth } from '../contexts/AuthContext'
import { eventService } from '../services/api'
import Spinner from '../components/Spinner'
import toast from 'react-hot-toast'
import DatePicker from 'react-datepicker'
import 'react-datepicker/dist/react-datepicker.css'
import { FiPlus, FiEdit, FiX, FiEye, FiCalendar, FiMapPin, FiUsers, FiChevronDown } from 'react-icons/fi'
import { UMD_BUILDINGS } from '../constants/umdBuildings'
import { formatDateESTShort } from '../utils/timezone'

const DashboardPage = () => {
  const { user } = useAuth()
  const [events, setEvents] = useState([])
  const [loading, setLoading] = useState(true)
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [editingEvent, setEditingEvent] = useState(null)
  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    control,
    formState: { errors },
  } = useForm()

  useEffect(() => {
    fetchMyEvents()
  }, [])

  const fetchMyEvents = async () => {
    setLoading(true)
    try {
      const response = await eventService.getAllEvents()
      // Filter events created by current organizer
      const myEvents = response.data.filter(
        (event) => event.organizer_id === user?.userID
      )
      setEvents(myEvents)
    } catch (error) {
      toast.error('Failed to load events')
      console.error('Error fetching events:', error)
    } finally {
      setLoading(false)
    }
  }

  const onSubmit = async (data) => {
    try {
      if (!data.startTime) {
        toast.error('Please select a start time')
        return
      }
      
      if (editingEvent) {
        await eventService.updateEvent(editingEvent.event_id, {
          title: data.title,
          description: data.description,
          location: data.location,
          capacity: parseInt(data.capacity),
          startTime: data.startTime,
        })
        toast.success('Event updated successfully')
      } else {
        await eventService.createEvent({
          title: data.title,
          description: data.description,
          location: data.location,
          capacity: parseInt(data.capacity),
          startTime: data.startTime,
          waitlistEnabled: data.waitlistEnabled === 'true',
        })
        toast.success('Event created successfully')
      }
      reset()
      setShowCreateForm(false)
      setEditingEvent(null)
      fetchMyEvents()
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to save event')
    }
  }

  const handleEdit = (event) => {
    setEditingEvent(event)
    setValue('title', event.title)
    setValue('description', event.description || '')
    setValue('location', event.location)
    setLocationSearch(event.location)
    setValue('capacity', event.capacity)
    setValue('startTime', new Date(event.start_time))
    setValue('waitlistEnabled', event.waitlist_enabled ? 'true' : 'false')
    setShowCreateForm(true)
  }

  const handleCancel = async (eventId) => {
    if (!window.confirm('Are you sure you want to cancel this event?')) {
      return
    }

    try {
      await eventService.cancelEvent(eventId)
      toast.success('Event cancelled successfully')
      fetchMyEvents()
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to cancel event')
    }
  }

  const handlePublish = async (eventId) => {
    try {
      await eventService.publishEvent(eventId)
      toast.success('Event published successfully')
      fetchMyEvents()
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to publish event')
    }
  }

  const getConfirmedCount = (eventId) => {
    // This would ideally come from the event data
    // For now, return 0 as placeholder
    return 0
  }

  const [locationSearch, setLocationSearch] = useState('')
  const [showLocationDropdown, setShowLocationDropdown] = useState(false)

  const filteredBuildings = UMD_BUILDINGS.filter(building =>
    building.toLowerCase().includes(locationSearch.toLowerCase())
  )

  const handleLocationSelect = (building) => {
    setValue('location', building)
    setLocationSearch(building)
    setShowLocationDropdown(false)
  }

  // Close dropdown when clicking outside - MUST be before any early returns
  useEffect(() => {
    const handleClickOutside = () => {
      setShowLocationDropdown(false)
    }
    if (showLocationDropdown) {
      document.addEventListener('click', handleClickOutside)
      return () => document.removeEventListener('click', handleClickOutside)
    }
  }, [showLocationDropdown])

  if (loading) {
    return <Spinner />
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">Event Organizer Dashboard</h1>
          <p className="text-gray-600 dark:text-gray-400">Manage your events</p>
        </div>

        {/* Create Event Form */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">
              {editingEvent ? 'Edit Event' : 'Create New Event'}
            </h2>
            {!showCreateForm && (
              <button
                onClick={() => {
                  setShowCreateForm(true)
                  setEditingEvent(null)
                  reset()
                }}
                className="flex items-center px-4 py-2 bg-maryland-red text-white rounded-lg hover:bg-red-700 transition"
              >
                <FiPlus className="mr-2" />
                Create Event
              </button>
            )}
          </div>

          {showCreateForm && (
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Event Title *
                  </label>
                  <input
                    {...register('title', { required: 'Title is required' })}
                    type="text"
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-maryland-red focus:border-maryland-red dark:bg-gray-700 dark:text-white"
                    placeholder="Event Title"
                  />
                  {errors.title && (
                    <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.title.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Location *
                  </label>
                  <div className="relative">
                    <input
                      {...register('location', { required: 'Location is required' })}
                      type="text"
                      value={locationSearch || watch('location') || ''}
                      onChange={(e) => {
                        setLocationSearch(e.target.value)
                        setValue('location', e.target.value)
                        setShowLocationDropdown(true)
                      }}
                      onFocus={() => setShowLocationDropdown(true)}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-maryland-red focus:border-maryland-red dark:bg-gray-700 dark:text-white"
                      placeholder="Search or type location..."
                    />
                    <FiChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none" />
                    {showLocationDropdown && (
                      <div className="absolute z-10 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md shadow-lg max-h-60 overflow-auto">
                        {filteredBuildings.length > 0 ? (
                          filteredBuildings.map((building) => (
                            <button
                              key={building}
                              type="button"
                              onClick={() => handleLocationSelect(building)}
                              className="w-full text-left px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-900 dark:text-white"
                            >
                              {building}
                            </button>
                          ))
                        ) : (
                          <div className="px-4 py-2 text-gray-500 dark:text-gray-400">
                            No buildings found
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                  {errors.location && (
                    <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.location.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Capacity *
                  </label>
                  <input
                    {...register('capacity', {
                      required: 'Capacity is required',
                      min: { value: 1, message: 'Capacity must be at least 1' },
                    })}
                    type="number"
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-maryland-red focus:border-maryland-red dark:bg-gray-700 dark:text-white"
                    placeholder="100"
                  />
                  {errors.capacity && (
                    <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.capacity.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Start Time * (EST)
                  </label>
                  <Controller
                    name="startTime"
                    control={control}
                    rules={{ required: 'Start time is required' }}
                    render={({ field }) => (
                      <DatePicker
                        selected={field.value || null}
                        onChange={(date) => field.onChange(date)}
                        showTimeSelect
                        timeIntervals={15}
                        minDate={new Date()}
                        dateFormat="MMMM d, yyyy h:mm aa"
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-maryland-red focus:border-maryland-red dark:bg-gray-700 dark:text-white"
                        placeholderText="Select date and time"
                      />
                    )}
                  />
                  {errors.startTime && (
                    <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.startTime.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Waitlist Enabled
                  </label>
                  <select
                    {...register('waitlistEnabled')}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-maryland-red focus:border-maryland-red dark:bg-gray-700 dark:text-white"
                  >
                    <option value="true">Yes</option>
                    <option value="false">No</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Description
                </label>
                <textarea
                  {...register('description')}
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-maryland-red focus:border-maryland-red dark:bg-gray-700 dark:text-white"
                  placeholder="Event description..."
                />
              </div>

              <div className="flex space-x-4">
                <button
                  type="submit"
                  className="px-6 py-2 bg-maryland-red text-white rounded-lg hover:bg-red-700 transition"
                >
                  {editingEvent ? 'Update Event' : 'Create Event'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowCreateForm(false)
                    setEditingEvent(null)
                    reset()
                  }}
                  className="px-6 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition"
                >
                  Cancel
                </button>
              </div>
            </form>
          )}
        </div>

        {/* My Events Table */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden">
          <div className="p-6">
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-6">My Events</h2>

            {events.length === 0 ? (
              <p className="text-gray-600 dark:text-gray-400 text-center py-8">No events created yet</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                  <thead className="bg-gray-50 dark:bg-gray-700">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Event
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Date
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Registrations
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                    {events.map((event) => (
                      <tr key={event.event_id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900 dark:text-white">{event.title}</div>
                          <div className="text-sm text-gray-500 dark:text-gray-400">{event.location}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                          {formatDateESTShort(event.start_time)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span
                            className={`px-2 py-1 text-xs font-medium rounded-full ${
                              event.status === 'published'
                                ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                                : event.status === 'draft'
                                ? 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200'
                                : event.status === 'cancelled'
                                ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                                : 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                            }`}
                          >
                            {event.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                          {getConfirmedCount(event.event_id)} / {event.capacity}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                          {event.status === 'draft' && (
                            <button
                              onClick={() => handlePublish(event.event_id)}
                              className="text-green-600 hover:text-green-900 dark:text-green-400 dark:hover:text-green-300"
                            >
                              Publish
                            </button>
                          )}
                          <button
                            onClick={() => handleEdit(event)}
                            className="text-maryland-red hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
                          >
                            <FiEdit className="inline mr-1" />
                            Edit
                          </button>
                          {event.status !== 'cancelled' && (
                            <button
                              onClick={() => handleCancel(event.event_id)}
                              className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
                            >
                              <FiX className="inline mr-1" />
                              Cancel
                            </button>
                          )}
                          <button
                            onClick={() => window.location.href = `/event/${event.event_id}/checkin`}
                            className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300"
                          >
                            <FiEye className="inline mr-1" />
                            Check-in
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default DashboardPage

