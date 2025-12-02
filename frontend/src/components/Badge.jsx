import { FiAward } from 'react-icons/fi'
import { formatDateESTShort } from '../utils/timezone'

const Badge = ({ badge }) => {
  const formatDate = (dateString) => {
    // Extract just the date part (without time) for badge display
    const estDate = new Date(new Date(dateString).getTime() - 5 * 60 * 60 * 1000)
    return estDate.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    })
  }

  return (
    <div className="bg-gradient-to-br from-maryland-gold to-yellow-400 rounded-lg p-4 shadow-md hover:shadow-lg transition-shadow">
      <div className="flex flex-col items-center text-center">
        <div className="bg-white rounded-full p-4 mb-3">
          <FiAward className="text-4xl text-maryland-red" />
        </div>
        <h3 className="font-semibold text-gray-900 text-sm mb-1 line-clamp-2">
          {badge.event_name || badge.event_title}
        </h3>
        <p className="text-xs text-gray-700 mb-2">Earned</p>
        <p className="text-xs text-gray-600">{formatDate(badge.date_earned)}</p>
      </div>
    </div>
  )
}

export default Badge

