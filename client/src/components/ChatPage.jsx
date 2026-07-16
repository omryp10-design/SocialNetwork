import { useState } from 'react';
import Chat from './Chat';

export default function ChatPage({ me, users }) {
  const [otherId, setOtherId] = useState('');
  const other = users.find((u) => u._id === otherId);
  const others = users.filter((u) => u._id !== me._id);

  return (
    <section>
      <h2>Chat</h2>
      <select value={otherId} onChange={(e) => setOtherId(e.target.value)}>
        <option value="">Choose someone to chat with…</option>
        {others.map((u) => <option key={u._id} value={u._id}>{u.username}</option>)}
      </select>
      {other && <Chat me={me} otherUser={other} />}
    </section>
  );
}
