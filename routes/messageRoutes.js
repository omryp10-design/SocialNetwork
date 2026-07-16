const router = require('express').Router();
const c = require('../controllers/messageController');
const { protect } = require('../middleware/auth');

router.use(protect);
router.post('/', c.createMessage);
router.get('/search', c.searchMessages);
router.put('/:id', c.updateMessage);
router.delete('/:id', c.deleteMessage);
router.get('/:userId', c.getConversation);

module.exports = router;
