const TABS = [
  { id: 'feed', label: 'Feed' },
  { id: 'posts', label: 'Search Posts' },
  { id: 'users', label: 'Users' },
  { id: 'groups', label: 'Groups' },
  { id: 'chat', label: 'Chat' },
  { id: 'stats', label: 'Stats' },
  { id: 'profile', label: 'My Profile' }
];

export default function Navbar({ me, tab, setTab, onLogout }) {
  return (
    <header className="navbar">
      <div className="brand">
        <span className="brand-dot" />
        <h1>Social Network</h1>
      </div>
      <nav className="tabs">
        {TABS.map((t) => (
          <button key={t.id} className={tab === t.id ? 'tab active' : 'tab'} onClick={() => setTab(t.id)}>
            {t.label}
          </button>
        ))}
      </nav>
      <div className="who">
        <span className="avatar" style={{ background: me.avatarColor || '#6c5ce7' }}>{me.username?.[0]?.toUpperCase()}</span>
        <div className="who-text">
          <strong>{me.username}</strong>
          <small>{me.role}</small>
        </div>
        <button className="ghost" onClick={onLogout}>Logout</button>
      </div>
    </header>
  );
}
