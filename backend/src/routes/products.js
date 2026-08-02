const express = require('express');
const router = express.Router();
const productController = require('../controllers/productController');
const { identifyShop } = require('../middleware/shop');
const { authenticate } = require('../middleware/auth');
const { validateUuid } = require('../middleware/validate');

router.param('id', validateUuid);

// Public routes
router.get('/', identifyShop, productController.getProducts);

// Admin routes (must be before /:id so 'admin' isn't treated as an id)
router.get('/admin/all', authenticate, productController.getAdminProducts);

router.get('/:id', identifyShop, productController.getProductById);
router.post('/', authenticate, productController.createProduct);
router.put('/:id', authenticate, productController.updateProduct);
router.delete('/:id', authenticate, productController.deleteProduct);

module.exports = router;
