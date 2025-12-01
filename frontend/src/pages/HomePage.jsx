import { useState, useEffect } from 'react'
import { eventService } from '../services/api'
import EventCard from '../components/EventCard'
import Spinner from '../components/Spinner'
import toast from 'react-hot-toast'
import DatePicker from 'react-datepicker'
import 'react-datepicker/dist/react-datepicker.css'
import { FiSearch, FiFilter } from 'react-icons/fi'
import { UMD_BUILDINGS } from '../constants/umdBuildings'

const HomePage = () => {
  const [events, setEvents] = useState([])
  const [filteredEvents, setFilteredEvents] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchKeyword, setSearchKeyword] = useState('')
  const [selectedDate, setSelectedDate] = useState(null)
  const [selectedBuilding, setSelectedBuilding] = useState('')

  useEffect(() => {
    fetchEvents()
  }, [])

  useEffect(() => {
    applyFilters()
  }, [events, searchKeyword, selectedDate, selectedBuilding])

  const fetchEvents = async () => {
    setLoading(true)
    try {
      const response = await eventService.getAllEvents()
      // Only show published events
      const publishedEvents = response.data.filter((event) => event.status === 'published')
      setEvents(publishedEvents)
      setFilteredEvents(publishedEvents)
    } catch (error) {
      toast.error('Failed to load events')
      console.error('Error fetching events:', error)
    } finally {
      setLoading(false)
    }
  }

  const applyFilters = () => {
    let filtered = [...events]

    // Filter by keyword (title, description, location)
    if (searchKeyword) {
      const keyword = searchKeyword.toLowerCase()
      filtered = filtered.filter(
        (event) =>
          event.title?.toLowerCase().includes(keyword) ||
          event.description?.toLowerCase().includes(keyword) ||
          event.location?.toLowerCase().includes(keyword)
      )
    }

    // Filter by date
    if (selectedDate) {
      const filterDate = new Date(selectedDate)
      filterDate.setHours(0, 0, 0, 0)
      filtered = filtered.filter((event) => {
        const eventDate = new Date(event.start_time)
        eventDate.setHours(0, 0, 0, 0)
        return eventDate.getTime() === filterDate.getTime()
      })
    }

    // Filter by building
    if (selectedBuilding) {
      filtered = filtered.filter((event) =>
        event.location?.toLowerCase().includes(selectedBuilding.toLowerCase())
      )
    }

    setFilteredEvents(filtered)
  }

  const clearFilters = () => {
    setSearchKeyword('')
    setSelectedDate(null)
    setSelectedBuilding('')
  }

  if (loading) {
    return <Spinner />
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">Discover Events</h1>
          <p className="text-gray-600 dark:text-gray-400">Find and register for events at University of Maryland</p>
        </div>

        {/* Filter Bar */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-8">
          <div className="flex items-center mb-4">
            <FiFilter className="text-maryland-red mr-2" />
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Filters</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Search by keyword */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Search by keyword
              </label>
              <div className="relative">
                <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  value={searchKeyword}
                  onChange={(e) => setSearchKeyword(e.target.value)}
                  placeholder="Search events..."
                  className="pl-10 w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-maryland-red focus:border-maryland-red dark:bg-gray-700 dark:text-white"
                />
              </div>
            </div>

            {/* Filter by date */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Filter by date
              </label>
              <DatePicker
                selected={selectedDate}
                onChange={(date) => setSelectedDate(date)}
                dateFormat="MMMM d, yyyy"
                placeholderText="Select a date"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-maryland-red focus:border-maryland-red"
                isClearable
              />
            </div>

            {/* Filter by building */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Filter by building
              </label>
              <select
                value={selectedBuilding}
                onChange={(e) => setSelectedBuilding(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-maryland-red focus:border-maryland-red dark:bg-gray-700 dark:text-white"
              >
                <option value="">All buildings</option>
                {UMD_BUILDINGS.map((building) => (
                  <option key={building} value={building}>
                    {building}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {(searchKeyword || selectedDate || selectedBuilding) && (
            <div className="mt-4">
              <button
                onClick={clearFilters}
                className="text-sm text-maryland-red hover:text-red-700 font-medium"
              >
                Clear all filters
              </button>
            </div>
          )}
        </div>

        {/* Events Grid */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-semibold text-gray-900">
              Events ({filteredEvents.length})
            </h2>
          </div>

          {filteredEvents.length === 0 ? (
            <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-lg shadow-md">
              <p className="text-gray-600 dark:text-gray-300 text-lg">No events found</p>
              <p className="text-gray-500 dark:text-gray-400 text-sm mt-2">
                Try adjusting your filters or check back later
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredEvents.map((event) => (
                <EventCard key={event.event_id} event={event} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default HomePage

