const express = require('express');
const router = express.Router();
const productController = require('../controllers/product.controller');

router.get('/inventory', productController.getProductInventory);
router.post('/', productController.createProduct);
router.get('/category/:name', productController.getCategoryIdByName);

module.exports = router;
