import { useEffect, useRef, useState } from 'react';
import { io } from 'socket.io-client';
import { api } from '../api/api';

const socket = io('http://localhost:3000', { autoConnect: true });

export default function Chat({ me, otherUser }) {
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState('');
  const [error, setError] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [editDraft, setEditDraft] = useState('');
  const [searchText, setSearchText] = useState('');
  const [searching, setSearching] = useState(false);
  const bottomRef = useRef(null);

  const loadConversation = () => api.conversation(otherUser._id).then(setMessages).catch((err) => setError(err.message));

  useEffect(() => {
    if (!me?._id || !otherUser?._id) return;
    socket.emit('join-user', me._id);
    setSearching(false);
    setSearchText('');
    loadConversation();

    const receive = (m) => {
      const involvesThisChat = [m.sender._id, m.receiver._id].every((id) => [me._id, otherUser._id].map(String).includes(String(id)));
      if (involvesThisChat) setMessages((old) => [...old, m]);
    };
    const chatError = (e) => setError(e.message);

    socket.on('receive-message', receive);
    socket.on('chat-error', chatError);
    return () => { socket.off('receive-message', receive); socket.off('chat-error', chatError); };
  }, [me?._id, otherUser?._id]);

  useEffect(() => { if (!searching) bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages, searching]);

  const send = () => {
    if (!text.trim()) return;
    socket.emit('send-message', { sender: me._id, receiver: otherUser._id, text: text.trim() });
    setText('');
  };

  const startEdit = (m) => { setEditingId(m._id); setEditDraft(m.text); };

  const saveEdit = async () => {
    if (!editDraft.trim()) { setError('Message cannot be empty'); return; }
    try {
      await api.updateMessage(editingId, { text: editDraft.trim() });
      setEditingId(null);
      await (searching ? runSearch() : loadConversation());
    } catch (err) { setError(err.message); }
  };

  const removeMessage = async (id) => {
    if (!confirm('Delete this message?')) return;
    try {
      await api.deleteMessage(id);
      await (searching ? runSearch() : loadConversation());
    } catch (err) { setError(err.message); }
  };

  // Search endpoint for messages - restricted to this conversation, filtered by free text.
  const runSearch = async () => {
    if (!searchText.trim()) { setSearching(false); loadConversation(); return; }
    try {
      setSearching(true);
      setMessages(await api.searchMessages({ otherUserId: otherUser._id, text: searchText.trim() }));
    } catch (err) { setError(err.message); }
  };

  return (
    <section className="chat-box-wrap">
      <h3>Chat with {otherUser.username}</h3>
      <div className="row">
        <input placeholder="Search messages in this conversation…" value={searchText} onChange={(e) => setSearchText(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && runSearch()} />
        <button className="ghost small" onClick={runSearch}>Search</button>
        {searching && <button className="ghost small" onClick={() => { setSearching(false); setSearchText(''); loadConversation(); }}>Clear</button>}
      </div>
      {error && <p className="error">{error}</p>}
      <div className="chat-box">
        {messages.map((m) => {
          const isMine = String(m.sender._id) === String(me._id);
          return (
            <div key={m._id} className={isMine ? 'msg mine' : 'msg'}>
              {editingId === m._id ? (
                <span className="row">
                  <input value={editDraft} onChange={(e) => setEditDraft(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && saveEdit()} />
                  <button className="ghost tiny" onClick={saveEdit}>Save</button>
                  <button className="ghost tiny" onClick={() => setEditingId(null)}>Cancel</button>
                </span>
              ) : (
                <>
                  <strong>{m.sender.username}:</strong> {m.text}
                  {isMine && (
                    <>
                      <button className="ghost tiny" onClick={() => startEdit(m)}>Edit</button>
                      <button className="ghost tiny danger" onClick={() => removeMessage(m._id)}>✕</button>
                    </>
                  )}
                </>
              )}
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>
      <div className="row">
        <input value={text} placeholder="Type a message…" onChange={(e) => setText(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && send()} />
        <button onClick={send}>Send</button>
      </div>
    </section>
  );
}
