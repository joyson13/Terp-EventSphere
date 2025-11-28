const userRepository = require('../repositories/userRepository');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');

class UserService {
  async getAllUsers() {
    return await userRepository.findAll();
  }

  async getUserById(userId) {
    return await userRepository.findById(userId);
  }

  async createUser(userData) {
    // Business logic validation
    if (!userData.email || !userData.name || !userData.password || !userData.role) {
      throw new Error('Missing required fields: email, name, password, role');
    }

    if (!['participant', 'event_organizer', 'administrator'].includes(userData.role)) {
      throw new Error('Invalid role. Must be: participant, event_organizer, or administrator');
    }

    return await userRepository.create(userData);
  }

  /**
   * Register a new user (FR-1)
   * @param {Object} userData - { email, password, role, name }
   */
  async register(userData) {
    // Validation
    if (!userData.name || !userData.email || !userData.password || !userData.role) {
      throw new Error('Missing required fields: name, email, password, role');
    }

    if (!['participant', 'event_organizer', 'administrator'].includes(userData.role)) {
      throw new Error('Invalid role. Must be: participant, event_organizer, or administrator');
    }

    // Check if user already exists
    const existingUser = await userRepository.findByEmail(userData.email);
    if (existingUser) {
      throw new Error('User with this email already exists');
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(userData.password, 10);

    // Insert user
    const user = await userRepository.create({
      name: userData.name,
      email: userData.email,
      password: hashedPassword,
      role: userData.role
    });

    // Return the newly created user without password
    return user;
  }

  /**
   * Login user and generate JWT (FR-2)
   * @param {Object} credentials - { email, password }
   * @returns {Object} - { token, user }
   */
  async login(credentials) {
    if (!credentials.email || !credentials.password) {
      throw new Error('Email and password are required');
    }

    // Find user by email
    const user = await userRepository.findByEmail(credentials.email);
    if (!user) {
      throw new Error('Invalid email or password');
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(credentials.password, user.hashed_password);
    if (!isValidPassword) {
      throw new Error('Invalid email or password');
    }

    // Generate JWT token
    const token = jwt.sign(
      {
        userID: user.user_id,
        role: user.role
      },
      process.env.JWT_SECRET,
      {
        expiresIn: process.env.JWT_EXPIRES_IN || '24h'
      }
    );

    // Return token and user (without password)
    return {
      token,
      user: {
        userID: user.user_id,
        email: user.email,
        name: user.name,
        role: user.role
      }
    };
  }

  /**
   * Get user profile (FR-3)
   * @param {string} userId - User ID
   */
  async getProfile(userId) {
    const user = await userRepository.findById(userId);
    if (!user) {
      throw new Error('User not found');
    }
    return user;
  }

  /**
   * Update user profile (FR-3)
   * @param {string} userId - User ID
   * @param {Object} userData - Profile data to update
   */
  async updateProfile(userId, userData) {
    // Don't allow role changes through profile update
    if (userData.role) {
      delete userData.role;
    }

    return await userRepository.update(userId, userData);
  }

  /**
   * Request password reset token (FR-4)
   * @param {string} email - User email
   */
  async requestPasswordReset(email) {
    if (!email) {
      throw new Error('Email is required');
    }

    const user = await userRepository.findByEmail(email);
    if (!user) {
      // Don't reveal if user exists for security
      return { message: 'If the email exists, a password reset link has been sent' };
    }

    // Generate reset token
    const resetToken = uuidv4();
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 1); // Token expires in 1 hour

    // Save reset token
    await userRepository.savePasswordResetToken(user.user_id, resetToken, expiresAt);

    // In production, send email with reset link
    // For now, we'll return the token (in production, this should be sent via email)
    return {
      message: 'Password reset token generated',
      resetToken: resetToken, // Remove this in production - send via email only
      expiresAt: expiresAt
    };
  }

  /**
   * Reset password using token (FR-4)
   * @param {string} resetToken - Password reset token
   * @param {string} newPassword - New password
   */
  async resetPassword(resetToken, newPassword) {
    if (!resetToken || !newPassword) {
      throw new Error('Reset token and new password are required');
    }

    // Find token
    const tokenData = await userRepository.findPasswordResetToken(resetToken);
    if (!tokenData) {
      throw new Error('Invalid or expired reset token');
    }

    // Check if token is expired
    if (new Date() > new Date(tokenData.expires_at)) {
      throw new Error('Reset token has expired');
    }

    // Update password
    await userRepository.update(tokenData.user_id, { password: newPassword });

    // Delete used token
    await userRepository.deletePasswordResetToken(resetToken);

    return { message: 'Password reset successfully' };
  }

  async updateUser(userId, userData) {
    return await userRepository.update(userId, userData);
  }

  async deleteUser(userId) {
    return await userRepository.softDelete(userId);
  }
}

module.exports = new UserService();

