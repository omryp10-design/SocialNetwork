const router = require('express').Router();
const c = require('../controllers/groupController');
const { protect } = require('../middleware/auth');

router.use(protect);
router.post('/', c.createGroup);
router.get('/', c.listGroups);
router.get('/:id', c.getGroup);
router.put('/:id', c.updateGroup);
router.delete('/:id', c.deleteGroup);
router.post('/:id/join', c.requestJoin);
router.post('/:id/leave', c.leaveGroup);
router.post('/:id/approve/:userId', c.approveMember);
router.post('/:id/reject/:userId', c.rejectMember);

module.exports = router;
