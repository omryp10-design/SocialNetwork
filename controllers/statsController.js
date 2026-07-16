const Post = require('../models/Post');
const Group = require('../models/Group');
const User = require('../models/User');

// Chart #1: number of posts created per month (all-time), read live from the DB.
async function postsPerMonth(req, res, next) {
  try {
    const data = await Post.aggregate([
      { $group: { _id: { year: { $year: '$createdAt' }, month: { $month: '$createdAt' } }, count: { $sum: 1 } } },
      { $sort: { '_id.year': 1, '_id.month': 1 } }
    ]);
    res.json(data.map((x) => ({ label: `${x._id.year}-${String(x._id.month).padStart(2, '0')}`, value: x.count })));
  } catch (error) { next(error); }
}

// Chart #2: member count for the 10 biggest groups.
async function membersPerGroup(req, res, next) {
  try {
    const data = await Group.aggregate([
      { $project: { name: 1, value: { $size: '$members' } } },
      { $sort: { value: -1 } },
      { $limit: 10 }
    ]);
    res.json(data.map((x) => ({ label: x.name, value: x.value })));
  } catch (error) { next(error); }
}

// Bonus chart: how many users live in each city - handy for the defense demo.
async function usersPerCity(req, res, next) {
  try {
    const data = await User.aggregate([
      { $match: { city: { $ne: '' } } },
      { $group: { _id: '$city', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 10 }
    ]);
    res.json(data.map((x) => ({ label: x._id, value: x.count })));
  } catch (error) { next(error); }
}

module.exports = { postsPerMonth, membersPerGroup, usersPerCity };
