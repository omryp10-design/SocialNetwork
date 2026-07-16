const router = require('express').Router();
const c = require('../controllers/commentController');
const { protect } = require('../middleware/auth');

router.use(protect);
router.post('/', c.createComment);
router.get('/', c.listComments);
router.get('/:id', c.getComment);
router.put('/:id', c.updateComment);
router.delete('/:id', c.deleteComment);

module.exports = router;
