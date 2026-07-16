import { useState } from 'react';
import { api } from '../api/api';

export default function AuthForm({ onAuthed }) {
  const [mode, setMode] = useState('login');
  const [form, setForm] = useState({ username: '', email: '', password: '', city: '', age: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const set = (key) => (e) => setForm({ ...form, [key]: e.target.value });

  const validate = () => {
    if (!form.email.trim()) return 'Email is required';
    if (!/^\S+@\S+\.\S+$/.test(form.email)) return 'Enter a valid email address';
    if (!form.password || form.password.length < 6) return 'Password must be at least 6 characters';
    if (mode === 'register' && form.username.trim().length < 3) return 'Username must be at least 3 characters';
    return '';
  };

  const submit = async (e) => {
    e.preventDefault();
    const validationError = validate();
    if (validationError) { setError(validationError); return; }
    setError('');
    setLoading(true);
    try {
      const payload = mode === 'register'
        ? { ...form, age: form.age ? Number(form.age) : undefined }
        : { email: form.email, password: form.password };
      const result = mode === 'register' ? await api.register(payload) : await api.login(payload);
      localStorage.token = result.token;
      onAuthed();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="auth-page">
      <form className="auth-card" onSubmit={submit}>
        <div className="brand center">
          <span className="brand-dot" />
          <h1>Social Network</h1>
        </div>
        <div className="auth-switch">
          <button type="button" className={mode === 'login' ? 'seg active' : 'seg'} onClick={() => setMode('login')}>Login</button>
          <button type="button" className={mode === 'register' ? 'seg active' : 'seg'} onClick={() => setMode('register')}>Register</button>
        </div>

        {mode === 'register' && (
          <input placeholder="Username" value={form.username} onChange={set('username')} />
        )}
        <input placeholder="Email" type="email" value={form.email} onChange={set('email')} />
        <input placeholder="Password" type="password" value={form.password} onChange={set('password')} />
        {mode === 'register' && (
          <div className="row">
            <input placeholder="City" value={form.city} onChange={set('city')} />
            <input placeholder="Age" type="number" min="13" max="120" value={form.age} onChange={set('age')} />
          </div>
        )}

        {error && <p className="error">{error}</p>}
        <button type="submit" disabled={loading}>{loading ? 'Please wait…' : mode === 'register' ? 'Create account' : 'Log in'}</button>
      </form>
    </main>
  );
}
