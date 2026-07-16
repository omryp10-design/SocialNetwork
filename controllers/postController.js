const Post = require('../models/Post');
const Group = require('../models/Group');
const httpError = require('../utils/httpError');

async function assertGroupAccess(groupId, userId) {
  if (!groupId) return;
  const group = await Group.findById(groupId);
  if (!group) throw httpError(404, 'Group not found');
  const member = group.members.some((id) => String(id) === String(userId));
  if (!member) throw httpError(403, 'You must be a group member to post there');
}

async function createPost(req, res, next) {
  try {
    const { title, content, category } = req.body;
    if (!title || !content || !category) throw httpError(400, 'title, content and category are required');
    await assertGroupAccess(req.body.group || null, req.user._id);
    const post = await Post.create({ ...req.body, group: req.body.group || null, author: req.user._id });
    res.status(201).json(await post.populate('author group', 'username name privacy'));
  } catch (error) { next(error); }
}

// Search endpoint #2 - exposed in the UI with up to 6 independent parameters:
// title, category, author, group, from, to
async function listPosts(req, res, next) {
  try {
    const { title, category, author, group, from, to } = req.query;
    const filter = {};
    if (title) filter.title = { $regex: title, $options: 'i' };
    if (category) filter.category = { $regex: category, $options: 'i' };
    if (author) filter.author = author;
    if (group) filter.group = group;
    if (from || to) {
      filter.createdAt = {};
      if (from) filter.createdAt.$gte = new Date(from);
      if (to) filter.createdAt.$lte = new Date(to);
    }
    const posts = await Post.find(filter).populate('author', 'username avatarColor').populate('group', 'name privacy members').sort({ createdAt: -1 });
    // Never leak posts from private groups the current user isn't part of.
    const visible = posts.filter((post) => !post.group || post.group.privacy === 'public' || post.group.members.some((id) => String(id) === String(req.user._id)) || req.user.role === 'admin');
    res.json(visible);
  } catch (error) { next(error); }
}

async function getPost(req, res, next) {
  try {
    const post = await Post.findById(req.params.id).populate('author', 'username avatarColor').populate('group', 'name privacy members');
    if (!post) throw httpError(404, 'Post not found');
    if (post.group?.privacy === 'private' && !post.group.members.some((id) => String(id) === String(req.user._id)) && req.user.role !== 'admin') {
      throw httpError(403, 'Private group post');
    }
    res.json(post);
  } catch (error) { next(error); }
}

async function updatePost(req, res, next) {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) throw httpError(404, 'Post not found');
    if (String(post.author) !== String(req.user._id) && req.user.role !== 'admin') throw httpError(403, 'You can update only your own posts');
    const allowed = ['title', 'content', 'category', 'videoUrl', 'canvasData'];
    Object.entries(req.body).forEach(([k, v]) => { if (allowed.includes(k)) post[k] = v; });
    await post.save();
    res.json(await post.populate('author group', 'username name privacy'));
  } catch (error) { next(error); }
}

async function deletePost(req, res, next) {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) throw httpError(404, 'Post not found');
    if (String(post.author) !== String(req.user._id) && req.user.role !== 'admin') throw httpError(403, 'You can delete only your own posts');
    await post.deleteOne();
    res.json({ message: 'Post deleted' });
  } catch (error) { next(error); }
}

async function toggleLike(req, res, next) {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) throw httpError(404, 'Post not found');
    const liked = post.likes.some((id) => String(id) === String(req.user._id));
    if (liked) post.likes.pull(req.user._id); else post.likes.addToSet(req.user._id);
    await post.save();
    res.json({ likes: post.likes.length, liked: !liked });
  } catch (error) { next(error); }
}

// A user's feed = their own posts + friends' posts + posts from groups they belong to.
async function feed(req, res, next) {
  try {
    const groupIds = (await Group.find({ members: req.user._id }).select('_id')).map((g) => g._id);
    const posts = await Post.find({ $or: [{ author: { $in: [...req.user.friends, req.user._id] } }, { group: { $in: groupIds } }] })
      .populate('author', 'username avatarColor').populate('group', 'name').sort({ createdAt: -1 });
    res.json(posts);
  } catch (error) { next(error); }
}

// Every user's own posts, regardless of group visibility - "requirement 22".
async function myPosts(req, res, next) {
  try {
    const posts = await Post.find({ author: req.user._id }).populate('author', 'username avatarColor').populate('group', 'name').sort({ createdAt: -1 });
    res.json(posts);
  } catch (error) { next(error); }
}

module.exports = { createPost, listPosts, getPost, updatePost, deletePost, toggleLike, feed, myPosts };
