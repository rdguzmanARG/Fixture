import { NavLink } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext.jsx';

export default function Navbar() {
  const { user, logout } = useAuth();

  if (!user) return null;

  return (
    <nav className="navbar">
      <div className="container">
        <div className="navbar__inner">
          <span className="navbar__brand">⚽ Mundial 2026</span>
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
