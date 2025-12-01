const { query } = require('../../../shared/db/config');
const bcrypt = require('bcrypt');
const { v4: uuidv4 } = require('uuid');

class UserRepository {
  async findAll() {
    const result = await query(
      `SELECT user_id, email, name, role, created_at, updated_at 
       FROM users 
       WHERE deleted_at IS NULL 
       ORDER BY created_at DESC`
    );
    return result.rows;
  }

  async findById(userId) {
    const result = await query(
      `SELECT user_id, email, name, role, created_at, updated_at 
       FROM users 
       WHERE user_id = $1 AND deleted_at IS NULL`,
      [userId]
    );
    return result.rows[0] || null;
  }

  async findByEmail(email) {
    const result = await query(
      `SELECT user_id, email, name, role, hashed_password, created_at, updated_at 
       FROM users 
       WHERE email = $1 AND deleted_at IS NULL`,
      [email]
    );
    return result.rows[0] || null;
  }

  async create(userData) {
    const userId = uuidv4();
    const hashedPassword = await bcrypt.hash(userData.password, 10);

    // Start transaction
    const client = await require('../../../shared/db/config').getClient();
    
    try {
      await client.query('BEGIN');

      // Insert into users table
      await client.query(
        `INSERT INTO users (user_id, email, name, role, hashed_password)
         VALUES ($1, $2, $3, $4, $5)`,
        [userId, userData.email, userData.name, userData.role, hashedPassword]
      );

      // Insert into role-specific table
      if (userData.role === 'participant') {
        await client.query(
          `INSERT INTO participants (user_id) VALUES ($1)`,
          [userId]
        );

        // Create passport for participant (FR-20 requirement)
        const passportId = uuidv4();
        await client.query(
          `INSERT INTO terrapin_passports (passport_id, participant_id)
           VALUES ($1, $2)`,
          [passportId, userId]
        );

        // Update participant's passport_id reference
        await client.query(
          `UPDATE participants 
           SET passport_id = $1 
           WHERE user_id = $2`,
          [passportId, userId]
        );
      } else if (userData.role === 'event_organizer') {
        await client.query(
          `INSERT INTO event_organizers (user_id) VALUES ($1)`,
          [userId]
        );
      } else if (userData.role === 'administrator') {
        await client.query(
          `INSERT INTO administrators (user_id) VALUES ($1)`,
          [userId]
        );
      }

      await client.query('COMMIT');

      // Return user without password
      const user = await this.findById(userId);
      return user;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  async update(userId, userData) {
    const updates = [];
    const values = [];
    let paramCount = 1;

    if (userData.name) {
      updates.push(`name = $${paramCount++}`);
      values.push(userData.name);
    }

    if (userData.email) {
      updates.push(`email = $${paramCount++}`);
      values.push(userData.email);
    }

    if (userData.password) {
      const hashedPassword = await bcrypt.hash(userData.password, 10);
      updates.push(`hashed_password = $${paramCount++}`);
      values.push(hashedPassword);
    }

    if (updates.length === 0) {
      return await this.findById(userId);
    }

    values.push(userId);
    const result = await query(
      `UPDATE users 
       SET ${updates.join(', ')} 
       WHERE user_id = $${paramCount} AND deleted_at IS NULL
       RETURNING user_id, email, name, role, created_at, updated_at`,
      values
    );

    return result.rows[0] || null;
  }

  async softDelete(userId) {
    const result = await query(
      `UPDATE users 
       SET deleted_at = CURRENT_TIMESTAMP 
       WHERE user_id = $1 AND deleted_at IS NULL
       RETURNING user_id`,
      [userId]
    );
    return result.rows[0] || null;
  }

  /**
   * Save password reset token
   * @param {string} userId - User ID
   * @param {string} token - Reset token
   * @param {Date} expiresAt - Expiration date
   */
  async savePasswordResetToken(userId, token, expiresAt) {
    // Delete any existing tokens for this user
    await query(
      `DELETE FROM password_reset_tokens WHERE user_id = $1`,
      [userId]
    );

    // Insert new token
    await query(
      `INSERT INTO password_reset_tokens (user_id, token, expires_at)
       VALUES ($1, $2, $3)`,
      [userId, token, expiresAt]
    );
  }

  /**
   * Find password reset token
   * @param {string} token - Reset token
   */
  async findPasswordResetToken(token) {
    const result = await query(
      `SELECT user_id, token, expires_at, created_at
       FROM password_reset_tokens
       WHERE token = $1 AND used = false`,
      [token]
    );
    return result.rows[0] || null;
  }

  /**
   * Delete password reset token (mark as used)
   * @param {string} token - Reset token
   */
  async deletePasswordResetToken(token) {
    await query(
      `UPDATE password_reset_tokens 
       SET used = true 
       WHERE token = $1`,
      [token]
    );
  }
}

module.exports = new UserRepository();

