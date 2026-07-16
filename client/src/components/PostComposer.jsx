import { useState } from 'react';
import { api } from '../api/api';
import CanvasBoard from './CanvasBoard';

export default function PostComposer({ groups, onCreated }) {
  const empty = { title: '', content: '', category: 'general', videoUrl: '', canvasData: '', group: '' };
  const [post, setPost] = useState(empty);
  const [error, setError] = useState('');
  const [open, setOpen] = useState(false);

  const set = (key) => (e) => setPost({ ...post, [key]: e.target.value });

  const submit = async () => {
    if (!post.title.trim() || !post.content.trim() || !post.category.trim()) {
      setError('Title, content and category are required');
      return;
    }
    try {
      await api.createPost({ ...post, group: post.group || undefined });
      setPost(empty);
      setOpen(false);
      setError('');
      onCreated();
    } catch (err) {
      setError(err.message);
    }
  };

  if (!open) {
    return (
      <section className="composer collapsed">
        <button onClick={() => setOpen(true)}>+ Create a post</button>
      </section>
    );
  }

  return (
    <section className="composer">
      <h2>Create post</h2>
      <input placeholder="Title" value={post.title} onChange={set('title')} />
      <textarea placeholder="What's on your mind?" value={post.content} onChange={set('content')} />
      <div className="row">
        <input placeholder="Category" value={post.category} onChange={set('category')} />
        <select value={post.group} onChange={set('group')}>
          <option value="">No group (personal post)</option>
          {groups.map((g) => <option key={g._id} value={g._id}>{g.name}</option>)}
        </select>
      </div>
      <input placeholder="Video URL (optional)" value={post.videoUrl} onChange={set('videoUrl')} />
      <label className="field-label">Or draw something (optional):</label>
      <CanvasBoard onChange={(canvasData) => setPost((p) => ({ ...p, canvasData }))} />
      {error && <p className="error">{error}</p>}
      <div className="row">
        <button onClick={submit}>Publish</button>
        <button className="ghost" onClick={() => { setOpen(false); setPost(empty); setError(''); }}>Cancel</button>
      </div>
    </section>
  );
}
