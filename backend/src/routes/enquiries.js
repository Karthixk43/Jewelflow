const express = require('express');
const router = express.Router();
const enquiryController = require('../controllers/enquiryController');
const { identifyShop } = require('../middleware/shop');
const { authenticate } = require('../middleware/auth');
const { rateLimit } = require('../middleware/rateLimit');
const { validateUuid } = require('../middleware/validate');

router.param('id', validateUuid);

// Public routes (rate-limited to prevent spam)
router.post('/', rateLimit({ windowMs: 60 * 1000, max: 5, message: 'Too many enquiries. Please wait a minute.' }), identifyShop, enquiryController.createEnquiry);

// Admin routes
router.get('/', authenticate, enquiryController.getEnquiries);
router.patch('/:id/status', authenticate, enquiryController.updateEnquiryStatus);

module.exports = router;
