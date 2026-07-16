import { useState } from 'react';
import { api } from '../api/api';

export default function GroupDetail({ group, me, onClose, onChanged }) {
  const [error, setError] = useState('');
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState({ name: group.name, description: group.description, category: group.category, privacy: group.privacy });
  const [memberSearch, setMemberSearch] = useState({ username: '', city: '', role: '' });
  const [candidates, setCandidates] = useState(null);

  const isManager = String(group.manager?._id || group.manager) === String(me._id);
  const isAdmin = me.role === 'admin';
  const isMember = group.members?.some((u) => String(u._id || u) === String(me._id));
  const isPending = group.pendingMembers?.some((u) => String(u._id || u) === String(me._id));

  const act = async (fn) => {
    try { await fn(); await onChanged(); } catch (err) { setError(err.message); }
  };

  const join = () => act(() => api.joinGroup(group._id));
  const leave = () => act(() => api.leaveGroup(group._id));
  const approve = (userId) => act(() => api.approveMember(group._id, userId));
  const reject = (userId) => act(() => api.rejectMember(group._id, userId));
  const remove = () => { if (confirm('Delete this group?')) act(async () => { await api.deleteGroup(group._id); onClose(); }); };
  const saveEdit = () => act(async () => { await api.updateGroup(group._id, draft); setEditing(false); });

  // Extended capability - only the group manager (or an admin) can search the
  // entire user directory (by username/city/role) and add someone to the group
  // directly, instead of waiting for a join request. Regular members don't see this.
  const searchCandidates = async () => {
    try {
      const results = await api.users(memberSearch);
      setCandidates(results.filter((u) => !group.members?.some((m) => String(m._id || m) === String(u._id))));
    } catch (err) { setError(err.message); }
  };
  const addDirectly = (userId) => act(() => api.approveMember(group._id, userId));

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <button className="ghost close" onClick={onClose}>✕</button>

        {editing ? (
          <div className="edit-form">
            <input value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} />
            <textarea value={draft.description} onChange={(e) => setDraft({ ...draft, description: e.target.value })} />
            <div className="row">
              <input value={draft.category} onChange={(e) => setDraft({ ...draft, category: e.target.value })} />
              <select value={draft.privacy} onChange={(e) => setDraft({ ...draft, privacy: e.target.value })}>
                <option value="public">Public</option>
                <option value="private">Private</option>
              </select>
            </div>
            <div className="row">
              <button onClick={saveEdit}>Save</button>
              <button className="ghost" onClick={() => setEditing(false)}>Cancel</button>
            </div>
          </div>
        ) : (
          <>
            <h2>{group.name}</h2>
            <p className="muted">{group.category} · {group.privacy} · managed by {group.manager?.username}</p>
            <p>{group.description}</p>

            <div className="row">
              {!isMember && !isPending && <button onClick={join}>{group.privacy === 'public' ? 'Join group' : 'Request to join'}</button>}
              {isPending && <span className="pill">Join request pending</span>}
              {isMember && !isManager && <button className="ghost" onClick={leave}>Leave group</button>}
              {(isManager || isAdmin) && <button className="ghost" onClick={() => setEditing(true)}>Edit group</button>}
              {(isManager || isAdmin) && <button className="ghost danger" onClick={remove}>Delete group</button>}
            </div>

            <h3>Members ({group.members?.length || 0})</h3>
            <ul className="plain-list">
              {group.members?.map((u) => <li key={u._id || u}>{u.username || 'Member'}</li>)}
            </ul>

            {(isManager || isAdmin) && (
              <>
                <h3>Find &amp; add members (manager only)</h3>
                <div className="row">
                  <input placeholder="Username" value={memberSearch.username} onChange={(e) => setMemberSearch({ ...memberSearch, username: e.target.value })} />
                  <input placeholder="City" value={memberSearch.city} onChange={(e) => setMemberSearch({ ...memberSearch, city: e.target.value })} />
                  <select value={memberSearch.role} onChange={(e) => setMemberSearch({ ...memberSearch, role: e.target.value })}>
                    <option value="">Any role</option>
                    <option value="user">User</option>
                    <option value="manager">Manager</option>
                    <option value="admin">Admin</option>
                  </select>
                  <button className="ghost small" onClick={searchCandidates}>Search</button>
                </div>
                {candidates !== null && (
                  <ul className="plain-list">
                    {candidates.length === 0 && <li className="muted">No matching users.</li>}
                    {candidates.map((u) => (
                      <li key={u._id} className="row">
                        <span>{u.username} {u.city ? `· ${u.city}` : ''}</span>
                        <button className="ghost tiny" onClick={() => addDirectly(u._id)}>Add to group</button>
                      </li>
                    ))}
                  </ul>
                )}
              </>
            )}

            {(isManager || isAdmin) && group.pendingMembers?.length > 0 && (
              <>
                <h3>Pending requests</h3>
                <ul className="plain-list">
                  {group.pendingMembers.map((u) => (
                    <li key={u._id || u} className="row">
                      <span>{u.username || 'Pending user'}</span>
                      <button className="ghost small" onClick={() => approve(u._id || u)}>Approve</button>
                      <button className="ghost small danger" onClick={() => reject(u._id || u)}>Reject</button>
                    </li>
                  ))}
                </ul>
              </>
            )}
          </>
        )}
        {error && <p className="error">{error}</p>}
      </div>
    </div>
  );
}
