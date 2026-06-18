import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useRefreshKey } from '../contexts/DataRefreshContext.jsx';

function FlagImg({ code, name }) {
  if (!code) return <span>🏳</span>;
  return (
    <img
      src={`https://flagcdn.com/w40/${code}.png`}
      srcSet={`https://flagcdn.com/w80/${code}.png 2x`}
      alt={name}
      width={24}
      height={18}
      style={{ verticalAlign: 'middle' }}
    />
  );
}

function formatDate(dateStr) {
  if (!dateStr) return '–';
  return new Date(dateStr).toLocaleDateString('es-ES', {
    weekday: 'short', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
  });
}

function pointsBadge(points) {
  if (points == null) return <span className="user-pred__badge user-pred__badge--pending">–</span>;
  if (points === 5) return <span className="user-pred__badge user-pred__badge--exact">5pt</span>;
  if (points === 3) return <span className="user-pred__badge user-pred__badge--correct">3pt</span>;
  return <span className="user-pred__badge user-pred__badge--wrong">0pt</span>;
}

export default function UserPredictions() {
  const refreshKey = useRefreshKey();
  const { userId } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetch(`/api/predictions/user/${userId}`, { credentials: 'include' })
      .then((r) => {
        if (!r.ok) throw new Error('No encontrado');
        return r.json();
      })
      .then((d) => { setData(d); setLoading(false); })
      .catch((e) => { setError(e.message); setLoading(false); });
  }, [userId, refreshKey]);

  if (loading) return <div className="loading">Cargando pronósticos…</div>;
  if (error) return <div className="loading">{error}</div>;

  const { user, predictions } = data;
  const scored = predictions.filter((p) => p.points != null);
  const total = scored.reduce((s, p) => s + p.points, 0);
  const exact = scored.filter((p) => p.points === 5).length;
  const correct = scored.filter((p) => p.points === 3).length;

  return (
    <div>
      <div className="page-header">
        <div className="container">
          <button className="user-pred__back" onClick={() => navigate('/leaderboard')}>
            ← Clasificación
          </button>
          <h1>Pronósticos de {user.username}</h1>
          <p>
            {predictions.length} pronósticos · {total} pts · {exact} exactos · {correct} correctos
          </p>
        </div>
      </div>

      <div className="container">
        {predictions.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state__icon">🔮</div>
            <div className="empty-state__text">Este jugador aún no tiene pronósticos.</div>
          </div>
        ) : (
          <div className="user-pred__list">
            {predictions.map((pred) => {
              const m = pred.match;
              const homeName = m.homeTeam?.name || m.homeTeamLabel || '?';
              const awayName = m.awayTeam?.name || m.awayTeamLabel || '?';
              const homeFlag = m.homeTeam?.flag;
              const awayFlag = m.awayTeam?.flag;
              const hasResult = m.homeScore != null && m.awayScore != null;

              return (
                <div key={pred.id} className={`user-pred__item user-pred__item--${pred.points === 5 ? 'exact' : pred.points === 3 ? 'correct' : pred.points === 0 ? 'wrong' : 'pending'}`}>
                  <div className="user-pred__meta">
                    <div className="user-pred__meta-info">
                      <span className="user-pred__round">{m.round}{m.group ? ` · ${m.group}` : ''}</span>
                      <span className="user-pred__date">{formatDate(m.date)}</span>
                    </div>
                    <div className="user-pred__points">
                      {pointsBadge(pred.points)}
                    </div>
                  </div>
                  {m.matchStatus === 'PLAYING' && (
                    <div style={{ textAlign: 'center' }}>
                      <span className="live-badge">
                        <span className="live-badge__dot" />
                        EN VIVO
                      </span>
                    </div>
                  )}

                  <div className="user-pred__match">
                    <div className="user-pred__team user-pred__team--home">
                      <span>{homeName}</span>
                      <FlagImg code={homeFlag} name={homeName} />
                    </div>

                    <div className="user-pred__scores">
                      <div className="user-pred__score-block">
                        <span className="user-pred__score-label">Pronóstico</span>
                        <span className="user-pred__score">{pred.homeScore} – {pred.awayScore}</span>
                      </div>
                      {hasResult && (
                        <div className="user-pred__score-block user-pred__score-block--result">
                          <span className="user-pred__score-label">Resultado</span>
                          <span className="user-pred__score">{m.homeScore} – {m.awayScore}</span>
                        </div>
                      )}
                    </div>

                    <div className="user-pred__team user-pred__team--away">
                      <FlagImg code={awayFlag} name={awayName} />
                      <span>{awayName}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
