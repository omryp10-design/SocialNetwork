const Group = require('../models/Group');
const User = require('../models/User');
const httpError = require('../utils/httpError');

async function createGroup(req, res, next) {
  try {
    const { name, description, category, privacy } = req.body;
    if (!name || !description || !category) throw httpError(400, 'name, description and category are required');
    const group = await Group.create({ name, description, category, privacy, manager: req.user._id, members: [req.user._id] });
    res.status(201).json(await group.populate('manager members', 'username avatarColor'));
  } catch (error) { next(error); }
}

// Search endpoint - exposed in the UI with 3 independent parameters:
// name, category, privacy
async function listGroups(req, res, next) {
  try {
    const { name, category, privacy } = req.query;
    const filter = {};
    if (name) filter.name = { $regex: name, $options: 'i' };
    if (category) filter.category = { $regex: category, $options: 'i' };
    if (privacy) filter.privacy = privacy;
    const groups = await Group.find(filter).populate('manager members', 'username avatarColor').sort({ createdAt: -1 });
    res.json(groups);
  } catch (error) { next(error); }
}

async function getGroup(req, res, next) {
  try {
    const group = await Group.findById(req.params.id).populate('manager members pendingMembers', 'username avatarColor');
    if (!group) throw httpError(404, 'Group not found');
    const isMember = group.members.some((u) => String(u._id || u) === String(req.user._id));
    const isManager = String(group.manager._id || group.manager) === String(req.user._id);
    if (group.privacy === 'private' && !isMember && !isManager && req.user.role !== 'admin') throw httpError(403, 'Private group');
    res.json(group);
  } catch (error) { next(error); }
}

async function updateGroup(req, res, next) {
  try {
    const group = await Group.findById(req.params.id);
    if (!group) throw httpError(404, 'Group not found');
    if (String(group.manager) !== String(req.user._id) && req.user.role !== 'admin') throw httpError(403, 'Only the group manager can update it');
    const allowed = ['name', 'description', 'category', 'privacy'];
    Object.entries(req.body).forEach(([k, v]) => { if (allowed.includes(k)) group[k] = v; });
    await group.save();
    res.json(await group.populate('manager members', 'username avatarColor'));
  } catch (error) { next(error); }
}

async function deleteGroup(req, res, next) {
  try {
    const group = await Group.findById(req.params.id);
    if (!group) throw httpError(404, 'Group not found');
    if (String(group.manager) !== String(req.user._id) && req.user.role !== 'admin') throw httpError(403, 'Only the group manager can delete it');
    await group.deleteOne();
    res.json({ message: 'Group deleted' });
  } catch (error) { next(error); }
}

async function requestJoin(req, res, next) {
  try {
    const group = await Group.findById(req.params.id);
    if (!group) throw httpError(404, 'Group not found');
    if (group.members.some((id) => String(id) === String(req.user._id))) throw httpError(409, 'You are already a member');
    if (group.privacy === 'public') group.members.addToSet(req.user._id);
    else group.pendingMembers.addToSet(req.user._id);
    await group.save();
    res.json({ message: group.privacy === 'public' ? 'Joined group' : 'Join request sent, waiting for manager approval' });
  } catch (error) { next(error); }
}

async function leaveGroup(req, res, next) {
  try {
    const group = await Group.findById(req.params.id);
    if (!group) throw httpError(404, 'Group not found');
    if (String(group.manager) === String(req.user._id)) throw httpError(400, 'The manager cannot leave their own group');
    group.members.pull(req.user._id);
    group.pendingMembers.pull(req.user._id);
    await group.save();
    res.json({ message: 'Left group' });
  } catch (error) { next(error); }
}

// Only the group manager (or an admin) may approve a pending member - this is the
// "manager has extended permissions over a regular user" requirement.
async function approveMember(req, res, next) {
  try {
    const group = await Group.findById(req.params.id);
    if (!group) throw httpError(404, 'Group not found');
    if (String(group.manager) !== String(req.user._id) && req.user.role !== 'admin') throw httpError(403, 'Manager permission required');
    const user = await User.findById(req.params.userId);
    if (!user) throw httpError(404, 'User not found');
    group.pendingMembers.pull(req.params.userId);
    group.members.addToSet(req.params.userId);
    await group.save();
    res.json(await group.populate('manager members pendingMembers', 'username avatarColor'));
  } catch (error) { next(error); }
}

async function rejectMember(req, res, next) {
  try {
    const group = await Group.findById(req.params.id);
    if (!group) throw httpError(404, 'Group not found');
    if (String(group.manager) !== String(req.user._id) && req.user.role !== 'admin') throw httpError(403, 'Manager permission required');
    group.pendingMembers.pull(req.params.userId);
    await group.save();
    res.json(await group.populate('manager members pendingMembers', 'username avatarColor'));
  } catch (error) { next(error); }
}

module.exports = { createGroup, listGroups, getGroup, updateGroup, deleteGroup, requestJoin, leaveGroup, approveMember, rejectMember };
