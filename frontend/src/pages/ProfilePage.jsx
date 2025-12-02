import { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { userService, registrationService, passportService, eventService } from '../services/api'
import Spinner from '../components/Spinner'
import toast from 'react-hot-toast'
import { FiUser, FiMail, FiAward, FiX } from 'react-icons/fi'
import Badge from '../components/Badge'
import { formatDateEST } from '../utils/timezone'

const ProfilePage = () => {
  const { user } = useAuth()
  const [profile, setProfile] = useState(null)
  const [passport, setPassport] = useState(null)
  const [registrations, setRegistrations] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchProfile()
    fetchPassport()
    fetchRegistrations()
  }, [])

  const fetchProfile = async () => {
    try {
      const response = await userService.getProfile()
      setProfile(response.data)
    } catch (error) {
      toast.error('Failed to load profile')
      console.error('Error fetching profile:', error)
    }
  }

  const fetchPassport = async () => {
    try {
      const response = await passportService.getPassport()
      setPassport(response.data)
    } catch (error) {
      console.error('Error fetching passport:', error)
    }
  }

  const fetchRegistrations = async () => {
    try {
      const response = await registrationService.getParticipantRegistrations(user.userID)
      // Filter out cancelled registrations and fetch QR codes for each
      const activeRegistrations = response.data.filter(
        (reg) => reg.status !== 'cancelled_by_user' && reg.status !== 'cancelled'
      )
      
      // Fetch QR codes and event details for each registration
      const registrationsWithDetails = await Promise.all(
        activeRegistrations.map(async (reg) => {
          try {
            const [qrResponse, eventResponse] = await Promise.all([
              registrationService.getQRCode(reg.registration_id),
              eventService.getEventById(reg.event_id).catch(() => null),
            ])
            return {
              ...reg,
              qrCode: qrResponse.data,
              event: eventResponse?.data || null,
            }
          } catch (error) {
            console.error(`Error fetching details for registration ${reg.registration_id}:`, error)
            return {
              ...reg,
              qrCode: null,
              event: null,
            }
          }
        })
      )
      
      setRegistrations(registrationsWithDetails)
    } catch (error) {
      console.error('Error fetching registrations:', error)
      toast.error('Failed to load registrations')
    } finally {
      setLoading(false)
    }
  }

  const handleCancelRegistration = async (registrationId, eventTitle) => {
    if (!window.confirm(`Are you sure you want to cancel your registration for "${eventTitle}"?`)) {
      return
    }

    try {
      await registrationService.cancelRegistration(registrationId)
      toast.success('Registration cancelled successfully')
      // Refresh registrations
      fetchRegistrations()
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to cancel registration')
    }
  }

  if (loading) {
    return <Spinner />
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-8">My Profile</h1>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Column 1: My Info */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-6">My Information</h2>

            <div className="space-y-4 mb-6">
              <div className="flex items-center">
                <FiUser className="text-maryland-red mr-3" />
                <div>
                  <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Name</p>
                  <p className="text-gray-900 dark:text-white">{profile?.name || user?.name}</p>
                </div>
              </div>

              <div className="flex items-center">
                <FiMail className="text-maryland-red mr-3" />
                <div>
                  <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Email</p>
                  <p className="text-gray-900 dark:text-white">{profile?.email || user?.email}</p>
                </div>
              </div>

              <div className="flex items-center">
                <FiUser className="text-maryland-red mr-3" />
                <div>
                  <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Role</p>
                  <p className="text-gray-900 dark:text-white capitalize">{user?.role || profile?.role}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Column 2: Terrapin Passport */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
            <div className="flex items-center mb-6">
              <FiAward className="text-maryland-gold mr-3 text-2xl" />
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">My Terrapin Passport</h2>
            </div>

            {passport && passport.badges && passport.badges.length > 0 ? (
              <div>
                <p className="text-gray-600 dark:text-gray-300 mb-4">
                  You have earned {passport.badges.length} badge{passport.badges.length !== 1 ? 's' : ''}
                </p>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {passport.badges.map((badge) => (
                    <Badge key={badge.badge_id} badge={badge} />
                  ))}
                </div>
              </div>
            ) : (
              <div className="text-center py-12">
                <FiAward className="text-gray-300 dark:text-gray-600 text-6xl mx-auto mb-4" />
                <p className="text-gray-600 dark:text-gray-300 text-lg">No badges yet</p>
                <p className="text-gray-500 dark:text-gray-400 text-sm mt-2">
                  Check in to events to earn badges!
                </p>
              </div>
            )}
          </div>
        </div>

        {/* My Registrations with QR Codes */}
        <div className="mt-8 bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
          <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-6">My Event Registrations</h2>
          
          {registrations.length === 0 ? (
            <p className="text-gray-500 dark:text-gray-400 text-center py-8">
              No active registrations. Register for an event to see your QR codes here.
            </p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {registrations.map((registration) => (
                <div
                  key={registration.registration_id}
                  className="border border-gray-200 dark:border-gray-700 rounded-lg p-4"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900 dark:text-white text-lg">
                        {registration.event?.title || 'Event'}
                      </h3>
                      {registration.event && (
                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                          {formatDateEST(registration.event.start_time)}
                        </p>
                      )}
                      <p className="text-xs text-gray-500 dark:text-gray-500 mt-1 capitalize">
                        Status: {registration.status}
                      </p>
                    </div>
                    <button
                      onClick={() => handleCancelRegistration(registration.registration_id, registration.event?.title || 'Event')}
                      className="ml-2 text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300"
                      title="Cancel Registration"
                    >
                      <FiX className="w-5 h-5" />
                    </button>
                  </div>
                  
                  {registration.qrCode?.qr_code_data ? (
                    <div className="flex flex-col items-center mt-4">
                      <img
                        src={registration.qrCode.qr_code_data}
                        alt={`QR Code for ${registration.event?.title || 'Event'}`}
                        className="w-48 h-48 border-2 border-gray-200 dark:border-gray-700 rounded-lg p-2 bg-white"
                      />
                      <p className="text-xs text-gray-600 dark:text-gray-400 mt-2 text-center">
                        Show this QR code at event check-in
                      </p>
                    </div>
                  ) : (
                    <p className="text-sm text-gray-500 dark:text-gray-400 text-center mt-4">
                      QR code loading...
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default ProfilePage

