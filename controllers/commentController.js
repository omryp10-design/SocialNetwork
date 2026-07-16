const Comment = require('../models/Comment');
const Post = require('../models/Post');
const httpError = require('../utils/httpError');

async function createComment(req, res, next) {
  try {
    if (!req.body.text || !req.body.post) throw httpError(400, 'text and post are required');
    const post = await Post.findById(req.body.post);
    if (!post) throw httpError(404, 'Post not found');
    const comment = await Comment.create({ text: req.body.text, post: post._id, author: req.user._id });
    res.status(201).json(await comment.populate('author', 'username avatarColor'));
  } catch (error) { next(error); }
}

async function listComments(req, res, next) {
  try {
    const { text, author, post } = req.query;
    const filter = {};
    if (text) filter.text = { $regex: text, $options: 'i' };
    if (author) filter.author = author;
    if (post) filter.post = post;
    const comments = await Comment.find(filter).populate('author', 'username avatarColor').sort({ createdAt: 1 });
    res.json(comments);
  } catch (error) { next(error); }
}

async function getComment(req, res, next) {
  try {
    const comment = await Comment.findById(req.params.id).populate('author', 'username avatarColor');
    if (!comment) throw httpError(404, 'Comment not found');
    res.json(comment);
  } catch (error) { next(error); }
}

async function updateComment(req, res, next) {
  try {
    const comment = await Comment.findById(req.params.id);
    if (!comment) throw httpError(404, 'Comment not found');
    if (String(comment.author) !== String(req.user._id) && req.user.role !== 'admin') throw httpError(403, 'You can update only your own comments');
    comment.text = req.body.text ?? comment.text;
    await comment.save();
    res.json(await comment.populate('author', 'username avatarColor'));
  } catch (error) { next(error); }
}

async function deleteComment(req, res, next) {
  try {
    const comment = await Comment.findById(req.params.id);
    if (!comment) throw httpError(404, 'Comment not found');
    if (String(comment.author) !== String(req.user._id) && req.user.role !== 'admin') throw httpError(403, 'You can delete only your own comments');
    await comment.deleteOne();
    res.json({ message: 'Comment deleted' });
  } catch (error) { next(error); }
}

module.exports = { createComment, listComments, getComment, updateComment, deleteComment };
