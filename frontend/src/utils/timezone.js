// Timezone utility functions - Force EST (Eastern Standard Time) year-round
// EST is UTC-5 (no DST)

/**
 * Convert UTC date to EST (subtract 5 hours)
 * @param {Date|string} date - Date to convert
 * @returns {Date} Date in EST
 */
const toEST = (date) => {
  const d = new Date(date)
  // EST is UTC-5, so subtract 5 hours (5 * 60 * 60 * 1000 milliseconds)
  return new Date(d.getTime() - 5 * 60 * 60 * 1000)
}

/**
 * Convert UTC date to EST string
 * @param {Date|string} date - Date to convert
 * @returns {string} Formatted date string in EST
 */
export const formatDateEST = (date) => {
  const estDate = toEST(date)
  
  return estDate.toLocaleDateString('en-US', {
    weekday: 'short',
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }) + ' EST'
}

/**
 * Convert UTC date to EST string (long format)
 * @param {Date|string} date - Date to convert
 * @returns {string} Formatted date string in EST
 */
export const formatDateESTLong = (date) => {
  const estDate = toEST(date)
  
  return estDate.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }) + ' EST'
}

/**
 * Convert UTC date to EST string (short format for tables)
 * @param {Date|string} date - Date to convert
 * @returns {string} Formatted date string in EST
 */
export const formatDateESTShort = (date) => {
  const estDate = toEST(date)
  
  return estDate.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }) + ' EST'
}

/**
 * Get EST timezone label
 * @returns {string} "EST"
 */
export const getTimezoneLabel = () => 'EST'

