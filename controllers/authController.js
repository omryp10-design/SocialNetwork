const jwt = require('jsonwebtoken');
const User = require('../models/User');
const httpError = require('../utils/httpError');

function createToken(userId) {
  return jwt.sign({ userId }, process.env.JWT_SECRET, { expiresIn: '7d' });
}

function publicUser(user) {
  return {
    _id: user._id,
    username: user.username,
    email: user.email,
    role: user.role,
    bio: user.bio,
    city: user.city,
    age: user.age,
    avatarColor: user.avatarColor,
    friends: user.friends,
    createdAt: user.createdAt
  };
}

async function register(req, res, next) {
  try {
    const { username, email, password, bio, city, age } = req.body;
    if (!username || !email || !password) throw httpError(400, 'username, email and password are required');
    const user = await User.create({ username, email, password, bio, city, age });
    res.status(201).json({ token: createToken(user._id), user: publicUser(user) });
  } catch (error) { next(error); }
}

async function login(req, res, next) {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email: String(email || '').toLowerCase() }).select('+password');
    if (!user || !(await user.comparePassword(password || ''))) {
      throw httpError(401, 'Invalid email or password');
    }
    res.json({ token: createToken(user._id), user: publicUser(user) });
  } catch (error) { next(error); }
}

async function me(req, res) {
  res.json(req.user);
}

module.exports = { register, login, me };
