const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { authenticate } = require('../middleware/authMiddleware');
const { requireAdmin } = require('../middleware/adminMiddleware');

// Public routes
router.post('/register', userController.register); // FR-1
router.post('/login', userController.login); // FR-2
router.post('/password-reset/request', userController.requestPasswordReset); // FR-4
router.post('/password-reset/reset', userController.resetPassword); // FR-4

// Protected routes (require authentication)
router.get('/profile', authenticate, userController.getProfile); // FR-3
router.put('/profile', authenticate, userController.updateProfile); // FR-3

// Admin routes (require authentication + admin role)
router.get('/admin/users', authenticate, requireAdmin, userController.getAllUsers); // FR-5
router.delete('/admin/users/:id', authenticate, requireAdmin, userController.deleteUser); // FR-5
router.get('/admin/stats', authenticate, requireAdmin, userController.getAdminStats);

// Legacy routes (kept for backward compatibility)
router.get('/:id', userController.getUserById);
router.post('/', userController.createUser);
router.put('/:id', userController.updateUser);
router.delete('/:id', userController.deleteUser);

module.exports = router;

