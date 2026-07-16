import { useEffect, useState } from 'react';
import { api } from '../api/api';
import GroupDetail from './GroupDetail';

const emptyFilters = { name: '', category: '', privacy: '' };
const emptyForm = { name: '', description: '', category: '', privacy: 'public' };

export default function GroupsPage({ me }) {
  const [filters, setFilters] = useState(emptyFilters);
  const [groups, setGroups] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState(emptyForm);
  const [formOpen, setFormOpen] = useState(false);
  const [selected, setSelected] = useState(null);

  const search = async (params = filters) => {
    setLoading(true);
    try { setGroups(await api.groups(params)); } catch (err) { setError(err.message); } finally { setLoading(false); }
  };

  useEffect(() => { search({}); }, []);

  const set = (key) => (e) => setFilters({ ...filters, [key]: e.target.value });
  const submit = (e) => { e.preventDefault(); search(filters); };
  const reset = () => { setFilters(emptyFilters); search({}); };

  const createGroup = async () => {
    if (!form.name.trim() || !form.description.trim() || !form.category.trim()) { setError('Name, description and category are required'); return; }
    try {
      await api.createGroup(form);
      setForm(emptyForm);
      setFormOpen(false);
      setError('');
      search(filters);
    } catch (err) { setError(err.message); }
  };

  const openGroup = async (id) => {
    try { setSelected(await api.getGroup(id)); } catch (err) { setError(err.message); }
  };

  const refreshSelected = async () => { if (selected) setSelected(await api.getGroup(selected._id)); await search(filters); };

  return (
    <section>
      <h2>Groups</h2>

      {formOpen ? (
        <div className="composer">
          <h3>Create a new group</h3>
          <input placeholder="Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          <textarea placeholder="Description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          <div className="row">
            <input placeholder="Category" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} />
            <select value={form.privacy} onChange={(e) => setForm({ ...form, privacy: e.target.value })}>
              <option value="public">Public</option>
              <option value="private">Private</option>
            </select>
          </div>
          <div className="row">
            <button onClick={createGroup}>Create group</button>
            <button className="ghost" onClick={() => setFormOpen(false)}>Cancel</button>
          </div>
        </div>
      ) : (
        <button onClick={() => setFormOpen(true)}>+ Create a group</button>
      )}

      <form className="search-bar" onSubmit={submit}>
        <input placeholder="Group name contains…" value={filters.name} onChange={set('name')} />
        <input placeholder="Category" value={filters.category} onChange={set('category')} />
        <select value={filters.privacy} onChange={set('privacy')}>
          <option value="">Any privacy</option>
          <option value="public">Public</option>
          <option value="private">Private</option>
        </select>
        <button type="submit">Search</button>
        <button type="button" className="ghost" onClick={reset}>Reset</button>
      </form>

      {error && <p className="error">{error}</p>}
      {loading && <p className="muted">Loading groups…</p>}
      <div className="group-grid">
        {groups.map((g) => (
          <div key={g._id} className="group-card" onClick={() => openGroup(g._id)}>
            <h3>{g.name}</h3>
            <p className="muted">{g.category} · {g.privacy}</p>
            <p>{g.description}</p>
            <small>{g.members?.length || 0} members · managed by {g.manager?.username}</small>
          </div>
        ))}
      </div>

      {selected && <GroupDetail group={selected} me={me} onClose={() => setSelected(null)} onChanged={refreshSelected} />}
    </section>
  );
}
