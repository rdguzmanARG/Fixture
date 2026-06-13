import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext.jsx';
import wc2026Logo from '../assets/wc2026-logo.png';

export default function Login() {
  const { login } = useAuth();
  const [form, setForm] = useState({ username: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const set = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }));

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(form.username, form.password);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-page__card">
        <div className="auth-page__logo">
          <img src={wc2026Logo} alt="FIFA World Cup 2026" className="auth-page__brand-logo" />
          <span className="auth-page__brand-title">FIFA World Cup 2026</span>
        </div>
        {error && <div className="error-msg">{error}</div>}
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Usuario</label>
            <input type="text" value={form.username} onChange={set('username')} required autoFocus />
          </div>
          <div className="form-group">
            <label>Contraseña</label>
            <input type="password" value={form.password} onChange={set('password')} required />
          </div>
          <button className="btn btn--primary" disabled={loading}>
            {loading ? 'Ingresando…' : 'Ingresar'}
          </button>
        </form>
        <p className="auth-link">
          ¿No tienes cuenta? <Link to="/register">Regístrate</Link>
        </p>
      </div>
    </div>
  );
}
