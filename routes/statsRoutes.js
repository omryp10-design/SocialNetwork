const router = require('express').Router();
const { postsPerMonth, membersPerGroup, usersPerCity } = require('../controllers/statsController');
const { protect } = require('../middleware/auth');

router.get('/posts-per-month', protect, postsPerMonth);
router.get('/members-per-group', protect, membersPerGroup);
router.get('/users-per-city', protect, usersPerCity);

module.exports = router;
