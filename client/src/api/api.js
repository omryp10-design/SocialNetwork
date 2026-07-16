import $ from 'jquery';

const BASE = 'http://localhost:3000/api';

// Every single network call in this app goes through jQuery's $.ajax,
// wrapped in a Promise so the rest of the React code can use async/await.
function request(path, method = 'GET', data) {
  return new Promise((resolve, reject) => {
    $.ajax({
      url: `${BASE}${path}`,
      method,
      contentType: 'application/json',
      data: data ? JSON.stringify(data) : undefined,
      headers: localStorage.token ? { Authorization: `Bearer ${localStorage.token}` } : {},
      success: resolve,
      error: (xhr) => {
        const message = xhr.responseJSON?.message || xhr.statusText || 'Request failed';
        reject(new Error(message));
      }
    });
  });
}

function toQuery(params = {}) {
  const entries = Object.entries(params).filter(([, v]) => v !== '' && v !== undefined && v !== null);
  if (!entries.length) return '';
  return '?' + entries.map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`).join('&');
}

export const api = {
  // auth
  register: (data) => request('/auth/register', 'POST', data),
  login: (data) => request('/auth/login', 'POST', data),
  me: () => request('/auth/me'),

  // users
  users: (params) => request(`/users${toQuery(params)}`),
  getUser: (id) => request(`/users/${id}`),
  updateUser: (id, data) => request(`/users/${id}`, 'PUT', data),
  deleteUser: (id) => request(`/users/${id}`, 'DELETE'),
  addFriend: (friendId) => request(`/users/friends/${friendId}`, 'POST'),
  removeFriend: (friendId) => request(`/users/friends/${friendId}`, 'DELETE'),

  // groups
  groups: (params) => request(`/groups${toQuery(params)}`),
  getGroup: (id) => request(`/groups/${id}`),
  createGroup: (data) => request('/groups', 'POST', data),
  updateGroup: (id, data) => request(`/groups/${id}`, 'PUT', data),
  deleteGroup: (id) => request(`/groups/${id}`, 'DELETE'),
  joinGroup: (id) => request(`/groups/${id}/join`, 'POST'),
  leaveGroup: (id) => request(`/groups/${id}/leave`, 'POST'),
  approveMember: (id, userId) => request(`/groups/${id}/approve/${userId}`, 'POST'),
  rejectMember: (id, userId) => request(`/groups/${id}/reject/${userId}`, 'POST'),

  // posts
  posts: (params) => request(`/posts${toQuery(params)}`),
  feed: () => request('/posts/feed'),
  myPosts: () => request('/posts/mine'),
  getPost: (id) => request(`/posts/${id}`),
  createPost: (data) => request('/posts', 'POST', data),
  updatePost: (id, data) => request(`/posts/${id}`, 'PUT', data),
  deletePost: (id) => request(`/posts/${id}`, 'DELETE'),
  like: (id) => request(`/posts/${id}/like`, 'POST'),

  // comments
  comments: (params) => request(`/comments${toQuery(params)}`),
  createComment: (data) => request('/comments', 'POST', data),
  updateComment: (id, data) => request(`/comments/${id}`, 'PUT', data),
  deleteComment: (id) => request(`/comments/${id}`, 'DELETE'),

  // messages
  conversation: (userId) => request(`/messages/${userId}`),
  searchMessages: (params) => request(`/messages/search${toQuery(params)}`),
  updateMessage: (id, data) => request(`/messages/${id}`, 'PUT', data),
  deleteMessage: (id) => request(`/messages/${id}`, 'DELETE'),

  // stats
  stats: (name) => request(`/stats/${name}`)
};
