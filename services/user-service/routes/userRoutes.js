const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { authenticate } = require('../middleware/authMiddleware');
const { requireAdmin } = require('../middleware/adminMiddleware');

// Public routes
/**
 * @swagger
 * /api/users/register:
 *   post:
 *     summary: Register a new user
 *     description: Create a new user account with the provided information. The password will be hashed automatically.
 *     tags: [User Registration]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/RegisterRequest'
 *           examples:
 *             participant:
 *               summary: Register as Participant
 *               value:
 *                 name: "John Doe"
 *                 email: "john@example.com"
 *                 password: "password123"
 *                 role: "participant"
 *             organizer:
 *               summary: Register as Event Organizer
 *               value:
 *                 name: "Jane Smith"
 *                 email: "jane@example.com"
 *                 password: "securepass456"
 *                 role: "event_organizer"
 *             admin:
 *               summary: Register as Administrator
 *               value:
 *                 name: "Admin User"
 *                 email: "admin@example.com"
 *                 password: "adminpass789"
 *                 role: "administrator"
 *     responses:
 *       201:
 *         description: User registered successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/RegisterSuccessResponse'
 *             example:
 *               message: "User registered successfully"
 *               user:
 *                 userID: "123e4567-e89b-12d3-a456-426614174000"
 *                 email: "john@example.com"
 *                 name: "John Doe"
 *                 role: "participant"
 *       400:
 *         description: Bad request - validation error or user already exists
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             examples:
 *               missingFields:
 *                 summary: Missing required fields
 *                 value:
 *                   error: "Missing required fields: name, email, password, role"
 *               userExists:
 *                 summary: User already exists
 *                 value:
 *                   error: "User with this email already exists"
 *               invalidRole:
 *                 summary: Invalid role
 *                 value:
 *                   error: "Invalid role. Must be: participant, event_organizer, or administrator"
 */
router.post('/register', userController.register);
/**
 * @swagger
 * /api/users/login:
 *   post:
 *     summary: Login user
 *     description: Authenticate a user with email and password. Returns a JWT token and user information.
 *     tags: [User Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/LoginRequest'
 *           example:
 *             email: "john@example.com"
 *             password: "password123"
 *     responses:
 *       200:
 *         description: Login successful
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/LoginSuccessResponse'
 *             example:
 *               token: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySUQiOiIxMjNlNDU2Ny1lODliLTEyZDMtYTQ1Ni00MjY2MTQxNzQwMDAiLCJyb2xlIjoicGFydGljaXBhbnQiLCJpYXQiOjE2OTk5OTk5OTl9..."
 *               user:
 *                 userID: "123e4567-e89b-12d3-a456-426614174000"
 *                 email: "john@example.com"
 *                 name: "John Doe"
 *                 role: "participant"
 *       401:
 *         description: Unauthorized - Invalid credentials
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             examples:
 *               invalidCredentials:
 *                 summary: Invalid email or password
 *                 value:
 *                   error: "Invalid email or password"
 *               missingFields:
 *                 summary: Missing required fields
 *                 value:
 *                   error: "Email and password are required"
 */
router.post('/login', userController.login); // FR-2
/**
 * @swagger
 * /api/users/password-reset/request:
 *   post:
 *     summary: Request password reset
 *     description: Request a password reset token for a user account. If the email exists, a reset token will be generated. In production, this token should be sent via email.
 *     tags: [Password Reset]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/PasswordResetRequestRequest'
 *           example:
 *             email: "john@example.com"
 *     responses:
 *       200:
 *         description: Password reset token generated (or generic message if email doesn't exist)
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/PasswordResetRequestResponse'
 *             examples:
 *               success:
 *                 summary: Token generated successfully
 *                 value:
 *                   message: "Password reset token generated"
 *                   resetToken: "123e4567-e89b-12d3-a456-426614174000"
 *                   expiresAt: "2024-01-15T11:30:00Z"
 *               emailNotExists:
 *                 summary: Email doesn't exist (security - same response)
 *                 value:
 *                   message: "If the email exists, a password reset link has been sent"
 *       400:
 *         description: Bad request - missing email
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               error: "Email is required"
 */
router.post('/password-reset/request', userController.requestPasswordReset); // FR-4
/**
 * @swagger
 * /api/users/password-reset/reset:
 *   post:
 *     summary: Reset password using token
 *     description: Reset user password using a valid reset token. The token must not be expired (valid for 1 hour).
 *     tags: [Password Reset]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/PasswordResetRequest'
 *           example:
 *             resetToken: "123e4567-e89b-12d3-a456-426614174000"
 *             newPassword: "newSecurePassword123"
 *     responses:
 *       200:
 *         description: Password reset successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/PasswordResetSuccessResponse'
 *             example:
 *               message: "Password reset successfully"
 *       400:
 *         description: Bad request - validation error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             examples:
 *               missingFields:
 *                 summary: Missing required fields
 *                 value:
 *                   error: "Reset token and new password are required"
 *               invalidToken:
 *                 summary: Invalid or expired token
 *                 value:
 *                   error: "Invalid or expired reset token"
 *               expiredToken:
 *                 summary: Token expired
 *                 value:
 *                   error: "Reset token has expired"
 */
router.post('/password-reset/reset', userController.resetPassword); // FR-4

// Protected routes (require authentication)
/**
 * @swagger
 * /api/users/profile:
 *   get:
 *     summary: Get authenticated user's profile
 *     description: Retrieve the profile information of the currently authenticated user. Requires a valid JWT token.
 *     tags: [User Profile]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Profile retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ProfileResponse'
 *             example:
 *               user_id: "123e4567-e89b-12d3-a456-426614174000"
 *               email: "john@example.com"
 *               name: "John Doe"
 *               role: "participant"
 *               created_at: "2024-01-15T10:30:00Z"
 *               updated_at: "2024-01-15T10:30:00Z"
 *       401:
 *         description: Unauthorized - Invalid or missing token
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               error: "Unauthorized - Invalid token"
 *       404:
 *         description: User not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               error: "User not found"
 */
router.get('/profile', authenticate, userController.getProfile); // FR-3
/**
 * @swagger
 * /api/users/profile:
 *   put:
 *     summary: Update authenticated user's profile
 *     description: Update the profile information of the currently authenticated user. Role cannot be changed through this endpoint. Requires a valid JWT token.
 *     tags: [User Profile]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UpdateProfileRequest'
 *           examples:
 *             updateName:
 *               summary: Update name only
 *               value:
 *                 name: "John Updated"
 *             updateEmail:
 *               summary: Update email only
 *               value:
 *                 email: "john.updated@example.com"
 *             updateBoth:
 *               summary: Update both name and email
 *               value:
 *                 name: "John Updated"
 *                 email: "john.updated@example.com"
 *     responses:
 *       200:
 *         description: Profile updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/UpdateProfileSuccessResponse'
 *             example:
 *               message: "Profile updated successfully"
 *               user:
 *                 user_id: "123e4567-e89b-12d3-a456-426614174000"
 *                 email: "john.updated@example.com"
 *                 name: "John Updated"
 *                 role: "participant"
 *                 created_at: "2024-01-15T10:30:00Z"
 *                 updated_at: "2024-01-15T11:00:00Z"
 *       400:
 *         description: Bad request - validation error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               error: "Invalid email format"
 *       401:
 *         description: Unauthorized - Invalid or missing token
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               error: "Unauthorized - Invalid token"
 */
router.put('/profile', authenticate, userController.updateProfile); // FR-3

// Admin routes (require authentication + admin role)
/**
 * @swagger
 * /api/users/admin/users:
 *   get:
 *     summary: Get all users (Admin only)
 *     description: Retrieve a list of all users in the system. Requires administrator role.
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of users retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/UsersListResponse'
 *             example:
 *               - user_id: "123e4567-e89b-12d3-a456-426614174000"
 *                 email: "john@example.com"
 *                 name: "John Doe"
 *                 role: "participant"
 *                 created_at: "2024-01-15T10:30:00Z"
 *                 updated_at: "2024-01-15T10:30:00Z"
 *               - user_id: "223e4567-e89b-12d3-a456-426614174001"
 *                 email: "jane@example.com"
 *                 name: "Jane Smith"
 *                 role: "event_organizer"
 *                 created_at: "2024-01-15T11:00:00Z"
 *                 updated_at: "2024-01-15T11:00:00Z"
 *       401:
 *         description: Unauthorized - Invalid or missing token
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               error: "Unauthorized - Invalid token"
 *       403:
 *         description: Forbidden - Admin access required
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               error: "Forbidden - Administrator access required"
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               error: "Internal server error"
 */
router.get('/admin/users', authenticate, requireAdmin, userController.getAllUsers); // FR-5
/**
 * @swagger
 * /api/users/admin/users/{id}:
 *   delete:
 *     summary: Delete a user (Admin only)
 *     description: Delete a user from the system by user ID. Requires administrator role.
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: User ID to delete
 *         example: "123e4567-e89b-12d3-a456-426614174000"
 *     responses:
 *       204:
 *         description: User deleted successfully
 *       401:
 *         description: Unauthorized - Invalid or missing token
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               error: "Unauthorized - Invalid token"
 *       403:
 *         description: Forbidden - Admin access required
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               error: "Forbidden - Administrator access required"
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               error: "Internal server error"
 */
router.delete('/admin/users/:id', authenticate, requireAdmin, userController.deleteUser); // FR-5

// Legacy routes (kept for backward compatibility)
/**
 * @swagger
 * /api/users/{id}:
 *   get:
 *     summary: Get user by ID (Legacy)
 *     description: Retrieve a user by their ID. This is a legacy endpoint kept for backward compatibility.
 *     tags: [Legacy]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: User ID
 *         example: "123e4567-e89b-12d3-a456-426614174000"
 *     responses:
 *       200:
 *         description: User retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ProfileResponse'
 *       404:
 *         description: User not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               error: "User not found"
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.get('/:id', userController.getUserById);
/**
 * @swagger
 * /api/users:
 *   post:
 *     summary: Create user (Legacy)
 *     description: Create a new user. This is a legacy endpoint kept for backward compatibility. Use /register instead.
 *     tags: [Legacy]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/RegisterRequest'
 *     responses:
 *       201:
 *         description: User created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ProfileResponse'
 *       400:
 *         description: Bad request - validation error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.post('/', userController.createUser);
/**
 * @swagger
 * /api/users/{id}:
 *   put:
 *     summary: Update user by ID (Legacy)
 *     description: Update a user by their ID. This is a legacy endpoint kept for backward compatibility. Use /profile instead.
 *     tags: [Legacy]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: User ID
 *         example: "123e4567-e89b-12d3-a456-426614174000"
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UpdateProfileRequest'
 *     responses:
 *       200:
 *         description: User updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ProfileResponse'
 *       400:
 *         description: Bad request - validation error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       404:
 *         description: User not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.put('/:id', userController.updateUser);
/**
 * @swagger
 * /api/users/{id}:
 *   delete:
 *     summary: Delete user by ID (Legacy)
 *     description: Delete a user by their ID. This is a legacy endpoint kept for backward compatibility. Use /admin/users/{id} for admin deletion.
 *     tags: [Legacy]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: User ID to delete
 *         example: "123e4567-e89b-12d3-a456-426614174000"
 *     responses:
 *       200:
 *         description: User deleted successfully
 *       404:
 *         description: User not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.delete('/:id', userController.deleteUser);

module.exports = router;

