const express = require('express');
const router = express.Router();
const categoryController = require('../controllers/categoryController');
const { identifyShop } = require('../middleware/shop');
const { authenticate } = require('../middleware/auth');
const { validateUuid } = require('../middleware/validate');

router.param('id', validateUuid);

// Public routes
router.get('/', identifyShop, categoryController.getCategories);

// Admin routes
router.post('/', authenticate, categoryController.createCategory);
router.put('/:id', authenticate, categoryController.updateCategory);
router.delete('/:id', authenticate, categoryController.deleteCategory);

module.exports = router;
