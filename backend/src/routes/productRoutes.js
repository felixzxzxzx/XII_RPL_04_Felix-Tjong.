const express = require('express');
const router = express.Router();
const productController = require('../controllers/productController');
const { verifyToken, checkRole } = require('../middlewares/auth');
const upload = require('../middlewares/upload');

router.use(verifyToken);

router.get('/', checkRole('admin', 'owner'), productController.getProducts);
router.get('/:id', checkRole('admin', 'owner'), productController.getProductById);

router.post(
  '/',
  checkRole('owner'),
  upload.single('image'),
  productController.createProduct
);

router.put(
  '/:id',
  checkRole('admin', 'owner'),
  upload.single('image'),
  productController.updateProduct
);

router.delete('/:id', checkRole('owner'), productController.deleteProduct);

module.exports = router;
