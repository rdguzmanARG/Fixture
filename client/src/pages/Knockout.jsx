import { useState, useEffect, useCallback } from 'react';
import BracketDiagram from '../components/BracketDiagram.jsx';
import { useRefreshKey } from '../contexts/DataRefreshContext.jsx';

export default function Knockout() {
  const refreshKey = useRefreshKey();
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    const r = await fetch('/api/matches', { credentials: 'include' });
    if (r.ok) {
      const all = await r.json();
      setMatches(all.filter((m) => m.round !== 'Group'));
    }
    setLoading(false);
  }, [refreshKey]);

  useEffect(() => { load(); }, [load]);

  if (loading) return <div className="loading">Cargando eliminatorias…</div>;

  const hasTeams = (m) => m.homeTeam || m.awayTeam;
  const assignedMatches = matches.filter(hasTeams);
  const completedCount = assignedMatches.filter((m) => m.userPrediction).length;

  return (
    <div>
      <div className="page-header">
        <div className="container">
          <h1>🏆 Fase Eliminatoria</h1>
          <p>Pronósticos: {completedCount} / {assignedMatches.length} partidos</p>
        </div>
      </div>
      <div className="container">
        <BracketDiagram matches={matches} />
      </div>
    </div>
  );
}
