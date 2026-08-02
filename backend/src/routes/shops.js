const express = require('express');
const router = express.Router();
const shopController = require('../controllers/shopController');
const { identifyShop } = require('../middleware/shop');
const { authenticate } = require('../middleware/auth');

// Public routes
router.get('/', identifyShop, shopController.getShopInfo);

// Admin routes
router.put('/', authenticate, shopController.updateShopInfo);
router.get('/dashboard', authenticate, shopController.getDashboardStats);

module.exports = router;
