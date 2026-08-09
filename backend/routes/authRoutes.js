/**
 * Authentication Routes
 * Handles user registration, login, logout, and profile management
 */

const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { optionalAuth, protect } = require('../middleware/auth');
const { authRateLimit } = require('../utils/rateLimiter');

// Public routes
router.post('/register', authRateLimit, authController.register);
router.post('/login', authRateLimit, authController.login);
router.post('/logout', authController.logout);
router.get('/session', optionalAuth, authController.getSession);

// Protected routes (require authentication)
router.get('/me', protect, authController.getCurrentUser);
router.get('/export', protect, authController.exportAccount);
router.delete('/account', protect, authController.deleteAccount);
router.put('/profile', protect, authController.updateProfile);
router.put('/password', protect, authController.changePassword);
router.get('/api-tokens', protect, authController.listApiTokens);
router.post('/api-tokens', protect, authController.createApiToken);
router.delete('/api-tokens/:tokenId', protect, authController.revokeApiToken);

// Token refresh
router.post('/refresh-token', authRateLimit, authController.refreshToken);

// Password reset
router.post('/forgot-password', authRateLimit, authController.forgotPassword);
router.post('/reset-password/:token', authRateLimit, authController.resetPassword);

// Credits
router.get('/credits', protect, authController.getCredits);

module.exports = router;
