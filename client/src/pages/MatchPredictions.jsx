import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

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

function pointsBadge(points) {
  if (points == null) return <span className="match-preds__badge match-preds__badge--pending">–</span>;
  if (points === 5) return <span className="match-preds__badge match-preds__badge--exact">5pt</span>;
  if (points === 3) return <span className="match-preds__badge match-preds__badge--correct">3pt</span>;
  return <span className="match-preds__badge match-preds__badge--wrong">0pt</span>;
}

function liveItemClass(pred, match) {
  if (match.matchStatus !== 'PLAYING' || match.homeScore == null) return null;
  if (pred.homeScore === match.homeScore && pred.awayScore === match.awayScore) return 'live-exact';
  const matchOutcome = Math.sign(match.homeScore - match.awayScore);
  const predOutcome = Math.sign(pred.homeScore - pred.awayScore);
  if (matchOutcome === predOutcome) return 'live-correct';
  return null;
}

export default function MatchPredictions() {
  const { matchId } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetch(`/api/predictions/match/${matchId}`, { credentials: 'include' })
      .then((r) => {
        if (!r.ok) throw new Error('No encontrado');
        return r.json();
      })
      .then((d) => { setData(d); setLoading(false); })
      .catch((e) => { setError(e.message); setLoading(false); });
  }, [matchId]);

  if (loading) return <div className="loading">Cargando pronósticos…</div>;
  if (error) return <div className="loading">{error}</div>;

  const { match, predictions } = data;
  const homeName = match.homeTeam?.name || match.homeTeamLabel || '?';
  const awayName = match.awayTeam?.name || match.awayTeamLabel || '?';
  const homeFlag = match.homeTeam?.flag;
  const awayFlag = match.awayTeam?.flag;
  const hasResult = match.homeScore != null && match.awayScore != null;

  const sortedPredictions = [...predictions].sort((a, b) => {
    const group = (p) => (p.homeScore > p.awayScore ? 0 : p.homeScore === p.awayScore ? 1 : 2);
    const ga = group(a), gb = group(b);
    if (ga !== gb) return ga - gb;
    if (ga === 0) return b.homeScore - a.homeScore; // home win: more home goals first
    if (ga === 1) return b.homeScore - a.homeScore; // tie: higher score first
    if (a.awayScore !== b.awayScore) return a.awayScore - b.awayScore; // away win: fewer away goals first
    return a.homeScore - b.homeScore;
  });

  return (
    <div>
      <div className="page-header page-header--sticky">
        <div className="container">
          <button className="user-pred__back" onClick={() => navigate(-1)}>
            ← Volver
          </button>
          <div className="match-preds__header-match">
            <div className="match-preds__header-team">
              <FlagImg code={homeFlag} name={homeName} />
              <span>{homeName}</span>
            </div>
            <div className="match-preds__header-score">
              {hasResult
                ? <><span>{match.homeScore}</span><span className="match-preds__header-sep">–</span><span>{match.awayScore}</span></>
                : <span className="match-preds__header-vs">vs</span>
              }
            </div>
            <div className="match-preds__header-team match-preds__header-team--away">
              <FlagImg code={awayFlag} name={awayName} />
              <span>{awayName}</span>
            </div>
          </div>
          {match.matchStatus === 'PLAYING' && (
            <div className="match-preds__live-row">
              <span className="live-badge">
                <span className="live-badge__dot" />
                EN VIVO
              </span>
            </div>
          )}
          <p>{predictions.length} pronósticos</p>
        </div>
      </div>

      <div className="container">
        {predictions.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state__icon">🔮</div>
            <div className="empty-state__text">Nadie ha pronosticado este partido aún.</div>
          </div>
        ) : (
          <div className="match-preds__list">
            {sortedPredictions.map((pred) => {
              const live = liveItemClass(pred, match);
              const itemMod = live ?? (pred.points === 5 ? 'exact' : pred.points === 3 ? 'correct' : pred.points === 0 ? 'wrong' : 'pending');
              return (
              <div
                key={pred.id}
                className={`match-preds__item match-preds__item--${itemMod}`}
              >
                <button
                  className="match-preds__user"
                  onClick={() => navigate(`/players/${pred.user.id}`)}
                >
                  {pred.user.username}
                </button>
                <div className="match-preds__score">
                  {pred.homeScore} – {pred.awayScore}
                </div>
                {pointsBadge(pred.points)}
              </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
