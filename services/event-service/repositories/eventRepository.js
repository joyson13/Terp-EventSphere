const { query } = require('../../../shared/db/config');
const { v4: uuidv4 } = require('uuid');

class EventRepository {
  async findAll() {
    const result = await query(
      `SELECT e.event_id, e.title, e.location, e.capacity, e.status, e.start_time, 
              e.description, e.organizer_id, e.waitlist_enabled, e.created_at, e.updated_at,
              u.name as organizer_name, u.email as organizer_email
       FROM events e
       JOIN event_organizers eo ON e.organizer_id = eo.user_id
       JOIN users u ON eo.user_id = u.user_id
       WHERE e.deleted_at IS NULL 
       ORDER BY e.start_time ASC`
    );
    return result.rows;
  }

  async findById(eventId) {
    const result = await query(
      `SELECT e.event_id, e.title, e.location, e.capacity, e.status, e.start_time, 
              e.description, e.organizer_id, e.waitlist_enabled, e.created_at, e.updated_at,
              u.name as organizer_name, u.email as organizer_email
       FROM events e
       JOIN event_organizers eo ON e.organizer_id = eo.user_id
       JOIN users u ON eo.user_id = u.user_id
       WHERE e.event_id = $1 AND e.deleted_at IS NULL`,
      [eventId]
    );
    return result.rows[0] || null;
  }

  async create(eventData) {
    const eventId = uuidv4();
    
    const result = await query(
      `INSERT INTO events (event_id, organizer_id, title, location, capacity, status, start_time, description, waitlist_enabled)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       RETURNING event_id, organizer_id, title, location, capacity, status, start_time, description, waitlist_enabled, created_at, updated_at`,
      [
        eventId,
        eventData.organizerId,
        eventData.title,
        eventData.location,
        eventData.capacity,
        eventData.status || 'draft',
        eventData.startTime,
        eventData.description || null,
        eventData.waitlistEnabled !== undefined ? eventData.waitlistEnabled : true
      ]
    );

    return result.rows[0];
  }

  async update(eventId, eventData) {
    const updates = [];
    const values = [];
    let paramCount = 1;

    if (eventData.title) {
      updates.push(`title = $${paramCount++}`);
      values.push(eventData.title);
    }

    if (eventData.location) {
      updates.push(`location = $${paramCount++}`);
      values.push(eventData.location);
    }

    if (eventData.capacity !== undefined) {
      updates.push(`capacity = $${paramCount++}`);
      values.push(eventData.capacity);
    }

    if (eventData.status) {
      updates.push(`status = $${paramCount++}`);
      values.push(eventData.status);
    }

    if (eventData.startTime) {
      updates.push(`start_time = $${paramCount++}`);
      values.push(eventData.startTime);
    }

    if (eventData.description !== undefined) {
      updates.push(`description = $${paramCount++}`);
      values.push(eventData.description);
    }

    if (updates.length === 0) {
      return await this.findById(eventId);
    }

    values.push(eventId);
    const result = await query(
      `UPDATE events 
       SET ${updates.join(', ')} 
       WHERE event_id = $${paramCount} AND deleted_at IS NULL
       RETURNING event_id, organizer_id, title, location, capacity, status, start_time, description, created_at, updated_at`,
      values
    );

    return result.rows[0] || null;
  }

  async softDelete(eventId) {
    const result = await query(
      `UPDATE events 
       SET deleted_at = CURRENT_TIMESTAMP 
       WHERE event_id = $1 AND deleted_at IS NULL
       RETURNING event_id`,
      [eventId]
    );
    return result.rows[0] || null;
  }

  async getRegistrations(eventId) {
    const result = await query(
      `SELECT r.registration_id, r.participant_id, r.event_id, r.status, r.qr_code_data,
              r.created_at, r.updated_at,
              u.name as participant_name, u.email as participant_email
       FROM registrations r
       JOIN participants p ON r.participant_id = p.user_id
       JOIN users u ON p.user_id = u.user_id
       WHERE r.event_id = $1 AND r.deleted_at IS NULL
       ORDER BY r.created_at ASC`,
      [eventId]
    );
    return result.rows;
  }

  async getWaitlist(eventId) {
    const result = await query(
      `SELECT w.entry_id, w.participant_id, w.event_id, w.added_at,
              u.name as participant_name, u.email as participant_email
       FROM waitlist_entries w
       JOIN participants p ON w.participant_id = p.user_id
       JOIN users u ON p.user_id = u.user_id
       WHERE w.event_id = $1 AND w.deleted_at IS NULL
       ORDER BY w.added_at ASC`,
      [eventId]
    );
    return result.rows;
  }

  /**
   * Archive past events (automatic status transition)
   * Changes status from 'published' to 'completed' for events that have passed
   */
  async archivePastEvents() {
    const result = await query(
      `UPDATE events 
       SET status = 'completed', updated_at = CURRENT_TIMESTAMP
       WHERE status = 'published' 
       AND start_time < CURRENT_TIMESTAMP 
       AND deleted_at IS NULL
       RETURNING event_id, title, status, start_time`
    );
    return result.rows;
  }

  async getAdminStats() {
    const [totalEventsRes, publishedRes, draftRes, cancelledRes, completedRes] = await Promise.all([
      query(`SELECT COUNT(*)::int AS count FROM events WHERE deleted_at IS NULL`),
      query(`SELECT COUNT(*)::int AS count FROM events WHERE status='published' AND deleted_at IS NULL`),
      query(`SELECT COUNT(*)::int AS count FROM events WHERE status='draft' AND deleted_at IS NULL`),
      query(`SELECT COUNT(*)::int AS count FROM events WHERE status='cancelled' AND deleted_at IS NULL`),
      query(`SELECT COUNT(*)::int AS count FROM events WHERE status='completed' AND deleted_at IS NULL`),
    ]);

    // Total signups: registrations excluding cancelled
    const signupsRes = await query(
      `SELECT COUNT(*)::int AS count FROM registrations 
       WHERE deleted_at IS NULL 
         AND status NOT IN ('cancelled_by_user','cancelled_by_event','initializing')`
    );

    // Average rating across all feedback
    const avgRatingRes = await query(
      `SELECT COALESCE(ROUND(AVG(rating)::numeric, 2), 0)::float AS avg
       FROM event_feedback WHERE deleted_at IS NULL`
    );

    return {
      totalEvents: totalEventsRes.rows[0]?.count || 0,
      published: publishedRes.rows[0]?.count || 0,
      draft: draftRes.rows[0]?.count || 0,
      cancelled: cancelledRes.rows[0]?.count || 0,
      completed: completedRes.rows[0]?.count || 0,
      totalSignups: signupsRes.rows[0]?.count || 0,
      averageRating: avgRatingRes.rows[0]?.avg || 0,
    };
  }
}

module.exports = new EventRepository();

