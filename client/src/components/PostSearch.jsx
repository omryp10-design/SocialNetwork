import { useState } from 'react';

const empty = { title: '', category: '', author: '', group: '', from: '', to: '' };

export default function PostSearch({ users, groups, onSearch }) {
  const [filters, setFilters] = useState(empty);

  const set = (key) => (e) => setFilters({ ...filters, [key]: e.target.value });

  const submit = (e) => { e.preventDefault(); onSearch(filters); };
  const reset = () => { setFilters(empty); onSearch({}); };

  return (
    <form className="search-bar" onSubmit={submit}>
      <input placeholder="Title contains…" value={filters.title} onChange={set('title')} />
      <input placeholder="Category" value={filters.category} onChange={set('category')} />
      <select value={filters.author} onChange={set('author')}>
        <option value="">Any author</option>
        {users.map((u) => <option key={u._id} value={u._id}>{u.username}</option>)}
      </select>
      <select value={filters.group} onChange={set('group')}>
        <option value="">Any group</option>
        {groups.map((g) => <option key={g._id} value={g._id}>{g.name}</option>)}
      </select>
      <label className="date-field">From<input type="date" value={filters.from} onChange={set('from')} /></label>
      <label className="date-field">To<input type="date" value={filters.to} onChange={set('to')} /></label>
      <button type="submit">Search</button>
      <button type="button" className="ghost" onClick={reset}>Reset</button>
    </form>
  );
}
