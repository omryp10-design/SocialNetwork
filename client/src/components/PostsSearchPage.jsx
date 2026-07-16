import { useEffect, useState } from 'react';
import { api } from '../api/api';
import PostSearch from './PostSearch';
import PostCard from './PostCard';

export default function PostsSearchPage({ me, users, groups }) {
  const [posts, setPosts] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [searched, setSearched] = useState(false);

  const runSearch = async (filters) => {
    setLoading(true);
    setSearched(true);
    try { setPosts(await api.posts(filters)); } catch (err) { setError(err.message); } finally { setLoading(false); }
  };

  useEffect(() => { runSearch({}); }, []);

  return (
    <section>
      <h2>Search posts</h2>
      <PostSearch users={users} groups={groups} onSearch={runSearch} />
      {error && <p className="error">{error}</p>}
      {loading && <p className="muted">Searching…</p>}
      {!loading && searched && !posts.length && <p className="muted">No posts match your filters.</p>}
      <div className="post-list">
        {posts.map((post) => <PostCard key={post._id} post={post} me={me} onChanged={() => runSearch({})} />)}
      </div>
    </section>
  );
}
