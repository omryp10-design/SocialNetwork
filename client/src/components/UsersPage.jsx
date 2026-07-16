import { useEffect, useState } from 'react';
import { api } from '../api/api';
import UserCard from './UserCard';

const empty = { username: '', city: '', role: '', minAge: '', maxAge: '' };

export default function UsersPage({ me, refreshMe }) {
  const [filters, setFilters] = useState(empty);
  const [users, setUsers] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  const search = async (params = filters) => {
    setLoading(true);
    try { setUsers(await api.users(params)); } catch (err) { setError(err.message); } finally { setLoading(false); }
  };

  useEffect(() => { search({}); }, []);

  const set = (key) => (e) => setFilters({ ...filters, [key]: e.target.value });
  const submit = (e) => { e.preventDefault(); search(filters); };
  const reset = () => { setFilters(empty); search({}); };

  const onChanged = async () => { await refreshMe(); await search(filters); };

  return (
    <section>
      <h2>Find people</h2>
      <form className="search-bar" onSubmit={submit}>
        <input placeholder="Username contains…" value={filters.username} onChange={set('username')} />
        <input placeholder="City" value={filters.city} onChange={set('city')} />
        <select value={filters.role} onChange={set('role')}>
          <option value="">Any role</option>
          <option value="user">User</option>
          <option value="manager">Manager</option>
          <option value="admin">Admin</option>
        </select>
        <input placeholder="Min age" type="number" value={filters.minAge} onChange={set('minAge')} />
        <input placeholder="Max age" type="number" value={filters.maxAge} onChange={set('maxAge')} />
        <button type="submit">Search</button>
        <button type="button" className="ghost" onClick={reset}>Reset</button>
      </form>
      {error && <p className="error">{error}</p>}
      {loading && <p className="muted">Loading…</p>}
      <div className="user-list">
        {users.map((u) => <UserCard key={u._id} user={u} me={me} onChanged={onChanged} />)}
      </div>
    </section>
  );
}
