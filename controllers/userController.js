const User = require('../models/User');
const httpError = require('../utils/httpError');

// Privacy rule: a user's email is private. It's only ever returned to that
// user themselves (via /auth/me) or to an admin - never in public listings/search.
function hidePrivateFields(user, req) {
  const plain = user.toObject ? user.toObject() : user;
  const isSelf = String(plain._id) === String(req.user._id);
  if (!isSelf && req.user.role !== 'admin') delete plain.email;
  return plain;
}

// Search endpoint #1 - exposed in the UI with 5 independent parameters:
// username, city, role, minAge, maxAge
async function listUsers(req, res, next) {
  try {
    const { username, city, role, minAge, maxAge } = req.query;
    const filter = {};
    if (username) filter.username = { $regex: username, $options: 'i' };
    if (city) filter.city = { $regex: city, $options: 'i' };
    if (role) filter.role = role;
    if (minAge || maxAge) {
      filter.age = {};
      if (minAge) filter.age.$gte = Number(minAge);
      if (maxAge) filter.age.$lte = Number(maxAge);
    }
    const users = await User.find(filter).select('-password').sort({ createdAt: -1 });
    res.json(users.map((u) => hidePrivateFields(u, req)));
  } catch (error) { next(error); }
}

async function getUser(req, res, next) {
  try {
    const user = await User.findById(req.params.id).select('-password').populate('friends', 'username city avatarColor');
    if (!user) throw httpError(404, 'User not found');
    res.json(hidePrivateFields(user, req));
  } catch (error) { next(error); }
}

async function updateUser(req, res, next) {
  try {
    // Access control: a user may only ever edit their own profile, an admin may edit anyone's.
    const isSelf = String(req.user._id) === req.params.id;
    const isAdmin = req.user.role === 'admin';
    if (!isSelf && !isAdmin) throw httpError(403, 'You can update only your own profile');
    const allowed = ['username', 'email', 'bio', 'city', 'age', 'avatarColor'];
    if (isAdmin) allowed.push('role');
    const updates = Object.fromEntries(Object.entries(req.body).filter(([key]) => allowed.includes(key)));
    const user = await User.findByIdAndUpdate(req.params.id, updates, { new: true, runValidators: true }).select('-password');
    if (!user) throw httpError(404, 'User not found');
    res.json(user);
  } catch (error) { next(error); }
}

async function deleteUser(req, res, next) {
  try {
    const isSelf = String(req.user._id) === req.params.id;
    const isAdmin = req.user.role === 'admin';
    if (!isSelf && !isAdmin) throw httpError(403, 'You can delete only your own account');
    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) throw httpError(404, 'User not found');
    res.json({ message: 'User deleted successfully' });
  } catch (error) { next(error); }
}

async function addFriend(req, res, next) {
  try {
    if (String(req.user._id) === req.params.friendId) throw httpError(400, 'You cannot add yourself');
    const friend = await User.findById(req.params.friendId);
    if (!friend) throw httpError(404, 'Friend not found');
    await User.findByIdAndUpdate(req.user._id, { $addToSet: { friends: friend._id } });
    await User.findByIdAndUpdate(friend._id, { $addToSet: { friends: req.user._id } });
    res.json({ message: 'Friend added' });
  } catch (error) { next(error); }
}

async function removeFriend(req, res, next) {
  try {
    await User.findByIdAndUpdate(req.user._id, { $pull: { friends: req.params.friendId } });
    await User.findByIdAndUpdate(req.params.friendId, { $pull: { friends: req.user._id } });
    res.json({ message: 'Friend removed' });
  } catch (error) { next(error); }
}

module.exports = { listUsers, getUser, updateUser, deleteUser, addFriend, removeFriend };
