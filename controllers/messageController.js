const Message = require('../models/Message');
const httpError = require('../utils/httpError');

async function getConversation(req, res, next) {
  try {
    const other = req.params.userId;
    const messages = await Message.find({
      $or: [
        { sender: req.user._id, receiver: other },
        { sender: other, receiver: req.user._id }
      ]
    }).populate('sender receiver', 'username avatarColor').sort({ createdAt: 1 });
    res.json(messages);
  } catch (error) { next(error); }
}

// Create a message over plain REST (in addition to the Socket.io realtime path).
async function createMessage(req, res, next) {
  try {
    const { receiver, text } = req.body;
    if (!receiver || !String(text || '').trim()) throw httpError(400, 'receiver and text are required');
    const message = await Message.create({ sender: req.user._id, receiver, text: String(text).trim() });
    res.status(201).json(await message.populate('sender receiver', 'username avatarColor'));
  } catch (error) { next(error); }
}

// Search endpoint - restricted to conversations the current user is part of,
// with 3 independent parameters: free text, the other participant, and a date range.
async function searchMessages(req, res, next) {
  try {
    const { text, otherUserId, from, to } = req.query;
    const filter = { $or: [{ sender: req.user._id }, { receiver: req.user._id }] };
    if (otherUserId) {
      filter.$or = [
        { sender: req.user._id, receiver: otherUserId },
        { sender: otherUserId, receiver: req.user._id }
      ];
    }
    if (text) filter.text = { $regex: text, $options: 'i' };
    if (from || to) {
      filter.createdAt = {};
      if (from) filter.createdAt.$gte = new Date(from);
      if (to) filter.createdAt.$lte = new Date(to);
    }
    const messages = await Message.find(filter).populate('sender receiver', 'username avatarColor').sort({ createdAt: -1 });
    res.json(messages);
  } catch (error) { next(error); }
}

async function updateMessage(req, res, next) {
  try {
    const message = await Message.findById(req.params.id);
    if (!message) throw httpError(404, 'Message not found');
    if (String(message.sender) !== String(req.user._id) && req.user.role !== 'admin') {
      throw httpError(403, 'You can edit only your own messages');
    }
    if (!String(req.body.text || '').trim()) throw httpError(400, 'text cannot be empty');
    message.text = String(req.body.text).trim();
    await message.save();
    res.json(await message.populate('sender receiver', 'username avatarColor'));
  } catch (error) { next(error); }
}

async function deleteMessage(req, res, next) {
  try {
    const message = await Message.findById(req.params.id);
    if (!message) throw httpError(404, 'Message not found');
    if (String(message.sender) !== String(req.user._id) && req.user.role !== 'admin') {
      throw httpError(403, 'You can delete only your own messages');
    }
    await message.deleteOne();
    res.json({ message: 'Message deleted' });
  } catch (error) { next(error); }
}

module.exports = { getConversation, createMessage, searchMessages, updateMessage, deleteMessage };
