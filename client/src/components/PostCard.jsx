import { useState } from 'react';
import { api } from '../api/api';

export default function PostCard({ post, me, onChanged }) {
  const [comments, setComments] = useState(null);
  const [commentText, setCommentText] = useState('');
  const [editingCommentId, setEditingCommentId] = useState(null);
  const [commentDraft, setCommentDraft] = useState('');
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState({ title: post.title, content: post.content, category: post.category });
  const [error, setError] = useState('');

  const isOwner = String(post.author?._id) === String(me._id);
  const canModerate = isOwner || me.role === 'admin';
  const liked = post.likes?.some((id) => String(id) === String(me._id));

  const loadComments = async () => {
    try { setComments(await api.comments({ post: post._id })); } catch (err) { setError(err.message); }
  };

  const toggleComments = () => { if (comments === null) loadComments(); else setComments(null); };

  const addComment = async () => {
    if (!commentText.trim()) return;
    try {
      await api.createComment({ post: post._id, text: commentText.trim() });
      setCommentText('');
      await loadComments();
    } catch (err) { setError(err.message); }
  };

  const removeComment = async (id) => {
    try { await api.deleteComment(id); await loadComments(); } catch (err) { setError(err.message); }
  };

  const startEditComment = (comment) => { setEditingCommentId(comment._id); setCommentDraft(comment.text); };

  const saveEditComment = async () => {
    if (!commentDraft.trim()) { setError('Comment cannot be empty'); return; }
    try {
      await api.updateComment(editingCommentId, { text: commentDraft.trim() });
      setEditingCommentId(null);
      setCommentDraft('');
      await loadComments();
    } catch (err) { setError(err.message); }
  };

  const like = async () => {
    try { await api.like(post._id); onChanged(); } catch (err) { setError(err.message); }
  };

  const saveEdit = async () => {
    if (!draft.title.trim() || !draft.content.trim()) { setError('Title and content cannot be empty'); return; }
    try { await api.updatePost(post._id, draft); setEditing(false); onChanged(); } catch (err) { setError(err.message); }
  };

  const remove = async () => {
    if (!confirm('Delete this post?')) return;
    try { await api.deletePost(post._id); onChanged(); } catch (err) { setError(err.message); }
  };

  return (
    <article className="post-card">
      {editing ? (
        <div className="edit-form">
          <input value={draft.title} onChange={(e) => setDraft({ ...draft, title: e.target.value })} />
          <textarea value={draft.content} onChange={(e) => setDraft({ ...draft, content: e.target.value })} />
          <input value={draft.category} onChange={(e) => setDraft({ ...draft, category: e.target.value })} />
          <div className="row">
            <button onClick={saveEdit}>Save</button>
            <button className="ghost" onClick={() => setEditing(false)}>Cancel</button>
          </div>
        </div>
      ) : (
        <>
          <div className="post-head">
            <span className="avatar small" style={{ background: post.author?.avatarColor || '#6c5ce7' }}>{post.author?.username?.[0]?.toUpperCase()}</span>
            <div>
              <h3>{post.title}</h3>
              <small>{post.author?.username} · {post.category}{post.group?.name ? ` · in ${post.group.name}` : ''} · {new Date(post.createdAt).toLocaleDateString()}</small>
            </div>
          </div>
          <p>{post.content}</p>
          {post.videoUrl && <video controls src={post.videoUrl} />}
          {post.canvasData && <img src={post.canvasData} alt="drawing" />}
          <div className="post-actions">
            <button className={liked ? 'ghost active' : 'ghost'} onClick={like}>♥ {post.likes?.length || 0}</button>
            <button className="ghost" onClick={toggleComments}>💬 {comments ? 'Hide' : 'Comments'}</button>
            {canModerate && <button className="ghost" onClick={() => setEditing(true)}>Edit</button>}
            {canModerate && <button className="ghost danger" onClick={remove}>Delete</button>}
          </div>
        </>
      )}

      {error && <p className="error">{error}</p>}

      {comments !== null && !editing && (
        <div className="comments">
          {comments.map((c) => (
            <div key={c._id} className="comment">
              <span className="avatar tiny" style={{ background: c.author?.avatarColor || '#999' }}>{c.author?.username?.[0]?.toUpperCase()}</span>
              {editingCommentId === c._id ? (
                <div className="row" style={{ flex: 1 }}>
                  <input value={commentDraft} onChange={(e) => setCommentDraft(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && saveEditComment()} />
                  <button className="ghost tiny" onClick={saveEditComment}>Save</button>
                  <button className="ghost tiny" onClick={() => setEditingCommentId(null)}>Cancel</button>
                </div>
              ) : (
                <>
                  <p><strong>{c.author?.username}:</strong> {c.text}</p>
                  {(String(c.author?._id) === String(me._id) || me.role === 'admin') && (
                    <>
                      <button className="ghost tiny" onClick={() => startEditComment(c)}>Edit</button>
                      <button className="ghost tiny danger" onClick={() => removeComment(c._id)}>✕</button>
                    </>
                  )}
                </>
              )}
            </div>
          ))}
          <div className="comment-composer">
            <input placeholder="Write a comment…" value={commentText} onChange={(e) => setCommentText(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && addComment()} />
            <button onClick={addComment}>Post</button>
          </div>
        </div>
      )}
    </article>
  );
}
