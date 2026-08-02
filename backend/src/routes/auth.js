const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { rateLimit } = require('../middleware/rateLimit');

// Protect against brute-force and spam registrations
const authLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 20, message: 'Too many attempts. Please try again in 15 minutes.' });

router.post('/register', authLimiter, authController.registerShop);
router.post('/login', authLimiter, authController.login);
router.post('/forgot-password', rateLimit({ windowMs: 15 * 60 * 1000, max: 5, message: 'Too many reset requests. Please try again in 15 minutes.' }), authController.requestPasswordReset);
router.post('/reset-password', rateLimit({ windowMs: 15 * 60 * 1000, max: 10, message: 'Too many reset attempts. Please try again in 15 minutes.' }), authController.resetPassword);

module.exports = router;
