const express = require('express');
const router = express.Router();
const posController = require('../controllers/posController');
const { verifyToken, checkRole } = require('../middlewares/auth');

router.use(verifyToken);
router.use(checkRole('admin'));

router.get('/', posController.getPosProducts);
router.post('/', posController.checkout);

module.exports = router;
