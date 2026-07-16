const router = require('express').Router();
const c = require('../controllers/postController');
const { protect } = require('../middleware/auth');

router.use(protect);
router.get('/feed', c.feed);
router.get('/mine', c.myPosts);
router.post('/', c.createPost);
router.get('/', c.listPosts);
router.get('/:id', c.getPost);
router.put('/:id', c.updatePost);
router.delete('/:id', c.deletePost);
router.post('/:id/like', c.toggleLike);

module.exports = router;
