import { useState, useEffect, useCallback } from 'react';
import MatchCard from '../components/MatchCard.jsx';
import { useRefreshKey } from '../contexts/DataRefreshContext.jsx';

function formatDateGroup(dateStr) {
  if (!dateStr) return 'Sin fecha';
  return new Date(dateStr).toLocaleDateString('es-ES', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
  });
}

export default function AllMatches() {
  const refreshKey = useRefreshKey();
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showOnlyFinalized, setShowOnlyFinalized] = useState(false);

  const load = useCallback(async () => {
    const r = await fetch('/api/matches', { credentials: 'include' });
    if (r.ok) setMatches(await r.json());
    setLoading(false);
  }, [refreshKey]);

  useEffect(() => { load(); }, [load]);

  if (loading) return <div className="loading">Cargando fixture…</div>;

  const hasTeams = (m) => m.homeTeam && m.awayTeam;
  const filtered = showOnlyFinalized
    ? matches.filter((m) => hasTeams(m) && m.matchStatus.endsWith('ED'))
    : matches.filter((m) => hasTeams(m) && !m.matchStatus.endsWith('ED'));

  const sorted = [...filtered].sort((a, b) => {
    if (!a.date) return 1;
    if (!b.date) return -1;
    const diff = new Date(a.date) - new Date(b.date);
    return showOnlyFinalized ? -diff : diff;
  });

  const groups = [];
  const groupMap = new Map();
  for (const m of sorted) {
    const key = m.date ? new Date(m.date).toDateString() : 'Sin fecha';
    if (!groupMap.has(key)) {
      const group = { key, label: formatDateGroup(m.date), items: [] };
      groupMap.set(key, group);
      groups.push(group);
    }
    groupMap.get(key).items.push(m);
  }

  const withoutPrediction = matches.filter((m) => hasTeams(m) && !m.userPrediction).length;
  const totalWithTeams = matches.filter(hasTeams).length;

  return (
    <div>
      <div className="page-header">
        <div className="container">
          <h1>⚽ Todos los Partidos</h1>
          <p>Sin pronóstico: {withoutPrediction} / {totalWithTeams} partidos</p>
        </div>
      </div>

      <div className="container">
        <div className="all-matches__filter">
          <label className="all-matches__toggle">
            <input
              type="checkbox"
              checked={showOnlyFinalized}
              onChange={(e) => setShowOnlyFinalized(e.target.checked)}
            />
            Solo partidos finalizados
          </label>
        </div>

        {groups.length === 0 && (
          <div className="empty-state">
            <div className="empty-state__icon">🎉</div>
            <div className="empty-state__text">¡Todos los partidos tienen pronóstico!</div>
          </div>
        )}

        {groups.map(({ key, label, items }) => (
          <div key={key} className="match-day">
            <div className="match-day__label">{label}</div>
            <div className="matches-grid">
              {items.map((m) => (
                <MatchCard key={m.id} match={m} onPredictionSaved={load} onResultSet={load} />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
