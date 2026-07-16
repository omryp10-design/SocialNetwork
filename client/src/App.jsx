import { useEffect, useState } from 'react';
import { api } from './api/api';
import AuthForm from './components/AuthForm';
import Navbar from './components/Navbar';
import FeedPage from './components/FeedPage';
import PostsSearchPage from './components/PostsSearchPage';
import UsersPage from './components/UsersPage';
import GroupsPage from './components/GroupsPage';
import ChatPage from './components/ChatPage';
import StatsPage from './components/StatsPage';
import ProfilePage from './components/ProfilePage';

export default function App() {
  const [me, setMe] = useState(null);
  const [users, setUsers] = useState([]);
  const [groups, setGroups] = useState([]);
  const [tab, setTab] = useState('feed');
  const [error, setError] = useState('');
  const [booting, setBooting] = useState(true);

  const refreshMe = async () => setMe(await api.me());

  const bootstrap = async () => {
    setBooting(true);
    try {
      const [meResult, usersResult, groupsResult] = await Promise.all([api.me(), api.users(), api.groups()]);
      setMe(meResult);
      setUsers(usersResult);
      setGroups(groupsResult);
      setError('');
    } catch (err) {
      setError(err.message);
      localStorage.removeItem('token');
      setMe(null);
    } finally {
      setBooting(false);
    }
  };

  useEffect(() => { if (localStorage.token) bootstrap(); else setBooting(false); }, []);

  const logout = () => { localStorage.removeItem('token'); setMe(null); };

  if (booting) return <main className="boot">Loading…</main>;

  if (!me) return <AuthForm onAuthed={bootstrap} />;

  return (
    <div className="app-shell">
      <Navbar me={me} tab={tab} setTab={setTab} onLogout={logout} />
      <main>
        {error && <p className="error">{error}</p>}
        {tab === 'feed' && <FeedPage me={me} groups={groups} />}
        {tab === 'posts' && <PostsSearchPage me={me} users={users} groups={groups} />}
        {tab === 'users' && <UsersPage me={me} refreshMe={refreshMe} refreshUsers={bootstrap} />}
        {tab === 'groups' && <GroupsPage me={me} />}
        {tab === 'chat' && <ChatPage me={me} users={users} />}
        {tab === 'stats' && <StatsPage />}
        {tab === 'profile' && <ProfilePage me={me} refreshMe={refreshMe} onAccountDeleted={logout} />}
      </main>
    </div>
  );
}
