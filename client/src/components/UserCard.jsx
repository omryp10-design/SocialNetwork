import { useState } from 'react';
import { api } from '../api/api';

export default function UserCard({ user, me, onChanged }) {
  const [error, setError] = useState('');
  const isMe = String(user._id) === String(me._id);
  const isFriend = me.friends?.some((id) => String(id) === String(user._id) || String(id?._id) === String(user._id));

  const toggleFriend = async () => {
    try {
      if (isFriend) await api.removeFriend(user._id); else await api.addFriend(user._id);
      onChanged();
    } catch (err) { setError(err.message); }
  };

  const removeUser = async () => {
    if (!confirm(`Delete ${user.username}'s account? This cannot be undone.`)) return;
    try { await api.deleteUser(user._id); onChanged(); } catch (err) { setError(err.message); }
  };

  return (
    <div className="user-card">
      <span className="avatar" style={{ background: user.avatarColor || '#6c5ce7' }}>{user.username?.[0]?.toUpperCase()}</span>
      <div className="user-info">
        <strong>{user.username}</strong>
        <small>{user.city || 'No city set'} {user.age ? `· ${user.age}` : ''} · {user.role}</small>
        {user.bio && <p className="muted">{user.bio}</p>}
        {error && <p className="error">{error}</p>}
      </div>
      <div className="row">
        {!isMe && <button className={isFriend ? 'ghost active' : 'ghost'} onClick={toggleFriend}>{isFriend ? 'Remove friend' : 'Add friend'}</button>}
        {!isMe && me.role === 'admin' && <button className="ghost danger" onClick={removeUser}>Delete user</button>}
      </div>
    </div>
  );
}
