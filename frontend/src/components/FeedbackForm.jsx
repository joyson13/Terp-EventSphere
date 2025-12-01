import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { useAuth } from '../contexts/AuthContext'
import { eventService } from '../services/api'
import toast from 'react-hot-toast'
import { FiStar } from 'react-icons/fi'

const FeedbackForm = ({ eventId, onFeedbackSubmitted }) => {
  const { user } = useAuth()
  const [existingFeedback, setExistingFeedback] = useState(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
    reset
  } = useForm()

  const rating = watch('rating')

  useEffect(() => {
    fetchExistingFeedback()
  }, [eventId])

  const fetchExistingFeedback = async () => {
    try {
      const response = await eventService.getParticipantFeedback(eventId)
      if (response.data) {
        setExistingFeedback(response.data)
        setValue('rating', response.data.rating)
        setValue('comment', response.data.comment || '')
      }
    } catch (error) {
      console.error('Error fetching feedback:', error)
    } finally {
      setLoading(false)
    }
  }

  const onSubmit = async (data) => {
    setSubmitting(true)
    try {
      if (existingFeedback) {
        await eventService.updateFeedback(existingFeedback.feedback_id, {
          rating: parseInt(data.rating),
          comment: data.comment
        })
        toast.success('Feedback updated successfully')
      } else {
        await eventService.createFeedback(eventId, {
          rating: parseInt(data.rating),
          comment: data.comment
        })
        toast.success('Feedback submitted successfully')
      }
      await fetchExistingFeedback()
      if (onFeedbackSubmitted) {
        onFeedbackSubmitted()
      }
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to submit feedback')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return <div className="text-gray-500 dark:text-gray-400">Loading...</div>
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
      <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
        {existingFeedback ? 'Update Your Feedback' : 'Leave Feedback'}
      </h3>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Rating *
          </label>
          <div className="flex items-center space-x-2">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                onClick={() => setValue('rating', star)}
                className={`${
                  rating >= star
                    ? 'text-yellow-400'
                    : 'text-gray-300 dark:text-gray-600'
                } hover:text-yellow-400 transition`}
              >
                <FiStar className="w-6 h-6 fill-current" />
              </button>
            ))}
            {rating && (
              <span className="ml-2 text-sm text-gray-600 dark:text-gray-400">
                {rating} out of 5
              </span>
            )}
          </div>
          <input
            type="hidden"
            {...register('rating', {
              required: 'Rating is required',
              min: { value: 1, message: 'Rating must be at least 1' },
              max: { value: 5, message: 'Rating must be at most 5' }
            })}
          />
          {errors.rating && (
            <p className="mt-1 text-sm text-red-600 dark:text-red-400">
              {errors.rating.message}
            </p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Comment
          </label>
          <textarea
            {...register('comment')}
            rows={4}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-maryland-red focus:border-maryland-red dark:bg-gray-700 dark:text-white"
            placeholder="Share your thoughts about this event..."
          />
        </div>

        <button
          type="submit"
          disabled={submitting}
          className="px-6 py-2 bg-maryland-red text-white rounded-lg hover:bg-red-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {submitting
            ? 'Submitting...'
            : existingFeedback
            ? 'Update Feedback'
            : 'Submit Feedback'}
        </button>
      </form>
    </div>
  )
}

export default FeedbackForm

