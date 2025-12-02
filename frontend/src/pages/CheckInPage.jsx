import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { eventService, registrationService } from '../services/api'
import Spinner from '../components/Spinner'
import toast from 'react-hot-toast'
import { FiArrowLeft, FiCheckCircle, FiXCircle, FiSearch, FiCamera } from 'react-icons/fi'
import { formatDateEST } from '../utils/timezone'

const CheckInPage = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const [event, setEvent] = useState(null)
  const [registrations, setRegistrations] = useState([])
  const [loading, setLoading] = useState(true)
  const [manualEntry, setManualEntry] = useState('')
  const [scanning, setScanning] = useState(false)
  const videoRef = useRef(null)
  const streamRef = useRef(null)
  const [checkInStatus, setCheckInStatus] = useState({}) // Track check-in status by registration ID

  useEffect(() => {
    if (!user || (user.role !== 'event_organizer' && user.role !== 'administrator')) {
      navigate('/')
      return
    }
    fetchEventDetails()
    fetchRegistrations()
  }, [id, user, navigate])

  useEffect(() => {
    return () => {
      // Cleanup camera stream on unmount
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop())
      }
    }
  }, [])

  const fetchEventDetails = async () => {
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
      // Only show confirmed registrations
      const confirmedRegs = response.data.filter(reg => reg.status === 'confirmed' || reg.status === 'attended')
      setRegistrations(confirmedRegs)
      
      // Initialize check-in status
      const statusMap = {}
      confirmedRegs.forEach(reg => {
        statusMap[reg.registration_id] = reg.status === 'attended'
      })
      setCheckInStatus(statusMap)
    } catch (error) {
      console.error('Error fetching registrations:', error)
      toast.error('Failed to load registrations')
    }
  }

  const startScanning = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' } // Use back camera on mobile
      })
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        streamRef.current = stream
        setScanning(true)
      }
    } catch (error) {
      console.error('Error accessing camera:', error)
      toast.error('Failed to access camera. Please check permissions.')
    }
  }

  const stopScanning = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop())
      streamRef.current = null
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null
    }
    setScanning(false)
  }

  const handleQRScan = async (qrData) => {
    try {
      const response = await registrationService.checkIn(qrData)
      toast.success(`Check-in successful for ${response.data.participant_name || 'participant'}`)
      
      // Update check-in status
      setCheckInStatus(prev => ({
        ...prev,
        [response.data.registration_id]: true
      }))
      
      // Refresh registrations
      fetchRegistrations()
    } catch (error) {
      toast.error(error.response?.data?.error || 'Check-in failed')
    }
  }

  const handleManualCheckIn = async () => {
    if (!manualEntry.trim()) {
      toast.error('Please enter a registration ID')
      return
    }

    try {
      const response = await registrationService.checkIn(manualEntry.trim())
      toast.success(`Check-in successful for ${response.data.participant_name || 'participant'}`)
      
      // Update check-in status
      setCheckInStatus(prev => ({
        ...prev,
        [response.data.registration_id]: true
      }))
      
      setManualEntry('')
      fetchRegistrations()
    } catch (error) {
      toast.error(error.response?.data?.error || 'Check-in failed')
    }
  }

  const handleManualCheckInByRegistrationId = async (registrationId) => {
    try {
      const response = await registrationService.checkIn(registrationId)
      toast.success(`Check-in successful for ${response.data.participant_name || 'participant'}`)
      
      // Update check-in status
      setCheckInStatus(prev => ({
        ...prev,
        [response.data.registration_id]: true
      }))
      
      fetchRegistrations()
    } catch (error) {
      toast.error(error.response?.data?.error || 'Check-in failed')
    }
  }

  if (loading) {
    return <Spinner />
  }

  if (!event) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-maryland-red mb-4">Event Not Found</h1>
          <button
            onClick={() => navigate('/dashboard')}
            className="text-maryland-red hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
          >
            ← Back to Dashboard
          </button>
        </div>
      </div>
    )
  }

  const checkedInCount = Object.values(checkInStatus).filter(Boolean).length
  const totalCount = registrations.length

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <button
          onClick={() => navigate('/dashboard')}
          className="inline-flex items-center text-maryland-red hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 mb-6"
        >
          <FiArrowLeft className="mr-2" />
          Back to Dashboard
        </button>

        <div className="mb-6">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">{event.title}</h1>
          <p className="text-gray-600 dark:text-gray-400">
            Check-in Status: {checkedInCount} / {totalCount} checked in
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* QR Scanner Section */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
              QR Code Scanner
            </h2>
            
            {!scanning ? (
              <div className="space-y-4">
                <button
                  onClick={startScanning}
                  className="w-full flex items-center justify-center px-6 py-3 bg-maryland-red text-white rounded-lg hover:bg-red-700 transition"
                >
                  <FiCamera className="mr-2" />
                  Start QR Scanner
                </button>
                <p className="text-sm text-gray-600 dark:text-gray-400 text-center">
                  Click to start camera for QR code scanning
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="relative bg-black rounded-lg overflow-hidden" style={{ aspectRatio: '1' }}>
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    className="w-full h-full object-cover"
                  />
                </div>
                <button
                  onClick={stopScanning}
                  className="w-full px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition"
                >
                  Stop Scanner
                </button>
                <p className="text-sm text-gray-600 dark:text-gray-400 text-center">
                  Point camera at participant's QR code. Manual entry also available below.
                </p>
              </div>
            )}
          </div>

          {/* Manual Entry Section */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
              Manual Check-in
            </h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Registration ID
                </label>
                <div className="flex space-x-2">
                  <input
                    type="text"
                    value={manualEntry}
                    onChange={(e) => setManualEntry(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleManualCheckIn()}
                    placeholder="Enter registration ID"
                    className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-maryland-red focus:border-maryland-red dark:bg-gray-700 dark:text-white"
                  />
                  <button
                    onClick={handleManualCheckIn}
                    className="px-6 py-2 bg-maryland-red text-white rounded-lg hover:bg-red-700 transition flex items-center"
                  >
                    <FiSearch className="mr-2" />
                    Check In
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Registrations List */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
          <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
            Registered Participants ({totalCount})
          </h2>
          
          {registrations.length === 0 ? (
            <p className="text-gray-500 dark:text-gray-400 text-center py-8">
              No registrations found for this event.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-700">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Participant
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Email
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Registration ID
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                  {registrations.map((registration) => {
                    const isCheckedIn = checkInStatus[registration.registration_id] || registration.status === 'attended'
                    return (
                      <tr key={registration.registration_id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                          {registration.participant_name || 'N/A'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                          {registration.participant_email || 'N/A'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400 font-mono">
                          {registration.registration_id.substring(0, 8)}...
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {isCheckedIn ? (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                              <FiCheckCircle className="mr-1" />
                              Checked In
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">
                              <FiXCircle className="mr-1" />
                              Not Checked In
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          {!isCheckedIn && (
                            <button
                              onClick={() => handleManualCheckInByRegistrationId(registration.registration_id)}
                              className="text-maryland-red hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
                            >
                              Check In
                            </button>
                          )}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default CheckInPage


