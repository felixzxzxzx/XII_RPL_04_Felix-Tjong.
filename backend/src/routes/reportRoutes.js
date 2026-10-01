const express = require('express');
const router = express.Router();
const reportController = require('../controllers/reportController');
const { verifyToken, checkRole } = require('../middlewares/auth');

router.use(verifyToken);
router.use(checkRole('admin', 'owner'));

router.get('/daily', reportController.getDailyReport);

module.exports = router;
