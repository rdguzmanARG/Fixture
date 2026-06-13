import { NavLink } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext.jsx';
import wc2026Logo from '../assets/wc2026-logo.png';

export default function Navbar() {
  const { user, logout } = useAuth();

  if (!user) return null;

  return (
    <nav className="navbar">
      <div className="container">
        <div className="navbar__inner">
          <div className="navbar__brand">
            <img src={wc2026Logo} alt="FIFA World Cup 2026" className="navbar__brand-logo" />
            <span className="navbar__brand-title">FIFA World Cup 2026</span>
          </div>
          <ul className="navbar__nav">
            <li><NavLink to="/all">Todos</NavLink></li>
            <li><NavLink to="/groups">Grupos</NavLink></li>
            <li><NavLink to="/knockout">Eliminatorias</NavLink></li>
            <li><NavLink to="/leaderboard">Clasificación</NavLink></li>
          </ul>
          <div className="navbar__user">
            <span>{user.username}</span>
            {user.isAdmin && <small style={{ color: '#e8b84b' }}>(admin)</small>}
            <button className="navbar__logout" onClick={logout}>Salir</button>
          </div>
        </div>
      </div>
    </nav>
  );
}
