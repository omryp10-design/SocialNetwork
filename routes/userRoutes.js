const router = require('express').Router();
const c = require('../controllers/userController');
const { protect } = require('../middleware/auth');

router.use(protect);
router.get('/', c.listUsers);
router.get('/:id', c.getUser);
router.put('/:id', c.updateUser);
router.delete('/:id', c.deleteUser);
router.post('/friends/:friendId', c.addFriend);
router.delete('/friends/:friendId', c.removeFriend);

module.exports = router;
