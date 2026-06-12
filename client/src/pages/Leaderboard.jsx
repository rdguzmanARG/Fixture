import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext.jsx';

export default function Leaderboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [board, setBoard] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/predictions/leaderboard', { credentials: 'include' })
      .then((r) => r.json())
      .then((data) => { setBoard(data); setLoading(false); });
  }, []);

  if (loading) return <div className="loading">Cargando clasificación…</div>;

  const rankEmoji = (i) => (i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `${i + 1}`);

  return (
    <div>
      <div className="page-header">
        <div className="container">
          <h1>🏅 Clasificación</h1>
          <p>{board.length} participantes · Resultado exacto = 5pts · Resultado correcto = 3pt</p>
        </div>
      </div>
      <div className="container">
        {board.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state__icon">🏆</div>
            <div className="empty-state__text">Aún no hay puntos. ¡Empieza a pronosticar para aparecer aquí!</div>
          </div>
        ) : (
          <div className="leaderboard">
            <table className="leaderboard__table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Jugador</th>
                  <th>Puntos</th>
                  <th>Exacto (5pt)</th>
                  <th>Correcto (3pt)</th>
                  <th>Pronósticos</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {board.map((entry, i) => (
                  <tr
                    key={entry.id}
                    className={entry.id === user?.userId ? 'leaderboard__highlight' : ''}
                  >
                    <td>
                      <span className={`leaderboard__rank leaderboard__rank--${i + 1}`}>
                        {rankEmoji(i)}
                      </span>
                    </td>
                    <td>
                      <div className="leaderboard__name-cell">
                        <span className="leaderboard__name">{entry.username}</span>
                        {entry.id === user?.userId && (
                          <span className="leaderboard__you">you</span>
                        )}
                        <div className="leaderboard__inline-stats">
                          <span>★ {entry.exact}</span>
                          <span>✓ {entry.correct}</span>
                          <span>📊 {entry.predictions}</span>
                        </div>
                      </div>
                    </td>
                    <td><span className="leaderboard__points">{entry.points}</span></td>
                    <td className="leaderboard__col-stat">{entry.exact}</td>
                    <td className="leaderboard__col-stat">{entry.correct}</td>
                    <td className="leaderboard__col-stat">{entry.predictions}</td>
                    <td>
                      <button
                        className="leaderboard__view-btn"
                        onClick={() => navigate(`/players/${entry.id}`)}
                        title={`Ver pronósticos de ${entry.username}`}
                      >
                        Ver
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
