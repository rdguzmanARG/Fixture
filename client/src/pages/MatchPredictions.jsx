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

  const outcomeRank = (p) => (p.homeScore > p.awayScore ? 0 : p.homeScore === p.awayScore ? 1 : 2);
  const sortedPredictions = hasResult
    ? predictions
    : [...predictions].sort((a, b) => outcomeRank(a) - outcomeRank(b));

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
            {sortedPredictions.map((pred) => (
              <div
                key={pred.id}
                className={`match-preds__item match-preds__item--${pred.points === 5 ? 'exact' : pred.points === 3 ? 'correct' : pred.points === 0 ? 'wrong' : 'pending'}`}
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
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
