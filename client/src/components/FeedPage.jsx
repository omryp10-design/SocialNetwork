import { useEffect, useState } from 'react';
import { api } from '../api/api';
import PostComposer from './PostComposer';
import PostCard from './PostCard';

export default function FeedPage({ me, groups }) {
  const [posts, setPosts] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try { setPosts(await api.feed()); } catch (err) { setError(err.message); } finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  return (
    <section>
      <PostComposer groups={groups} onCreated={load} />
      {error && <p className="error">{error}</p>}
      {loading && <p className="muted">Loading feed…</p>}
      {!loading && !posts.length && <p className="muted">Your feed is empty - add friends or join a group to see posts here.</p>}
      <div className="post-list">
        {posts.map((post) => <PostCard key={post._id} post={post} me={me} onChanged={load} />)}
      </div>
    </section>
  );
}
