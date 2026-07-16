import { useEffect, useState } from 'react';
import { api } from '../api/api';
import PostCard from './PostCard';

export default function ProfilePage({ me, refreshMe, onAccountDeleted }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState({ username: me.username, bio: me.bio || '', city: me.city || '', age: me.age || '', avatarColor: me.avatarColor || '#6c5ce7' });
  const [error, setError] = useState('');
  const [myPosts, setMyPosts] = useState([]);

  const loadMine = async () => {
    try { setMyPosts(await api.myPosts()); } catch (err) { setError(err.message); }
  };

  useEffect(() => { loadMine(); }, []);

  const save = async () => {
    if (!draft.username.trim()) { setError('Username cannot be empty'); return; }
    try {
      await api.updateUser(me._id, { ...draft, age: draft.age ? Number(draft.age) : undefined });
      await refreshMe();
      setEditing(false);
      setError('');
    } catch (err) { setError(err.message); }
  };

  const colors = ['#6c5ce7', '#00b894', '#e17055', '#0984e3', '#d63031', '#e84393', '#00cec9'];

  const deleteAccount = async () => {
    if (!confirm('This will permanently delete your account. Are you sure?')) return;
    try { await api.deleteUser(me._id); onAccountDeleted(); } catch (err) { setError(err.message); }
  };

  return (
    <section>
      <div className="profile-card">
        <span className="avatar big" style={{ background: me.avatarColor || '#6c5ce7' }}>{me.username?.[0]?.toUpperCase()}</span>
        {editing ? (
          <div className="edit-form">
            <input value={draft.username} onChange={(e) => setDraft({ ...draft, username: e.target.value })} />
            <textarea placeholder="Bio" value={draft.bio} onChange={(e) => setDraft({ ...draft, bio: e.target.value })} />
            <div className="row">
              <input placeholder="City" value={draft.city} onChange={(e) => setDraft({ ...draft, city: e.target.value })} />
              <input placeholder="Age" type="number" value={draft.age} onChange={(e) => setDraft({ ...draft, age: e.target.value })} />
            </div>
            <div className="row swatches">
              {colors.map((c) => (
                <button key={c} type="button" className="swatch" style={{ background: c, outline: draft.avatarColor === c ? '2px solid #333' : 'none' }} onClick={() => setDraft({ ...draft, avatarColor: c })} />
              ))}
            </div>
            {error && <p className="error">{error}</p>}
            <div className="row">
              <button onClick={save}>Save</button>
              <button className="ghost" onClick={() => setEditing(false)}>Cancel</button>
            </div>
          </div>
        ) : (
          <div>
            <h2>{me.username} <small className="pill">{me.role}</small></h2>
            <p className="muted">{me.city || 'No city set'}{me.age ? ` · ${me.age}` : ''}</p>
            <p>{me.bio || 'No bio yet.'}</p>
            <p className="muted">{me.friends?.length || 0} friends</p>
            <div className="row">
              <button className="ghost" onClick={() => setEditing(true)}>Edit profile</button>
              <button className="ghost danger" onClick={deleteAccount}>Delete my account</button>
            </div>
          </div>
        )}
      </div>

      <h2>My posts</h2>
      {!myPosts.length && <p className="muted">You haven't posted anything yet.</p>}
      <div className="post-list">
        {myPosts.map((post) => <PostCard key={post._id} post={post} me={me} onChanged={loadMine} />)}
      </div>
    </section>
  );
}
