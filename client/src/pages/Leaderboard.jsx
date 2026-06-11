import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext.jsx';

export default function Leaderboard() {
  const { user } = useAuth();
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
          <p>{board.length} participantes · Resultado exacto = 3pts · Resultado correcto = 1pt</p>
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
                  <th>Exacto (3pt)</th>
                  <th>Correcto (1pt)</th>
                  <th>Pronósticos</th>
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
                      <span className="leaderboard__name">{entry.name}</span>
                      {entry.id === user?.userId && (
                        <span className="leaderboard__you">you</span>
                      )}
                    </td>
                    <td><span className="leaderboard__points">{entry.points}</span></td>
                    <td>{entry.exact}</td>
                    <td>{entry.correct}</td>
                    <td>{entry.predictions}</td>
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
