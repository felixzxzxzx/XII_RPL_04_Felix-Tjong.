const express = require('express');
const router = express.Router();
const dashboardController = require('../controllers/dashboardController');
const { verifyToken, checkRole } = require('../middlewares/auth');

router.use(verifyToken);
router.use(checkRole('admin', 'owner'));

router.get('/', dashboardController.getDashboardData);

module.exports = router;
