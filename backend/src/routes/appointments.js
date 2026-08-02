const express = require('express');
const router = express.Router();
const appointmentController = require('../controllers/appointmentController');
const { identifyShop } = require('../middleware/shop');
const { authenticate } = require('../middleware/auth');
const { rateLimit } = require('../middleware/rateLimit');
const { validateUuid } = require('../middleware/validate');

router.param('id', validateUuid);

// Public routes (rate-limited to prevent spam)
router.post('/', rateLimit({ windowMs: 60 * 1000, max: 5, message: 'Too many booking attempts. Please wait a minute.' }), identifyShop, appointmentController.createAppointment);

// Admin routes
router.get('/', authenticate, appointmentController.getAppointments);
router.patch('/:id/status', authenticate, appointmentController.updateAppointmentStatus);

module.exports = router;
