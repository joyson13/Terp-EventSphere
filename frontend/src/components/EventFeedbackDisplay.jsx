import { useState, useEffect } from 'react'
import { eventService } from '../services/api'
import Spinner from './Spinner'
import toast from 'react-hot-toast'
import { FiStar, FiUser } from 'react-icons/fi'
import { formatDistanceToNow } from 'date-fns'

const EventFeedbackDisplay = ({ eventId }) => {
  const [feedback, setFeedback] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchFeedback()
  }, [eventId])

  const fetchFeedback = async () => {
    setLoading(true)
    try {
      const response = await eventService.getEventFeedback(eventId)
      setFeedback(response.data)
    } catch (error) {
      toast.error('Failed to load feedback')
      console.error('Error fetching feedback:', error)
    } finally {
      setLoading(false)
    }
  }

  const getAverageRating = () => {
    if (feedback.length === 0) return 0
    const sum = feedback.reduce((acc, f) => acc + f.rating, 0)
    return (sum / feedback.length).toFixed(1)
  }

  const formatTime = (dateString) => {
    try {
      return formatDistanceToNow(new Date(dateString), { addSuffix: true })
    } catch {
      return 'Recently'
    }
  }

  if (loading) {
    return <Spinner />
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
      <div className="mb-6">
        <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
          Event Feedback
        </h3>
        {feedback.length > 0 && (
          <div className="flex items-center space-x-4">
            <div className="flex items-center">
              <span className="text-2xl font-bold text-gray-900 dark:text-white">
                {getAverageRating()}
              </span>
              <div className="flex items-center ml-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <FiStar
                    key={star}
                    className={`w-5 h-5 ${
                      star <= Math.round(getAverageRating())
                        ? 'text-yellow-400 fill-current'
                        : 'text-gray-300 dark:text-gray-600'
                    }`}
                  />
                ))}
              </div>
            </div>
            <span className="text-sm text-gray-600 dark:text-gray-400">
              Based on {feedback.length} {feedback.length === 1 ? 'review' : 'reviews'}
            </span>
          </div>
        )}
      </div>

      {feedback.length === 0 ? (
        <div className="text-center py-8 text-gray-500 dark:text-gray-400">
          <p>No feedback yet for this event.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {feedback.map((item) => (
            <div
              key={item.feedback_id}
              className="border border-gray-200 dark:border-gray-700 rounded-lg p-4"
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center space-x-2">
                  <FiUser className="w-5 h-5 text-gray-500 dark:text-gray-400" />
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">
                      {item.participant_name}
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {item.participant_email}
                    </p>
                  </div>
                </div>
                <div className="flex items-center">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <FiStar
                      key={star}
                      className={`w-4 h-4 ${
                        star <= item.rating
                          ? 'text-yellow-400 fill-current'
                          : 'text-gray-300 dark:text-gray-600'
                      }`}
                    />
                  ))}
                </div>
              </div>
              {item.comment && (
                <p className="text-gray-700 dark:text-gray-300 mt-2">{item.comment}</p>
              )}
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                {formatTime(item.created_at)}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default EventFeedbackDisplay

